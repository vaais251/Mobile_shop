"""
Pydantic schemas for commission management.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal
from enum import Enum


class CommissionStatusEnum(str, Enum):
    """Commission payment status."""
    PENDING = "pending"
    PROCESSING = "processing"
    PAID = "paid"
    CANCELLED = "cancelled"
    DISPUTED = "disputed"


# Request Schemas

class CommissionCreate(BaseModel):
    """Schema for creating a commission (auto-created on order)."""
    order_id: int
    order_item_id: int
    seller_id: int
    product_price: Decimal
    commission_rate: Decimal = Field(default=Decimal("10.00"), ge=0, le=100)


class CommissionPaymentProcess(BaseModel):
    """Schema for processing commission payment."""
    payment_method: str = Field(..., description="Payment method: bank_transfer, easypaisa, jazzcash")
    payment_reference: str = Field(..., description="Transaction reference number")
    notes: Optional[str] = None


class CommissionBulkPayout(BaseModel):
    """Schema for bulk commission payout."""
    commission_ids: list[int] = Field(..., description="List of commission IDs to pay")
    payment_method: str
    payment_reference_prefix: str = Field(..., description="Prefix for payment references")
    notes: Optional[str] = None


class CommissionUpdate(BaseModel):
    """Schema for updating commission."""
    status: Optional[CommissionStatusEnum] = None
    notes: Optional[str] = None


# Response Schemas

class SellerInfo(BaseModel):
    """Seller information for commission response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    email: str
    phone_number: Optional[str] = None


class CommissionResponse(BaseModel):
    """Schema for commission response."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    order_id: int
    order_item_id: int
    seller_id: Optional[int] = None
    product_price: Decimal
    commission_rate: Decimal
    commission_amount: Decimal
    platform_revenue: Decimal
    seller_payout: Decimal
    status: str
    paid_at: Optional[datetime] = None
    payment_method: Optional[str] = None
    payment_reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    seller: Optional[SellerInfo] = None


class CommissionListResponse(BaseModel):
    """Schema for list of commissions."""
    total: int
    pending_count: int
    paid_count: int
    total_pending_amount: Decimal
    total_paid_amount: Decimal
    commissions: list[CommissionResponse]


class CommissionSummaryBySeller(BaseModel):
    """Commission summary for a specific seller."""
    seller_id: int
    seller_name: str
    seller_email: str
    total_sales: Decimal
    total_commissions: Decimal
    pending_commissions: Decimal
    paid_commissions: Decimal
    commission_count: int
    last_payment_date: Optional[datetime] = None


class CommissionReportResponse(BaseModel):
    """Commission report response."""
    start_date: datetime
    end_date: datetime
    total_platform_revenue: Decimal
    total_seller_payouts: Decimal
    total_transactions: int
    seller_summaries: list[CommissionSummaryBySeller]
