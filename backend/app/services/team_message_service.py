"""
Service layer for team messages.
Handles business logic for team internal communication.
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from app.models import TeamMessage, MessageType, User, TeamMember
from app.schemas.team_message import TeamMessageCreate
from typing import List, Optional
from datetime import datetime


class TeamMessageService:
    """Service for team messaging operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def is_team_member(self, user_id: int) -> bool:
        """Check if user is an active team member or admin"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
        
        if user.role == "admin":
            return True
        
        team_member = self.db.query(TeamMember).filter(
            TeamMember.user_id == user_id,
            TeamMember.is_active == True
        ).first()
        
        return team_member is not None
    
    def get_team_members(self, exclude_user_id: int) -> List[User]:
        """Get all active team members excluding the current user"""
        # Get all team member user IDs
        team_member_ids = self.db.query(TeamMember.user_id).filter(
            TeamMember.is_active == True
        ).all()
        
        team_ids = [tm[0] for tm in team_member_ids]
        
        # Get users who are either team members or admins
        team_users = self.db.query(User).filter(
            or_(
                User.id.in_(team_ids),
                User.role == "admin"
            ),
            User.id != exclude_user_id
        ).all()
        
        return team_users
    
    def get_conversations(self, current_user_id: int) -> List[dict]:
        """Get list of team members the current user has chatted with"""
        # Subquery to get latest message timestamp for each conversation
        latest_messages = self.db.query(
            func.GREATEST(TeamMessage.sender_id, TeamMessage.receiver_id).label('user1'),
            func.LEAST(TeamMessage.sender_id, TeamMessage.receiver_id).label('user2'),
            func.max(TeamMessage.created_at).label('last_time')
        ).filter(
            TeamMessage.message_type == MessageType.DIRECT,
            or_(
                TeamMessage.sender_id == current_user_id,
                TeamMessage.receiver_id == current_user_id
            )
        ).group_by('user1', 'user2').subquery()
        
        # Get all team members
        team_members = self.get_team_members(exclude_user_id=current_user_id)
        
        conversations = []
        for member in team_members:
            # Get last message with this member
            last_msg = self.db.query(TeamMessage).filter(
                TeamMessage.message_type == MessageType.DIRECT,
                or_(
                    and_(TeamMessage.sender_id == current_user_id, TeamMessage.receiver_id == member.id),
                    and_(TeamMessage.sender_id == member.id, TeamMessage.receiver_id == current_user_id)
                )
            ).order_by(TeamMessage.created_at.desc()).first()
            
            # Get unread count
            unread_count = self.db.query(TeamMessage).filter(
                TeamMessage.sender_id == member.id,
                TeamMessage.receiver_id == current_user_id,
                TeamMessage.read == False,
                TeamMessage.message_type == MessageType.DIRECT
            ).count()
            
            conversations.append({
                "team_member_id": member.id,
                "team_member_name": member.name,
                "team_member_email": member.email,
                "team_member_role": member.role,
                "last_message": last_msg.content if last_msg else None,
                "last_message_time": last_msg.created_at if last_msg else None,
                "unread_count": unread_count
            })
        
        # Sort by last message time (most recent first)
        conversations.sort(key=lambda x: x["last_message_time"] or datetime.min, reverse=True)
        
        return conversations
    
    def get_direct_messages(self, current_user_id: int, other_user_id: int, limit: int = 50) -> List[TeamMessage]:
        """Get direct messages between two team members"""
        messages = self.db.query(TeamMessage).filter(
            TeamMessage.message_type == MessageType.DIRECT,
            or_(
                and_(TeamMessage.sender_id == current_user_id, TeamMessage.receiver_id == other_user_id),
                and_(TeamMessage.sender_id == other_user_id, TeamMessage.receiver_id == current_user_id)
            )
        ).order_by(TeamMessage.created_at.desc()).limit(limit).all()
        
        # Reverse to get chronological order
        return list(reversed(messages))
    
    def send_direct_message(
        self,
        sender_id: int,
        receiver_id: int,
        message: TeamMessageCreate
    ) -> TeamMessage:
        """Send a direct message to another team member"""
        # Verify receiver is a team member
        if not self.is_team_member(receiver_id):
            raise ValueError("Receiver is not an active team member")
        
        new_message = TeamMessage(
            sender_id=sender_id,
            receiver_id=receiver_id,
            message_type=MessageType.DIRECT,
            content=message.content,
            read=False
        )
        
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)
        
        return new_message
    
    def mark_messages_as_read(self, current_user_id: int, other_user_id: int) -> int:
        """Mark all unread messages from another user as read"""
        updated = self.db.query(TeamMessage).filter(
            TeamMessage.sender_id == other_user_id,
            TeamMessage.receiver_id == current_user_id,
            TeamMessage.read == False,
            TeamMessage.message_type == MessageType.DIRECT
        ).update({"read": True})
        
        self.db.commit()
        return updated
    
    def get_group_messages(self, limit: int = 100) -> List[TeamMessage]:
        """Get all group chat messages"""
        messages = self.db.query(TeamMessage).filter(
            TeamMessage.message_type == MessageType.GROUP
        ).order_by(TeamMessage.created_at.desc()).limit(limit).all()
        
        return list(reversed(messages))
    
    def send_group_message(self, sender_id: int, message: TeamMessageCreate) -> TeamMessage:
        """Send a message to the team group chat"""
        new_message = TeamMessage(
            sender_id=sender_id,
            receiver_id=None,
            message_type=MessageType.GROUP,
            content=message.content,
            read=False  # Group messages don't use read status
        )
        
        self.db.add(new_message)
        self.db.commit()
        self.db.refresh(new_message)
        
        return new_message
    
    def get_unread_count(self, user_id: int) -> int:
        """Get total unread direct messages for a user"""
        count = self.db.query(TeamMessage).filter(
            TeamMessage.receiver_id == user_id,
            TeamMessage.read == False,
            TeamMessage.message_type == MessageType.DIRECT
        ).count()
        
        return count
