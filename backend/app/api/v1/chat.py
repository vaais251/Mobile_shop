from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from sqlalchemy import or_, and_

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.chat import ChatMessage
from app.models.user import User
from app.schemas.chat import MessageCreate, MessageResponse, ConversationResponse

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/messages", response_model=MessageResponse)
async def send_message(
    msg_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if receiver exists
    receiver = db.query(User).filter(User.id == msg_data.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    new_msg = ChatMessage(
        sender_id=current_user.id,
        receiver_id=msg_data.receiver_id,
        phone_id=msg_data.phone_id,
        message=msg_data.content,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    return new_msg

@router.get("/messages/{other_user_id}", response_model=List[MessageResponse])
async def get_messages(
    other_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    messages = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == other_user_id),
            and_(ChatMessage.sender_id == other_user_id, ChatMessage.receiver_id == current_user.id)
        )
    ).order_by(ChatMessage.created_at.asc()).all()
    
    # Mark messages as read
    unread = [m for m in messages if m.receiver_id == current_user.id and not m.is_read]
    for m in unread:
        m.is_read = True
    if unread:
        db.commit()
        
    return messages

@router.get("/conversations", response_model=List[ConversationResponse])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # This is a bit complex in raw SQL, but here's a simplified version
    # Get all users the current user has interacted with
    sent_to = db.query(ChatMessage.receiver_id).filter(ChatMessage.sender_id == current_user.id)
    received_from = db.query(ChatMessage.sender_id).filter(ChatMessage.receiver_id == current_user.id)
    user_ids = [uid[0] for uid in sent_to.union(received_from).all()]
    
    conversations = []
    for uid in user_ids:
        other_user = db.query(User).filter(User.id == uid).first()
        if not other_user: continue
        
        last_msg = db.query(ChatMessage).filter(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == uid),
                and_(ChatMessage.sender_id == uid, ChatMessage.receiver_id == current_user.id)
            )
        ).order_by(ChatMessage.created_at.desc()).first()
        
        unread_count = db.query(ChatMessage).filter(
            ChatMessage.sender_id == uid,
            ChatMessage.receiver_id == current_user.id,
            ChatMessage.is_read == False
        ).count()
        
        conversations.append({
            "other_user_id": other_user.id,
            "other_user_name": other_user.name,
            "last_message": last_msg.message if last_msg else "",
            "last_message_at": last_msg.created_at if last_msg else datetime.utcnow(),
            "unread_count": unread_count,
            "phone_id": last_msg.phone_id if last_msg else None
        })
    
    return sorted(conversations, key=lambda x: x["last_message_at"], reverse=True)

@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the total number of unread messages for the current user."""
    count = db.query(ChatMessage).filter(
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    ).count()
    return {"count": count}

@router.delete("/conversations/{other_user_id}")
async def delete_conversation(
    other_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete all messages in a conversation between current user and another user.
    Available to all users to delete their own conversations.
    """
    # Delete all messages between these two users
    deleted = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == other_user_id),
            and_(ChatMessage.sender_id == other_user_id, ChatMessage.receiver_id == current_user.id)
        )
    ).delete()
    
    db.commit()
    return {"deleted_count": deleted, "message": "Conversation deleted successfully"}
