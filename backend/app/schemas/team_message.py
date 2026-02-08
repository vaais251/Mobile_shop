"""
Pydantic schemas for team messages.
"""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.models.team_message import MessageType


class TeamMessageBase(BaseModel):
    """Base schema for team messages"""
    content: str = Field(..., min_length=1, max_length=5000)


class TeamMessageCreate(TeamMessageBase):
    """Schema for creating a new team message"""
    pass


class TeamMessageResponse(TeamMessageBase):
    """Schema for team message response"""
    id: int
    sender_id: Optional[int]
    message_type: MessageType
    receiver_id: Optional[int]
    read: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    # Nested sender info
    sender: Optional["UserBasic"] = None
    receiver: Optional["UserBasic"] = None

    class Config:
        from_attributes = True


class UserBasic(BaseModel):
    """Basic user info for sender/receiver"""
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


class ConversationPreview(BaseModel):
    """Preview of a conversation with another team member"""
    team_member_id: int
    team_member_name: str
    team_member_email: str
    team_member_role: str
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0


class UnreadCountResponse(BaseModel):
    """Unread message count response"""
    unread_count: int


# Update forward references
TeamMessageResponse.model_rebuild()
