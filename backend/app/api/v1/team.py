"""
Team management API endpoints.
Only accessible to super_admin or users with can_manage_team permission.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.team_member import TeamMember, TeamRole
from app.models.audit_log import AuditLog
from app.schemas.team import (
    TeamMemberCreate,
    TeamMemberUpdate,
    TeamMemberResponse,
    TeamMemberListResponse,
    TeamMemberActivityUpdate
)

router = APIRouter(prefix="/admin/team", tags=["team-management"])


def check_team_management_permission(current_user: User, db: Session):
    """Check if user has permission to manage team."""
    # Check if user is admin
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access team management"
        )
    
    # Check if user has team member profile with permission
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.is_active == True
    ).first()
    
    if team_member:
        if not (team_member.is_super_admin or team_member.can_manage_team):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to manage team members"
            )
    # If no team member profile, allow any admin (backward compatibility)


@router.get("", response_model=TeamMemberListResponse)
async def get_team_members(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get all team members.
    
    Query params:
    - active_only: Filter by active status
    """
    check_team_management_permission(current_user, db)
    
    query = db.query(TeamMember).options(joinedload(TeamMember.user))
    
    if active_only:
        query = query.filter(TeamMember.is_active == True)
    
    members = query.all()
    active_count = len([m for m in members if m.is_active])
    
    return TeamMemberListResponse(
        total=len(members),
        active_count=active_count,
        members=members
    )


@router.post("", response_model=TeamMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_team_member(
    member_data: TeamMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Add a new team member.
    
    Requirements:
    - User must exist and be an admin
    - User cannot already have a team member profile
    """
    check_team_management_permission(current_user, db)
    
    # Check if user exists
    user = db.query(User).filter(User.id == member_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if user is admin
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have admin role to be added as team member"
        )
    
    # Check if user already has team member profile
    existing = db.query(TeamMember).filter(
        TeamMember.user_id == member_data.user_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a team member profile"
        )
    
    # Create team member
    team_member = TeamMember(**member_data.model_dump())
    db.add(team_member)
    
    # Log action
    audit_log = AuditLog.log_action(
        user_id=current_user.id,
        action_type="team_member_added",
        resource_type="team_member",
        resource_id=team_member.id,
        new_value={
            "user_id": member_data.user_id,
            "role": member_data.role.value,
            "department": member_data.department.value
        },
        description=f"Added team member: {user.name} as {member_data.role.value}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(team_member)
    
    return team_member


@router.get("/{member_id}", response_model=TeamMemberResponse)
async def get_team_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Get specific team member details."""
    check_team_management_permission(current_user, db)
    
    member = db.query(TeamMember).options(joinedload(TeamMember.user)).filter(
        TeamMember.id == member_id
    ).first()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    return member


@router.patch("/{member_id}", response_model=TeamMemberResponse)
async def update_team_member(
    member_id: int,
    update_data: TeamMemberUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update team member permissions and details."""
    check_team_management_permission(current_user, db)
    
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    # Store old values for audit
    old_values = {
        "role": member.role.value if member.role else None,
        "department": member.department.value if member.department else None,
        "permissions": {
            "can_approve_listings": member.can_approve_listings,
            "can_manage_orders": member.can_manage_orders,
            "can_view_analytics": member.can_view_analytics,
            "can_manage_inventory": member.can_manage_inventory,
            "can_handle_support": member.can_handle_support,
            "can_manage_team": member.can_manage_team,
            "can_process_commissions": member.can_process_commissions,
        }
    }
    
    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(member, field, value)
    
    # Log action
    audit_log = AuditLog.log_action(
        user_id=current_user.id,
        action_type="permissions_changed",
        resource_type="team_member",
        resource_id=member.id,
        old_value=old_values,
        new_value=update_dict,
        description=f"Updated team member permissions for {member.user.name if member.user else 'Unknown'}"
    )
    db.add(audit_log)
    
    db.commit()
    db.refresh(member)
    
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_team_member(
    member_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Deactivate team member (soft delete).
    Prevents login with team permissions but preserves data.
    """
    check_team_management_permission(current_user, db)
    
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    # Prevent deactivating self if super_admin
    if member.user_id == current_user.id and member.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own super_admin account"
        )
    
    member.is_active = False
    
    # Log action
    audit_log = AuditLog.log_action(
        user_id=current_user.id,
        action_type="team_member_removed",
        resource_type="team_member",
        resource_id=member.id,
        description=f"Deactivated team member: {member.user.name if member.user else 'Unknown'}"
    )
    db.add(audit_log)
    
    db.commit()


@router.post("/{member_id}/activity", response_model=TeamMemberResponse)
async def update_team_member_activity(
    member_id: int,
    activity: TeamMemberActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Update team member activity metrics.
    Called automatically when team member performs tracked actions.
    
    Actions: order, listing, ticket
    """
    member = db.query(TeamMember).filter(TeamMember.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found"
        )
    
    if activity.action == "order":
        member.increment_orders_processed()
    elif activity.action == "listing":
        member.increment_listings_approved()
    elif activity.action == "ticket":
        member.increment_tickets_resolved()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid activity type. Must be: order, listing, or ticket"
        )
    
    db.commit()
    db.refresh(member)
    
    return member


@router.get("/me/permissions")
async def get_my_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get current user's team permissions.
    Useful for frontend to determine what features to show.
    """
    team_member = db.query(TeamMember).filter(
        TeamMember.user_id == current_user.id,
        TeamMember.is_active == True
    ).first()
    
    if not team_member:
        # Default admin permissions (backward compatibility)
        return {
            "is_admin": True,
            "is_team_member": False,
            "role": "admin",
            "permissions": {
                "can_approve_listings": True,
                "can_manage_orders": True,
                "can_view_analytics": True,
                "can_manage_inventory": True,
                "can_handle_support": True,
                "can_manage_team": True,
                "can_process_commissions": True,
                "can_manage_prices": True,
            }
        }
    
    return {
        "is_admin": True,
        "is_team_member": True,
        "role": team_member.role.value,
        "department": team_member.department.value,
        "permissions": {
            "can_approve_listings": team_member.can_approve_listings,
            "can_manage_orders": team_member.can_manage_orders,
            "can_view_analytics": team_member.can_view_analytics,
            "can_manage_inventory": team_member.can_manage_inventory,
            "can_handle_support": team_member.can_handle_support,
            "can_manage_team": team_member.can_manage_team,
            "can_process_commissions": team_member.can_process_commissions,
            "can_manage_prices": team_member.can_manage_prices,
        }
    }
