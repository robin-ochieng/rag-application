"""
Vercel serverless function handler for the FastAPI application.
This file allows Vercel to run our FastAPI app as serverless functions.
"""

from fastapi import FastAPI
from mangum import Mangum
from server.app.main import app

# Wrap the FastAPI app with Mangum for serverless deployment
handler = Mangum(app)