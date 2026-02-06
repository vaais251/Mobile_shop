"""
Chat system model for communication between users and admin/sellers.

Features:
- Direct messaging between buyers and sellers
- Admin support chat
- Message read status tracking
- Optional phone reference for product inquiries
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Text
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ChatMessage(Base):
    """
    Chat message model for user communication.
    
    Supports:
    - Buyer to Seller communication (about specific phones)
    - Buyer to Admin support chat
    - Seller to Admin communication
    
    Attributes:
        id: Primary key
        sender_id: User ID of message sender
        receiver_id: User ID of message recipient
        phone_id: Optional reference to phone (for product inquiries)
        message: Message content
        is_read: Whether message has been read
        created_at: Message timestamp
    """
    
    __tablename__ = "chat_messages"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Participants
    sender_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    receiver_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Optional phone reference (for product inquiries)
    phone_id = Column(
        Integer,
        ForeignKey("phone_inventory.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Optional reference to phone being discussed"
    )
    
    # Message content
    message = Column(Text, nullable=False)
    
    # Message type (for UI display)
    message_type = Column(
        String(20),
        default="text",
        nullable=False,
        comment="Type: text, image, system"
    )
    
    # Status
    is_read = Column(Boolean, default=False, nullable=False)
    read_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # Relationships
    sender = relationship(
        "User",
        back_populates="sent_messages",
        foreign_keys=[sender_id]
    )
    receiver = relationship(
        "User",
        back_populates="received_messages",
        foreign_keys=[receiver_id]
    )
    phone = relationship(
        "PhoneInventory",
        foreign_keys=[phone_id]
    )
    
    def __repr__(self) -> str:
        return f"<ChatMessage(id={self.id}, sender={self.sender_id}, receiver={self.receiver_id})>"
    
    def mark_as_read(self) -> None:
        """Mark message as read with current timestamp."""
        self.is_read = True
        self.read_at = datetime.utcnow()


class ChatConversation(Base):
    """
    Helper model to track conversations between users.
    Useful for listing recent conversations and unread counts.
    """
    
    __tablename__ = "chat_conversations"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Participants (user1_id < user2_id to ensure uniqueness)
    user1_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user2_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Optional phone context
    phone_id = Column(
        Integer,
        ForeignKey("phone_inventory.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Last message info for preview
    last_message_id = Column(
        Integer,
        ForeignKey("chat_messages.id", ondelete="SET NULL"),
        nullable=True
    )
    last_message_at = Column(DateTime, nullable=True, index=True)
    
    # Unread counts
    user1_unread_count = Column(Integer, default=0, nullable=False)
    user2_unread_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    last_message = relationship("ChatMessage", foreign_keys=[last_message_id])
    
    def __repr__(self) -> str:
        return f"<ChatConversation(id={self.id}, users=[{self.user1_id}, {self.user2_id}])>"
