"""
Notification model for admin alerts and system notifications.

Features:
- Notification types (new_listing, new_order, verification_request)
- Read/unread status tracking
- Timestamped notifications
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, Text
)

from app.core.database import Base


class NotificationType(str, enum.Enum):
    """Notification type enumeration."""
    NEW_LISTING = "new_listing"           # New phone listing submitted
    NEW_ORDER = "new_order"               # New order placed
    VERIFICATION_REQUEST = "verification_request"  # Seller verification request
    LISTING_APPROVED = "listing_approved" # Listing was approved
    LISTING_REJECTED = "listing_rejected" # Listing was rejected


class Notification(Base):
    """
    Notification model for admin system alerts.
    
    Attributes:
        id: Primary key
        type: Type of notification (new_listing, new_order, etc.)
        title: Short notification title
        message: Detailed notification message
        is_read: Whether the notification has been read
        created_at: Timestamp when notification was created
        related_id: ID of related entity (phone_id, order_id, user_id)
    """
    
    __tablename__ = "notifications"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Notification details
    type = Column(
        Enum(NotificationType),
        nullable=False,
        index=True
    )
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    
    # Metadata
    related_id = Column(
        Integer,
        nullable=True,
        comment="ID of related entity (phone, order, user)"
    )
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self) -> str:
        return f"<Notification(id={self.id}, type={self.type.value}, is_read={self.is_read})>"
