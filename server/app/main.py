import os
import re
import time
import logging
from typing import Any, Dict, AsyncGenerator

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler  # type: ignore
    from slowapi.util import get_remote_address  # type: ignore
    from slowapi.errors import RateLimitExceeded  # type: ignore
    from slowapi.middleware import SlowAPIMiddleware  # type: ignore
    _SLOWAPI_AVAILABLE = True
except Exception:  # pragma: no cover - optional dependency fallback
    Limiter = None  # type: ignore
    get_remote_address = None  # type: ignore
    class RateLimitExceeded(Exception):
        ...
    SlowAPIMiddleware = None  # type: ignore
    def _rate_limit_exceeded_handler(*_args, **_kwargs):  # type: ignore
        raise RateLimitExceeded()
    _SLOWAPI_AVAILABLE = False

TEST_MODE = os.getenv("TEST_MODE") in {"1", "true", "True", "yes", "on"}

if TEST_MODE:
    def ask(q: str) -> Dict[str, Any]:
        return {"answer": f"Echo: {q}", "sources": []}
else:
    from rag_core import ask, ask_stream  # type: ignore

load_dotenv()

_origins_raw = os.getenv("PUBLIC_CLIENT_ORIGIN", "*")
ALLOWED_ORIGINS = [o.strip() for o in _origins_raw.split(",") if o.strip()]
if ALLOWED_ORIGINS == ["*"]:
    ALLOWED_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

cloud_run_frontend = os.getenv("CLOUD_RUN_FRONTEND_URL")
if cloud_run_frontend:
    ALLOWED_ORIGINS.append(cloud_run_frontend.strip())

extra_origins = os.getenv("ADDITIONAL_CORS_ORIGINS", "")
if extra_origins:
    for origin in extra_origins.split(","):
        value = origin.strip()
        if value:
            ALLOWED_ORIGINS.append(value)

unique_origins: list[str] = []
for origin in ALLOWED_ORIGINS:
    if origin and origin not in unique_origins:
        unique_origins.append(origin)
ALLOWED_ORIGINS = unique_origins
ORIGIN_REGEX_STR = os.getenv("PUBLIC_CLIENT_ORIGIN_REGEX")
ORIGIN_REGEX = re.compile(ORIGIN_REGEX_STR) if ORIGIN_REGEX_STR else None
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("app")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ORIGIN_REGEX.pattern if ORIGIN_REGEX else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = None
if _SLOWAPI_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address)  # type: ignore
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
    app.add_middleware(SlowAPIMiddleware)  # type: ignore[arg-type]

def _no_limit(_rule: str):
    def _decorator(func):
        return func
    return _decorator

limit = limiter.limit if limiter else _no_limit


class ChatRequest(BaseModel):
    message: str


@app.get("/")
async def root() -> Dict[str, Any]:
    return {
        "ok": True,
        "message": "Insurance Act Chatbot API",
        "endpoints": {"health": "/healthz", "chat": {"path": "/chat", "method": "POST"}, "docs": "/docs"},
    }


@app.get("/healthz")
async def healthz(x_api_key: str | None = Header(default=None, alias="X-API-KEY")) -> Dict[str, Any]:
    return {"ok": True}


class AskRequest(BaseModel):
    q: str


@app.post("/ask")
@limit("60/minute")
async def ask_route(
    req: AskRequest,
    request: Request,
    x_api_key: str | None = Header(default=None, alias="X-API-KEY"),
) -> Dict[str, Any]:
    if BACKEND_API_KEY and x_api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    start = time.perf_counter()
    try:
        try:
            result = ask(req.q)
            return {"answer": result.get("answer", ""), "sources": result.get("sources", [])}
        except Exception as e:  # return structured JSON error
            logger.exception("ask failed")
            raise HTTPException(status_code=500, detail=str(e))
    finally:
        latency_ms = (time.perf_counter() - start) * 1000
        size = len(req.q or "")
        logger.info("ask request processed", extra={"path": str(request.url.path), "msg_size": size, "latency_ms": round(latency_ms, 2)})


from fastapi.responses import StreamingResponse
import json


@app.post("/ask-stream")
@limit("120/minute")
async def ask_stream_route(
    req: AskRequest,
    request: Request,
    x_api_key: str | None = Header(default=None, alias="X-API-KEY"),
):
    if BACKEND_API_KEY and x_api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    async def event_gen() -> AsyncGenerator[bytes, None]:
        try:
            async for evt in ask_stream(req.q):  # type: ignore
                line = json.dumps(evt, ensure_ascii=False)
                yield f"data: {line}\n\n".encode("utf-8")
            yield b"data: [DONE]\n\n"
        except Exception as e:
            # Send error event if streaming fails
            error_line = json.dumps({"type": "error", "message": str(e)}, ensure_ascii=False)
            yield f"data: {error_line}\n\n".encode("utf-8")

    return StreamingResponse(
        event_gen(), 
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@app.post("/chat")
@limit("10/minute")
async def chat(
    req: ChatRequest,
    request: Request,
    x_api_key: str | None = Header(default=None, alias="X-API-KEY"),
) -> Dict[str, Any]:
    if BACKEND_API_KEY and x_api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    start = time.perf_counter()
    try:
        result = ask(req.message)
        return {"message": req.message, "answer": result.get("answer", ""), "sources": result.get("sources", [])}
    finally:
        latency_ms = (time.perf_counter() - start) * 1000
        size = len(req.message or "")
        logger.info("chat request processed", extra={"path": str(request.url.path), "msg_size": size, "latency_ms": round(latency_ms, 2)})
