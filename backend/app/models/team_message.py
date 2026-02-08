"""
Team Message model for internal team communication.
Supports both direct messages between team members and group chat.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class MessageType(str, enum.Enum):
    """Types of team messages"""
    DIRECT = "DIRECT"  # Direct message between two team members
    GROUP = "GROUP"    # Group message in team channel


class TeamMessage(Base):
    """Team messages for internal communication"""
    __tablename__ = "team_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    message_type = Column(SQLEnum(MessageType), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_team_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_team_messages")

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "(message_type = 'DIRECT' AND receiver_id IS NOT NULL) OR (message_type = 'GROUP' AND receiver_id IS NULL)",
            name="check_message_type_receiver"
        ),
    )

    def __repr__(self):
        return f"<TeamMessage {self.id} - {self.message_type} from {self.sender_id}>"
