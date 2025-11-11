"""
Main entry point for Talash Backend API
FastAPI application with Firebase authentication and item management
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.db import init_db
from app.routes import auth_routes, items_routes, admin_routes

# Initialize FastAPI app
app = FastAPI(
    title="Talash API",
    description="Campus Lost and Found Portal Backend",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (uploads)
if not os.path.exists("uploads"):
    os.makedirs("uploads")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Initialize database
init_db()

# Register routes
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Auth"])
app.include_router(items_routes.router, prefix="/api/items", tags=["Items"])
app.include_router(admin_routes.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Talash API",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "message": "Backend is running successfully"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
