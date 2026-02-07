"""
Pydantic schemas for Notification endpoints.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.notification import NotificationType


class NotificationBase(BaseModel):
    """Base notification schema."""
    type: NotificationType
    title: str
    message: str
    related_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""
    pass


class NotificationResponse(NotificationBase):
    """Schema for notification response."""
    id: int
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationUpdate(BaseModel):
    """Schema for updating a notification."""
    is_read: Optional[bool] = None
