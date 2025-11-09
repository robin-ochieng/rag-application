"""
Vercel serverless function handler for simplified API endpoints.
This is a lightweight version that doesn't include heavy ML dependencies.
"""

import os
import json
from typing import Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mangum import Mangum

# Create a simplified FastAPI app for serverless deployment
app = FastAPI(title="Kenbright GPT API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    q: str

class ChatRequest(BaseModel):
    message: str

@app.get("/")
async def root() -> Dict[str, Any]:
    return {
        "ok": True,
        "message": "Kenbright GPT API - Serverless Version",
        "endpoints": {
            "health": "/healthz", 
            "chat": {"path": "/chat", "method": "POST"},
            "ask": {"path": "/ask", "method": "POST"}
        },
        "note": "This is a lightweight serverless version. For full ML capabilities, use the full backend."
    }

@app.get("/healthz")
async def healthz() -> Dict[str, Any]:
    return {"ok": True, "status": "healthy", "version": "serverless"}

@app.post("/ask")
async def ask_route(req: AskRequest) -> Dict[str, Any]:
    """
    Simplified ask endpoint for serverless deployment.
    In production, this would proxy to your full ML backend or use a different approach.
    """
    return {
        "answer": "This is a simplified serverless version. Please use the full backend for complete RAG functionality.",
        "sources": [],
        "note": "For full functionality, deploy the complete backend with ML dependencies."
    }

@app.post("/chat")
async def chat_route(req: ChatRequest) -> Dict[str, Any]:
    """
    Simplified chat endpoint for serverless deployment.
    """
    return {
        "message": req.message,
        "answer": "This is a simplified serverless version. Please use the full backend for complete RAG functionality.",
        "sources": [],
        "note": "For full functionality, deploy the complete backend with ML dependencies."
    }

# Wrap the FastAPI app with Mangum for serverless deployment
handler = Mangum(app)