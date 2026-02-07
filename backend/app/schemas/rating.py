from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ProductRatingBase(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0, description="Rating from 1.0 to 5.0")
    review: Optional[str] = Field(None, description="Optional text review")

class ProductRatingCreate(ProductRatingBase):
    order_id: int
    phone_id: int

class ProductRatingResponse(ProductRatingBase):
    id: int
    order_id: int
    phone_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class SellerStatistics(BaseModel):
    """Seller performance and activity statistics"""
    seller_id: int
    seller_name: str
    total_listed: int = Field(description="Total products ever listed")
    total_sold: int = Field(description="Total products sold")
    pending_approval: int = Field(description="Products pending admin approval")
    approved_active: int = Field(description="Approved and active listings")
    total_revenue: float = Field(description="Total revenue from sold products")
    avg_rating: Optional[float] = Field(None, description="Average product rating")
    join_date: datetime = Field(description="User registration date")

class OrderCompletionRequest(BaseModel):
    """Request to mark an order as complete"""
    completion_notes: Optional[str] = Field(None, description="Admin notes about completion")
