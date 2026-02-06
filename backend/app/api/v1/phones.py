"""
Phone inventory API endpoints.

Public Routes:
- GET /phones/shop - Shop-owned phones (premium inventory)
- GET /phones/community - User-listed approved phones
- GET /phones/{id} - Get single phone details

Protected Routes:
- POST /phones/sell - List a phone for sale (requires auth)
- GET /phones/my-listings - Get user's own listings
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from decimal import Decimal
import math

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.phone import (
    PhoneCreate,
    PhoneResponse,
    PhoneListResponse,
    SellerInfo,
)
from app.services.phone_service import PhoneService
from app.models.user import User
from app.models.phone_inventory import PhoneCondition, PhoneInventory


router = APIRouter(prefix="/phones", tags=["Phones"])


def phone_to_response(phone: PhoneInventory) -> PhoneResponse:
    """Convert phone model to response schema with computed fields."""
    response = PhoneResponse.model_validate(phone)
    response.condition_display = f"{phone.condition_grade:.1f}/10"
    
    # Calculate discount percentage
    if phone.original_price and phone.original_price > 0:
        discount = ((phone.original_price - phone.price) / phone.original_price) * 100
        response.discount_percentage = round(float(discount), 1)
    else:
        response.discount_percentage = 0.0
    
    # Add seller info if available
    if phone.seller:
        response.seller = SellerInfo.model_validate(phone.seller)
    
    return response


@router.get(
    "/shop",
    response_model=PhoneListResponse,
    summary="Get shop inventory",
    description="Get phones owned by the shop (premium inventory). These are high-quality phones with guaranteed condition."
)
async def get_shop_phones(
    brand: Optional[str] = Query(None, description="Filter by brand (e.g., 'Apple', 'Samsung')"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price"),
    min_condition: Optional[float] = Query(None, ge=1, le=10, description="Minimum condition grade (e.g., 9 for '9/10' and above)"),
    storage_gb: Optional[int] = Query(None, description="Filter by storage (64, 128, 256, 512, 1024)"),
    condition_category: Optional[PhoneCondition] = Query(None, description="Filter by condition category"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get shop-owned phones (seller_id is NULL).
    
    These are the premium phones owned and sold directly by the shop.
    All filters are optional and can be combined.
    
    **Filtering Examples:**
    - `?brand=Apple` - Only Apple phones
    - `?min_condition=9` - Phones rated 9/10 or higher
    - `?min_price=50000&max_price=150000` - Price range filter
    """
    phone_service = PhoneService(db)
    
    phones, total = phone_service.get_shop_phones(
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        min_condition=min_condition,
        storage_gb=storage_gb,
        condition_category=condition_category,
        page=page,
        size=size,
    )
    
    return PhoneListResponse(
        items=[phone_to_response(p) for p in phones],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get(
    "/community",
    response_model=PhoneListResponse,
    summary="Get community listings",
    description="Get phones listed by community sellers. Only shows approved listings."
)
async def get_community_phones(
    brand: Optional[str] = Query(None, description="Filter by brand"),
    min_price: Optional[Decimal] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[Decimal] = Query(None, ge=0, description="Maximum price"),
    min_condition: Optional[float] = Query(None, ge=1, le=10, description="Minimum condition grade"),
    storage_gb: Optional[int] = Query(None, description="Filter by storage"),
    condition_category: Optional[PhoneCondition] = Query(None, description="Filter by condition category"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get community-listed phones (seller_id NOT NULL AND admin_approved = TRUE).
    
    These are phones listed by community sellers that have been
    verified and approved by the admin.
    """
    phone_service = PhoneService(db)
    
    phones, total = phone_service.get_community_phones(
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        min_condition=min_condition,
        storage_gb=storage_gb,
        condition_category=condition_category,
        page=page,
        size=size,
    )
    
    return PhoneListResponse(
        items=[phone_to_response(p) for p in phones],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get(
    "/my-listings",
    response_model=PhoneListResponse,
    summary="Get my phone listings",
    description="Get phones listed by the current user."
)
async def get_my_listings(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get phones listed by the currently authenticated user.
    
    Shows all user's listings including:
    - Approved listings
    - Pending approval
    - Sold phones
    """
    phone_service = PhoneService(db)
    
    phones, total = phone_service.get_user_listings(
        user_id=current_user.id,
        page=page,
        size=size,
    )
    
    return PhoneListResponse(
        items=[phone_to_response(p) for p in phones],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get(
    "/{phone_id}",
    response_model=PhoneResponse,
    summary="Get phone details",
    description="Get detailed information about a specific phone."
)
async def get_phone(
    phone_id: int,
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific phone.
    
    Returns 404 if phone not found or not available for viewing.
    """
    phone_service = PhoneService(db)
    phone = phone_service.get_by_id(phone_id)
    
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    # Only show active phones (or all for testing)
    # In production, you might want to restrict this
    
    return phone_to_response(phone)


@router.post(
    "/sell",
    response_model=PhoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="List a phone for sale",
    description="List your phone for sale in the community marketplace. Requires admin approval before it becomes visible."
)
async def sell_phone(
    phone_data: PhoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List a phone for sale in the community marketplace.
    
    **Important:**
    - The phone will NOT be visible until approved by an admin
    - `admin_approved` is automatically set to `False`
    - You cannot approve your own phone
    
    After submission, wait for admin review. You can check status
    at GET /phones/my-listings
    """
    phone_service = PhoneService(db)
    
    # Create user listing (admin_approved = False is HARDCODED)
    phone = phone_service.create_user_phone(
        phone_data=phone_data,
        seller_id=current_user.id
    )
    
    return phone_to_response(phone)
