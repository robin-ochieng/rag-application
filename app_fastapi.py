import os
import time
import logging
from typing import Any, Dict

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from rag_core import ask

PUBLIC_CLIENT_ORIGIN = os.getenv("PUBLIC_CLIENT_ORIGIN", "*")
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
    allow_origins=[PUBLIC_CLIENT_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting: 10 requests/minute per client IP
limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, limiter._rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


class ChatRequest(BaseModel):
    message: str


@app.get("/healthz")
async def healthz(x_api_key: str | None = Header(default=None, alias="X-API-KEY")) -> Dict[str, Any]:
    if BACKEND_API_KEY and x_api_key != BACKEND_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"ok": True}


@app.post("/chat")
@limiter.limit("10/minute")
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
