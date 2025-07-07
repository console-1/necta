# NECTA Backend Main Application
# This will be the FastAPI application entry point

from fastapi import FastAPI

app = FastAPI(
    title="NECTA Backend",
    description="Chat Interface for n8n AI Agents - Backend API",
    version="0.1.0",
)

@app.get("/")
async def root():
    return {"message": "NECTA Backend API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "necta-backend"}