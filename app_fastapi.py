import os
import re
import time
import logging
from typing import Any, Dict

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Make slowapi optional to avoid import warnings when it's not installed
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

from rag_core import ask

_origins_raw = os.getenv("PUBLIC_CLIENT_ORIGIN", "*")
ALLOWED_ORIGINS = [o.strip() for o in _origins_raw.split(",") if o.strip()]
ORIGIN_REGEX_STR = os.getenv("PUBLIC_CLIENT_ORIGIN_REGEX")
ORIGIN_REGEX = re.compile(ORIGIN_REGEX_STR) if ORIGIN_REGEX_STR else None
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY")

# Configure basic structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("app")

app = FastAPI()

# Strict CORS: lock to configured origin only
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ORIGIN_REGEX.pattern if ORIGIN_REGEX else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(
    "CORS configured",
    extra={
        "allow_origins": ALLOWED_ORIGINS,
        "allow_origin_regex": ORIGIN_REGEX.pattern if ORIGIN_REGEX else None,
    },
)

# Rate limiting: 10 requests/minute per client IP (optional if slowapi available)
limiter = None
if _SLOWAPI_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])  # type: ignore[arg-type]
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
        "endpoints": {
            "health": "/healthz",
            "chat": {"path": "/chat", "method": "POST"},
            "docs": "/docs",
        },
    }


@app.get("/healthz")
async def healthz(x_api_key: str | None = Header(default=None, alias="X-API-KEY")) -> Dict[str, Any]:
    if BACKEND_API_KEY and x_api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"ok": True}


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
        return {
            "message": req.message,
            "answer": result.get("answer", ""),
            "sources": result.get("sources", []),
        }
    finally:
        latency_ms = (time.perf_counter() - start) * 1000
        size = len(req.message or "")
        logger.info(
            "chat request processed",
            extra={
                "path": str(request.url.path),
                "client": request.client.host if request.client else None,
                "msg_size": size,
                "latency_ms": round(latency_ms, 2),
            },
        )
