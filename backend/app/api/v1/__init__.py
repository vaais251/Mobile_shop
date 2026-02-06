"""
API v1 routers package.
"""

from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.phones import router as phones_router
from app.api.v1.admin import router as admin_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(phones_router)
api_router.include_router(admin_router)

__all__ = ["api_router"]
