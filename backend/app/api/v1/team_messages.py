"""
API endpoints for team messaging.
Supports direct messaging between team members and team group chat.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models import User
from app.schemas.team_message import (
    TeamMessageCreate,
    TeamMessageResponse,
    ConversationPreview,
    UnreadCountResponse,
    UserBasic
)
from app.services.team_message_service import TeamMessageService

router = APIRouter(prefix="/team", tags=["Team Messaging"])


def verify_team_access(current_user: User, db: Session):
    """Verify user has access to team messaging"""
    service = TeamMessageService(db)
    if not service.is_team_member(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only team members can access this feature."
        )


@router.get("/members", response_model=List[UserBasic])
async def get_team_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of all team members (excluding current user).
    """
    verify_team_access(current_user, db)
    
    service = TeamMessageService(db)
    members = service.get_team_members(exclude_user_id=current_user.id)
    
    return [
        UserBasic(
            id=member.id,
            name=member.name,
            email=member.email,
            role=member.role
        )
        for member in members
    ]


@router.get("/conversations", response_model=List[ConversationPreview])
async def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get list of team conversations with unread counts and last message.
    """
    verify_team_access(current_user, db)
    
    service = TeamMessageService(db)
    conversations = service.get_conversations(current_user.id)
    
    return conversations


@router.get("/messages/{team_member_id}", response_model=List[TeamMessageResponse])
async def get_direct_messages(
    team_member_id: int,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get direct messages with another team member.
    Automatically marks messages as read.
    """
    verify_team_access(current_user, db)
    
    service = TeamMessageService(db)
    
    # Verify the other user is a team member
    if not service.is_team_member(team_member_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    # Get messages
    messages = service.get_direct_messages(current_user.id, team_member_id, limit)
    
    # Mark as read
    service.mark_messages_as_read(current_user.id, team_member_id)
    
    return messages


@router.post("/messages/{team_member_id}", response_model=TeamMessageResponse)
async def send_direct_message(
    team_member_id: int,
    message: TeamMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a direct message to another team member.
    """
    verify_team_access(current_user, db)
    
    service = TeamMessageService(db)
    
    try:
        new_message = service.send_direct_message(
            sender_id=current_user.id,
            receiver_id=team_member_id,
            message=message
        )
        return new_message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/group-chat", response_model=List[TeamMessageResponse])
async def get_group_messages(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all team group chat messages.
    """
    verify_team_access(current_user, db)
    
    service = TeamMessageService(db)
    messages = service.get_group_messages(limit)
    
    return messages


@router.post("/group-chat", response_model=TeamMessageResponse)
async def send_group_message(
    message: TeamMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a message to the team group chat.
    """
    verify_team_access(current_user, db)
    
    service = TeamMessageService(db)
    new_message = service.send_group_message(
        sender_id=current_user.id,
        message=message
    )
    
    return new_message


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get total unread direct messages count for current user.
    """
    verify_team_access(current_user, db)
    
    service = TeamMessageService(db)
    count = service.get_unread_count(current_user.id)
    
    return UnreadCountResponse(unread_count=count)
