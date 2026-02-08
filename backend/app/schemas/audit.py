"""
Pydantic schemas for audit log.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any
from datetime import datetime


# Response Schemas

class AuditLogResponse(BaseModel):
    """Schema for audit log response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: Optional[int] = None
    action_type: str
    resource_type: str
    resource_id: Optional[int] = None
    old_value: Optional[dict[str, Any]] = None
    new_value: Optional[dict[str, Any]] = None
    description: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[dict[str, Any]] = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    """Schema for list of audit logs."""
    total: int
    logs: list[AuditLogResponse]


class AuditLogFilter(BaseModel):
    """Schema for filtering audit logs."""
    user_id: Optional[int] = None
    action_type: Optional[str] = None
    resource_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    skip: int = 0
    limit: int = 100
