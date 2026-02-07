"""
Messages Model for admin-user communication.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Message(Base):
    """Message model for admin-user communication."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    
    # Sender info (can be null for guest users)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    sender_name = Column(String(100), nullable=False)
    sender_email = Column(String(255), nullable=False)
    
    # Message content
    content = Column(Text, nullable=False)
    
    # Status
    is_read = Column(Boolean, default=False)
    is_from_admin = Column(Boolean, default=False)
    
    # Parent message for replies
    parent_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sender = relationship("User", back_populates="messages", foreign_keys=[sender_id])
    parent = relationship("Message", remote_side=[id], backref="replies")
