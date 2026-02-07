"""
API v1 routers package.
"""

from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.phones import router as phones_router
from app.api.v1.admin import router as admin_router
from app.api.v1.orders import router as orders_router
from app.api.v1.chat import router as chat_router
from app.api.v1.messages import router as messages_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.admin_orders import router as admin_orders_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(phones_router)
api_router.include_router(admin_router)
api_router.include_router(admin_orders_router)
api_router.include_router(orders_router)
api_router.include_router(chat_router)
api_router.include_router(messages_router)
api_router.include_router(notifications_router)

__all__ = ["api_router"]

