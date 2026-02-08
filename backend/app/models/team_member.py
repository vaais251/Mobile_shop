"""
Team Member model for multi-user admin system.

Supports:
- Multiple staff members with different roles and permissions
- Department-based organization
- Activity tracking
- Role-based access control
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Text, Enum, ARRAY
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class TeamRole(str, enum.Enum):
    """Team member role enumeration."""
    SUPER_ADMIN = "super_admin"          # Full system access
    PRODUCT_MANAGER = "product_manager"  # Listings, inventory, approvals
    CUSTOMER_SERVICE = "customer_service" # Orders, chat, support
    FINANCE_MANAGER = "finance_manager"  # Reports, commissions, payments
    WAREHOUSE_MANAGER = "warehouse_manager" # Inventory, shipping, tracking


class Department(str, enum.Enum):
    """Department enumeration."""
    MANAGEMENT = "management"
    PRODUCT = "product"
    CUSTOMER_SUPPORT = "customer_support"
    FINANCE = "finance"
    WAREHOUSE = "warehouse"
    MARKETING = "marketing"


class TeamMember(Base):
    """
    Team member model for multi-user admin management.
    
    Attributes:
        id: Primary key
        user_id: Reference to User model
        role: Team member role (super_admin, product_manager, etc.)
        department: Department assignment
        permissions: Array of specific permissions
        can_approve_listings: Permission to approve seller listings
        can_manage_orders: Permission to manage orders
        can_view_analytics: Permission to view analytics dashboard
        can_manage_inventory: Permission to manage inventory
        can_handle_support: Permission to handle customer support
        can_manage_team: Permission to manage other team members
        can_process_commissions: Permission to process commission payments
        is_active: Whether team member is currently active
        hired_at: Date when team member was added
        last_active_at: Last activity timestamp
    """
    
    __tablename__ = "team_members"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # User Reference
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
        comment="Reference to user account"
    )
    
    # Role and Department
    role = Column(
        Enum(TeamRole),
        nullable=False,
        default=TeamRole.CUSTOMER_SERVICE,
        index=True
    )
    department = Column(
        Enum(Department),
        nullable=False,
        default=Department.CUSTOMER_SUPPORT
    )
    
    # Specific Permissions (Boolean flags for quick checks)
    can_approve_listings = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Can approve/reject seller listings"
    )
    can_manage_orders = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Can view and update orders"
    )
    can_view_analytics = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Can access analytics dashboard"
    )
    can_manage_inventory = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Can add/edit/delete inventory"
    )
    can_handle_support = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Can respond to customer messages"
    )
    can_manage_team = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Can add/edit/remove team members"
    )
    can_process_commissions = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Can process commission payments"
    )
    can_manage_prices = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Can modify product prices"
    )
    
    # Status and Activity
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        comment="Active status for soft delete"
    )
    
    # Notes
    notes = Column(
        Text,
        nullable=True,
        comment="Internal notes about team member"
    )
    
    # Activity Metrics
    total_orders_processed = Column(
        Integer,
        default=0,
        nullable=False,
        comment="Count of orders processed by this member"
    )
    total_listings_approved = Column(
        Integer,
        default=0,
        nullable=False,
        comment="Count of listings approved/rejected"
    )
    total_tickets_resolved = Column(
        Integer,
        default=0,
        nullable=False,
        comment="Count of support tickets resolved"
    )
    
    # Timestamps
    hired_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        comment="Date when team member was added"
    )
    last_active_at = Column(
        DateTime,
        nullable=True,
        comment="Last activity timestamp"
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    user = relationship(
        "User",
        backref="team_member_profile",
        foreign_keys=[user_id]
    )
    
    def __repr__(self) -> str:
        return f"<TeamMember(id={self.id}, role={self.role.value}, department={self.department.value})>"
    
    @property
    def is_super_admin(self) -> bool:
        """Check if team member is super admin."""
        return self.role == TeamRole.SUPER_ADMIN
    
    @property
    def has_full_access(self) -> bool:
        """Check if team member has full system access."""
        return self.is_super_admin
    
    def update_activity(self) -> None:
        """Update last active timestamp."""
        self.last_active_at = datetime.utcnow()
    
    def increment_orders_processed(self) -> None:
        """Increment order processing counter."""
        self.total_orders_processed += 1
        self.update_activity()
    
    def increment_listings_approved(self) -> None:
        """Increment listing approval counter."""
        self.total_listings_approved += 1
        self.update_activity()
    
    def increment_tickets_resolved(self) -> None:
        """Increment ticket resolution counter."""
        self.total_tickets_resolved += 1
        self.update_activity()
