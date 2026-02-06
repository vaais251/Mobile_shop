from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MessageCreate(BaseModel):
    receiver_id: int
    content: str = Field(..., alias="message")
    phone_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    phone_id: Optional[int]
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    other_user_id: int
    other_user_name: str
    last_message: str
    last_message_at: datetime
    unread_count: int
    phone_id: Optional[int] = None
