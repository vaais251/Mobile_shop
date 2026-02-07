"""
Database models package.
Import all models here to ensure they are registered with SQLAlchemy Base.
"""

from app.models.user import User, UserRole
from app.models.phone_inventory import PhoneInventory, PhoneCondition
from app.models.order import Order, OrderStatus, PaymentMethod, OrderItem
from app.models.chat import ChatMessage
from app.models.message import Message

__all__ = [
    # User models
    "User",
    "UserRole",
    # Phone inventory
    "PhoneInventory",
    "PhoneCondition",
    # Order models
    "Order",
    "OrderStatus",
    "PaymentMethod",
    "OrderItem",
    # Chat
    "ChatMessage",
    # Messages
    "Message",
]

