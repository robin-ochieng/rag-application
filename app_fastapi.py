import os
from typing import Any, Dict, List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from rag_core import ask

PUBLIC_CLIENT_ORIGIN = os.getenv("PUBLIC_CLIENT_ORIGIN", "*")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[PUBLIC_CLIENT_ORIGIN] if PUBLIC_CLIENT_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/healthz")
async def healthz() -> Dict[str, Any]:
    return {"ok": True}


@app.post("/chat")
async def chat(req: ChatRequest) -> Dict[str, Any]:
    result = ask(req.message)
    return {
        "message": req.message,
        "answer": result.get("answer", ""),
        "sources": result.get("sources", []),
    }
