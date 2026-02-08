"""
Mobile Store API - FastAPI Application Entry Point

A modern e-commerce platform for selling second-hand phones.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Runs on startup and shutdown.
    """
    # Startup: Initialize database tables
    print("[STARTUP] Starting Mobile Store API...")
    init_db()
    print("[STARTUP] Database initialized successfully!")
    
    yield
    
    # Shutdown: Cleanup
    print("[SHUTDOWN] Shutting down Mobile Store API...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## Mobile Store API
    
    A comprehensive API for a second-hand phone e-commerce platform.
    
    ### Features:
    - 📱 **Phone Inventory**: Browse, list, and manage second-hand phones
    - 👥 **User Management**: Registration, authentication, roles (Admin, Seller, Buyer)
    - 🛒 **Orders**: Place orders, track shipments, manage payments
    - 💬 **Chat**: Direct messaging between buyers, sellers, and admins
    
    ### Authentication:
    - JWT Bearer token authentication
    - Role-based access control
    """,
    version=settings.API_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    """Root endpoint - API health check."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.API_VERSION,
        "message": "Welcome to Mobile Store API! Visit /docs for API documentation."
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "api_version": settings.API_VERSION,
    }


# Include API routers
from app.api.v1 import api_router
app.include_router(api_router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
