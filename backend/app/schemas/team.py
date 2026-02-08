"""
Pydantic schemas for team member management.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum


class TeamRoleEnum(str, Enum):
    """Team member role enumeration."""
    SUPER_ADMIN = "super_admin"
    PRODUCT_MANAGER = "product_manager"
    CUSTOMER_SERVICE = "customer_service"
    FINANCE_MANAGER = "finance_manager"
    WAREHOUSE_MANAGER = "warehouse_manager"


class DepartmentEnum(str, Enum):
    """Department enumeration."""
    MANAGEMENT = "management"
    PRODUCT = "product"
    CUSTOMER_SUPPORT = "customer_support"
    FINANCE = "finance"
    WAREHOUSE = "warehouse"
    MARKETING = "marketing"


# Request Schemas

class TeamMemberCreate(BaseModel):
    """Schema for creating a new team member."""
    user_id: int = Field(..., description="User ID to assign team member role")
    role: TeamRoleEnum = Field(..., description="Team member role")
    department: DepartmentEnum = Field(..., description="Department assignment")
    can_approve_listings: bool = Field(default=False)
    can_manage_orders: bool = Field(default=True)
    can_view_analytics: bool = Field(default=False)
    can_manage_inventory: bool = Field(default=False)
    can_handle_support: bool = Field(default=True)
    can_manage_team: bool = Field(default=False)
    can_process_commissions: bool = Field(default=False)
    can_manage_prices: bool = Field(default=False)
    notes: Optional[str] = None


class TeamMemberUpdate(BaseModel):
    """Schema for updating team member."""
    role: Optional[TeamRoleEnum] = None
    department: Optional[DepartmentEnum] = None
    can_approve_listings: Optional[bool] = None
    can_manage_orders: Optional[bool] = None
    can_view_analytics: Optional[bool] = None
    can_manage_inventory: Optional[bool] = None
    can_handle_support: Optional[bool] = None
    can_manage_team: Optional[bool] = None
    can_process_commissions: Optional[bool] = None
    can_manage_prices: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


# Response Schemas

class UserBasicInfo(BaseModel):
    """Basic user information for team member response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    email: str
    phone_number: Optional[str] = None


class TeamMemberResponse(BaseModel):
    """Schema for team member response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    role: str
    department: str
    can_approve_listings: bool
    can_manage_orders: bool
    can_view_analytics: bool
    can_manage_inventory: bool
    can_handle_support: bool
    can_manage_team: bool
    can_process_commissions: bool
    can_manage_prices: bool
    is_active: bool
    notes: Optional[str] = None
    total_orders_processed: int
    total_listings_approved: int
    total_tickets_resolved: int
    hired_at: datetime
    last_active_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    user: Optional[UserBasicInfo] = None


class TeamMemberListResponse(BaseModel):
    """Schema for list of team members."""
    total: int
    active_count: int
    members: list[TeamMemberResponse]


class TeamMemberActivityUpdate(BaseModel):
    """Schema for updating team member activity metrics."""
    action: str = Field(..., description="Type of activity: order, listing, ticket")
