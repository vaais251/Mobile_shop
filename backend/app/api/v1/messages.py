"""
Messages API endpoints for admin-user communication.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin, get_optional_current_user
from app.models.message import Message
from app.models.user import User


router = APIRouter(prefix="/messages", tags=["Messages"])


# ============== Schemas ==============

class MessageCreate(BaseModel):
    """Schema for creating a message."""
    content: str
    sender_name: Optional[str] = None
    sender_email: Optional[str] = None


class MessageResponse(BaseModel):
    """Schema for message response."""
    id: int
    sender_id: Optional[int]
    sender_name: str
    sender_email: str
    content: str
    is_read: bool
    is_from_admin: bool
    parent_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminReplyCreate(BaseModel):
    """Schema for admin reply."""
    content: str
    user_email: str


# ============== User Endpoints ==============

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to admin.
    
    Works for both authenticated and guest users.
    """
    # Use authenticated user info if available
    sender_name = message_data.sender_name or (current_user.name if current_user else "Guest")
    sender_email = message_data.sender_email or (current_user.email if current_user else "anonymous@guest.com")
    
    message = Message(
        sender_id=current_user.id if current_user else None,
        sender_name=sender_name,
        sender_email=sender_email,
        content=message_data.content,
        is_from_admin=False
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message


@router.get("/my", response_model=List[MessageResponse])
async def get_my_messages(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all messages for the current user."""
    messages = db.query(Message).filter(
        (Message.sender_id == current_user.id) | 
        (Message.sender_email == current_user.email)
    ).order_by(Message.created_at.desc()).all()
    
    return messages


# ============== Admin Endpoints ==============

@router.get("/admin/all", response_model=List[MessageResponse])
async def get_all_messages(
    unread_only: bool = False,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all messages (admin only)."""
    query = db.query(Message).filter(Message.is_from_admin == False)
    
    if unread_only:
        query = query.filter(Message.is_read == False)
    
    messages = query.order_by(Message.created_at.desc()).all()
    
    return messages


@router.patch("/admin/{message_id}/read")
async def mark_as_read(
    message_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark a message as read."""
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.is_read = True
    db.commit()
    
    return {"status": "success"}


@router.post("/admin/reply", response_model=MessageResponse)
async def admin_reply(
    reply_data: AdminReplyCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Send a reply to a user (admin only).
    """
    # Find the user by email
    user = db.query(User).filter(User.email == reply_data.user_email).first()
    
    message = Message(
        sender_id=admin.id,
        sender_name=f"Admin ({admin.name})",
        sender_email=admin.email,
        content=reply_data.content,
        is_from_admin=True
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message


@router.delete("/admin/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a message (admin only)."""
    message = db.query(Message).filter(Message.id == message_id).first()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    db.delete(message)
    db.commit()
    
    return None
