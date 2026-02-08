"""
Models package initialization.
Exports all SQLAlchemy models for easy importing.
"""

from app.models.user import User, UserRole
from app.models.phone_inventory import PhoneInventory, PhoneCondition
from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.chat import ChatMessage, ChatConversation
from app.models.message import Message
from app.models.notification import Notification, NotificationType
from app.models.product_rating import ProductRating
from app.models.team_member import TeamMember, TeamRole, Department
from app.models.commission import Commission, CommissionStatus
from app.models.audit_log import AuditLog, ActionType, ResourceType
from app.models.team_message import TeamMessage, MessageType

__all__ = [
    # User models
    "User",
    "UserRole",
    # Phone models
    "PhoneInventory",
    "PhoneCondition",
    # Order models
    "Order",
    "OrderItem",
    "OrderStatus",
    "PaymentMethod",
    # Chat models
    "ChatMessage",
    "ChatConversation",
    "Message",
    # Notification models
    "Notification",
    "NotificationType",
    # Rating models
    "ProductRating",
    # Enterprise models
    "TeamMember",
    "TeamRole",
    "Department",
    "Commission",
    "CommissionStatus",
    "AuditLog",
    "ActionType",
    "ResourceType",
    # Team messaging
    "TeamMessage",
    "MessageType",
]
