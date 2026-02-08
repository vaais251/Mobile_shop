"""
Pydantic schemas for Phone Inventory management.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.phone_inventory import PhoneCondition


# ============== Request Schemas ==============

class PhoneCreate(BaseModel):
    """Schema for creating a new phone listing."""
    brand: str = Field(..., min_length=1, max_length=50)
    model: str = Field(..., min_length=1, max_length=100)
    storage_gb: int = Field(..., ge=8, le=2048)
    ram_gb: Optional[int] = Field(None, ge=1, le=64)
    camera_mp: Optional[int] = Field(None, ge=1, le=200)
    color: str = Field(..., min_length=1, max_length=50)
    seller_phone: Optional[str] = Field(None, max_length=20)
    seller_city: Optional[str] = Field(None, max_length=100)
    condition_grade: float = Field(..., ge=1.0, le=10.0)
    condition_category: PhoneCondition
    defects: Optional[str] = Field(None, max_length=1000)
    price: Decimal = Field(..., gt=0, le=9999999.99)
    original_price: Optional[Decimal] = Field(None, gt=0, le=9999999.99)
    stock: int = Field(default=1, ge=1, le=10000, description="Number of units in stock")
    images: Optional[str] = None  # JSON array of image file paths
    thumbnail: Optional[str] = None  # Main cover image path
    battery_health: Optional[int] = Field(None, ge=0, le=100)
    battery_mah: Optional[int] = Field(None, ge=500, le=20000)
    warranty_months: int = Field(default=0, ge=0, le=24)
    accessories_included: Optional[str] = Field(None, max_length=500)
    imei: Optional[str] = Field(None, max_length=20)
    pta_approved: bool = Field(default=False, description="Is the phone PTA approved?")

    @field_validator('condition_grade')
    @classmethod
    def validate_condition_grade(cls, v):
        """Round condition grade to 1 decimal place."""
        return round(v, 1)

    class Config:
        json_schema_extra = {
            "example": {
                "brand": "Apple",
                "model": "iPhone 14 Pro Max",
                "storage_gb": 256,
                "color": "Space Black",
                "condition_grade": 9.5,
                "condition_category": "excellent",
                "defects": "Minor scratch on back glass",
                "price": 185000,
                "original_price": 350000,
                "battery_health": 92,
                "warranty_months": 3,
                "accessories_included": "Original box, charger"
            }
        }


class PhoneUpdate(BaseModel):
    """Schema for updating a phone listing."""
    brand: Optional[str] = Field(None, min_length=1, max_length=50)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    storage_gb: Optional[int] = Field(None, ge=8, le=2048)
    ram_gb: Optional[int] = Field(None, ge=1, le=64)
    camera_mp: Optional[int] = Field(None, ge=1, le=200)
    color: Optional[str] = Field(None, min_length=1, max_length=50)
    seller_phone: Optional[str] = Field(None, max_length=20)
    seller_city: Optional[str] = Field(None, max_length=100)
    condition_grade: Optional[float] = Field(None, ge=1.0, le=10.0)
    condition_category: Optional[PhoneCondition] = None
    defects: Optional[str] = Field(None, max_length=1000)
    price: Optional[Decimal] = Field(None, gt=0, le=9999999.99)
    original_price: Optional[Decimal] = Field(None, gt=0, le=9999999.99)
    stock: Optional[int] = Field(None, ge=0, le=10000, description="Number of units in stock")
    images: Optional[str] = None
    thumbnail: Optional[str] = None
    battery_health: Optional[int] = Field(None, ge=0, le=100)
    battery_mah: Optional[int] = Field(None, ge=500, le=20000)
    warranty_months: Optional[int] = Field(None, ge=0, le=24)
    accessories_included: Optional[str] = Field(None, max_length=500)
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None
    pta_approved: Optional[bool] = None


class PhoneFilter(BaseModel):
    """Schema for filtering phone listings."""
    brand: Optional[str] = None
    min_price: Optional[Decimal] = Field(None, ge=0)
    max_price: Optional[Decimal] = Field(None, ge=0)
    min_condition: Optional[float] = Field(None, ge=1.0, le=10.0)
    max_condition: Optional[float] = Field(None, ge=1.0, le=10.0)
    storage_gb: Optional[int] = None
    condition_category: Optional[PhoneCondition] = None
    is_featured: Optional[bool] = None


# ============== Response Schemas ==============

class SellerInfo(BaseModel):
    """Minimal seller info for phone listings."""
    id: int
    name: str
    is_verified: bool
    is_verified_seller: bool  # Verified seller trust badge

    class Config:
        from_attributes = True


class PhoneResponse(BaseModel):
    """Schema for phone response."""
    id: int
    brand: str
    model: str
    storage_gb: int
    ram_gb: Optional[int] = None
    camera_mp: Optional[int] = None
    color: str
    seller_phone: Optional[str] = None
    seller_city: Optional[str] = None
    condition_grade: float
    condition_category: PhoneCondition
    defects: Optional[str] = None
    price: Decimal
    original_price: Optional[Decimal] = None
    is_sold: bool
    is_featured: bool
    is_active: bool
    stock: int
    pta_approved: bool
    seller_id: Optional[int] = None
    admin_approved: bool
    images: Optional[str] = None
    thumbnail: Optional[str] = None
    battery_health: Optional[int] = None
    battery_mah: Optional[int] = None
    warranty_months: int
    accessories_included: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Computed fields
    condition_display: Optional[str] = None
    discount_percentage: Optional[float] = None
    seller: Optional[SellerInfo] = None

    class Config:
        from_attributes = True


class PhoneListResponse(BaseModel):
    """Schema for paginated phone list response."""
    items: List[PhoneResponse]
    total: int
    page: int
    size: int
    pages: int
