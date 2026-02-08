"""
Audit Log model for tracking critical system actions.

Security and compliance:
- Track who did what, when
- Record changes to sensitive data
- Support investigations and audits
- Monitor team member activity
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime, 
    ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ActionType(str, enum.Enum):
    """Type of action performed."""
    # Product actions
    PRODUCT_CREATED = "product_created"
    PRODUCT_UPDATED = "product_updated"
    PRODUCT_DELETED = "product_deleted"
    PRODUCT_APPROVED = "product_approved"
    PRODUCT_REJECTED = "product_rejected"
    PRODUCT_PRICE_CHANGED = "product_price_changed"
    
    # Order actions
    ORDER_CREATED = "order_created"
    ORDER_STATUS_CHANGED = "order_status_changed"
    ORDER_CANCELLED = "order_cancelled"
    ORDER_COMPLETED = "order_completed"
    
    # User actions
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_ROLE_CHANGED = "user_role_changed"
    USER_DEACTIVATED = "user_deactivated"
    
    # Team actions
    TEAM_MEMBER_ADDED = "team_member_added"
    TEAM_MEMBER_UPDATED = "team_member_updated"
    TEAM_MEMBER_REMOVED = "team_member_removed"
    PERMISSIONS_CHANGED = "permissions_changed"
    
    # Commission actions
    COMMISSION_PAID = "commission_paid"
    COMMISSION_DISPUTED = "commission_disputed"
    
    # Bulk operations
    BULK_IMPORT = "bulk_import"
    BULK_DELETE = "bulk_delete"
    BULK_PRICE_UPDATE = "bulk_price_update"
    
    # Security
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGED = "password_changed"
    TWO_FACTOR_ENABLED = "two_factor_enabled"
    TWO_FACTOR_DISABLED = "two_factor_disabled"


class ResourceType(str, enum.Enum):
    """Type of resource being modified."""
    PRODUCT = "product"
    ORDER = "order"
    USER = "user"
    TEAM_MEMBER = "team_member"
    COMMISSION = "commission"
    CHAT = "chat"
    NOTIFICATION = "notification"
    SYSTEM = "system"


class AuditLog(Base):
    """
    Audit log for tracking critical system actions.
    
    Attributes:
        id: Primary key
        user_id: User who performed the action
        action_type: Type of action performed
        resource_type: Type of resource affected
        resource_id: ID of affected resource
        old_value: Previous value (JSON)
        new_value: New value (JSON)
        description: Human-readable description
        ip_address: IP address of user
        user_agent: Browser/client information
        created_at: Timestamp
    """
    
    __tablename__ = "audit_logs"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # User who performed action
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="User who performed the action (NULL for system actions)"
    )
    
    # Action Details
    action_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Type of action performed"
    )
    resource_type = Column(
        String(50),
        nullable=False,
        index=True,
        comment="Type of resource affected"
    )
    resource_id = Column(
        Integer,
        nullable=True,
        index=True,
        comment="ID of affected resource"
    )
    
    # Change Tracking
    old_value = Column(
        JSON,
        nullable=True,
        comment="Previous value (for updates)"
    )
    new_value = Column(
        JSON,
        nullable=True,
        comment="New value (for updates/creates)"
    )
    
    # Description
    description = Column(
        Text,
        nullable=True,
        comment="Human-readable description of action"
    )
    
    # Request Context
    ip_address = Column(
        String(45),
        nullable=True,
        comment="IP address of user (supports IPv6)"
    )
    user_agent = Column(
        String(500),
        nullable=True,
        comment="Browser/client user agent"
    )
    
    # Additional Metadata
    change_metadata = Column(
        JSON,
        nullable=True,
        comment="Additional context data"
    )
    
    # Timestamp
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    
    # Relationships
    user = relationship(
        "User",
        foreign_keys=[user_id]
    )
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action={self.action_type}, user_id={self.user_id})>"
    
    @staticmethod
    def log_action(
        user_id: int,
        action_type: str,
        resource_type: str,
        resource_id: int = None,
        old_value: dict = None,
        new_value: dict = None,
        description: str = None,
        ip_address: str = None,
        user_agent: str = None,
        change_metadata: dict = None
    ) -> "AuditLog":
        """Factory method to create audit log entry."""
        return AuditLog(
            user_id=user_id,
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            old_value=old_value,
            new_value=new_value,
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            change_metadata=change_metadata
        )

