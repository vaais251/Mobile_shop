"""
API v1 routers package.
"""

from fastapi import APIRouter
from app.api.v1 import (
    auth,
    phones,
    orders,
    admin,
    messages,
    chat,
    notifications,
    admin_orders,
    team,
    commissions,
    team_messages,
)

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(phones.router)
api_router.include_router(orders.router)
api_router.include_router(admin.router)
api_router.include_router(messages.router)
api_router.include_router(chat.router)
api_router.include_router(notifications.router)
api_router.include_router(admin_orders.router)
api_router.include_router(team.router)
api_router.include_router(commissions.router)
api_router.include_router(team_messages.router)

__all__ = ["api_router"]
