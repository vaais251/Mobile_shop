"""
Notification API endpoints for admin notifications.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.schemas.notification import NotificationResponse, NotificationCreate
from app.models.notification import Notification
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "/",
    response_model=List[NotificationResponse],
    summary="Get all notifications",
    description="Get all admin notifications, optionally filter by read status."
)
async def get_notifications(
    unread_only: bool = False,
    limit: int = 50,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get notifications for admin dashboard.
    
    Args:
        unread_only: If True, only return unread notifications
        limit: Maximum number of notifications to return
    """
    query = db.query(Notification)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    notifications = query.order_by(
        Notification.created_at.desc()
    ).limit(limit).all()
    
    return notifications


@router.get(
    "/unread-count",
    response_model=dict,
    summary="Get unread notification count",
    description="Get count of unread notifications for badge display."
)
async def get_unread_count(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications."""
    count = db.query(Notification).filter(
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark notification as read",
    description="Mark a single notification as read."
)
async def mark_as_read(
    notification_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return notification


@router.patch(
    "/mark-all-read",
    response_model=dict,
    summary="Mark all notifications as read",
    description="Mark all notifications as read."
)
async def mark_all_as_read(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read."""
    db.query(Notification).filter(
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {"message": "All notifications marked as read"}


@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete notification",
    description="Delete a notification."
)
async def delete_notification(
    notification_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a notification."""
    notification = db.query(Notification).filter(
        Notification.id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    db.delete(notification)
    db.commit()
    
    return None
