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

from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from decimal import Decimal
import math
import shutil
import uuid
import os

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
    search: Optional[str] = Query(None, description="Search by model or brand (case-insensitive)"),
    color: Optional[str] = Query(None, description="Filter by exact color"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get shop-owned phones (seller_id is NULL).
    
    These are the premium phones owned and sold directly by the shop.
    All filters are optional and can be combined.
    """
    phone_service = PhoneService(db)
    
    phones, total = phone_service.get_shop_phones(
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        min_condition=min_condition,
        storage_gb=storage_gb,
        condition_category=condition_category,
        search=search,
        color=color,
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
    search: Optional[str] = Query(None, description="Search by model or brand (case-insensitive)"),
    color: Optional[str] = Query(None, description="Filter by exact color"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get community-listed phones (seller_id NOT NULL AND admin_approved = TRUE).
    """
    phone_service = PhoneService(db)
    
    phones, total = phone_service.get_community_phones(
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        min_condition=min_condition,
        storage_gb=storage_gb,
        condition_category=condition_category,
        search=search,
        color=color,
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
    """
    phone_service = PhoneService(db)
    phone = phone_service.get_by_id(phone_id)
    
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    return phone_to_response(phone)


@router.post(
    "/sell",
    response_model=PhoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="List a phone for sale",
    description="List your phone for sale with multiple images upload."
)
async def sell_phone(
    brand: str = Form(...),
    model: str = Form(...),
    storage_gb: int = Form(...),
    ram_gb: Optional[int] = Form(None),
    camera_mp: Optional[int] = Form(None),
    color: str = Form(...),
    seller_phone: Optional[str] = Form(None),
    seller_city: Optional[str] = Form(None),
    condition_grade: float = Form(...),
    condition_category: PhoneCondition = Form(...),
    price: Decimal = Form(...),
    defects: Optional[str] = Form(None),
    original_price: Optional[Decimal] = Form(None),
    battery_health: Optional[int] = Form(None),
    warranty_months: int = Form(0),
    accessories_included: Optional[str] = Form(None),
    pta_approved: bool = Form(False),
    images: List[UploadFile] = File(..., description="Multiple phone images"),
    thumbnail_index: int = Form(0, description="Index of the image to use as thumbnail (0-based)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List a phone for sale with multiple images upload.
    """
    import json
    
    # 1. Save all images
    os.makedirs("static/images", exist_ok=True)
    saved_image_paths = []
    
    for image in images:
        file_ext = os.path.splitext(image.filename)[1]
        file_name = f"{uuid.uuid4()}{file_ext}"
        file_path = f"static/images/{file_name}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        saved_image_paths.append(f"/static/images/{file_name}")
    
    # 2. Set thumbnail from specified index
    if 0 <= thumbnail_index < len(saved_image_paths):
        thumbnail_path = saved_image_paths[thumbnail_index]
    else:
        # Default to first image if index is invalid
        thumbnail_path = saved_image_paths[0] if saved_image_paths else None
    
    # 3. Store images as JSON array
    images_json = json.dumps(saved_image_paths)
    
    # 4. Create Phone Data
    phone_data = PhoneCreate(
        brand=brand,
        model=model,
        storage_gb=storage_gb,
        ram_gb=ram_gb,
        camera_mp=camera_mp,
        color=color,
        seller_phone=seller_phone,
        seller_city=seller_city,
        condition_grade=condition_grade,
        condition_category=condition_category,
        price=price,
        defects=defects,
        original_price=original_price,
        battery_health=battery_health,
        warranty_months=warranty_months,
        accessories_included=accessories_included,
        pta_approved=pta_approved,
        images=images_json,
        thumbnail=thumbnail_path
    )
    
    phone_service = PhoneService(db)
    phone = phone_service.create_user_phone(
        phone_data=phone_data,
        seller_id=current_user.id
    )
    
    return phone_to_response(phone)


@router.delete(
    "/my-listings/{phone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete my listing",
    description="Delete a phone listing that belongs to the current user."
)
async def delete_my_listing(
    phone_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a listing owned by the current user.
    
    - Can only delete listings that belong to the user
    - Cannot delete if the phone is already sold
    """
    phone_service = PhoneService(db)
    phone = phone_service.get_phone_by_id(phone_id)
    
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if phone.seller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own listings"
        )
    
    if phone.is_sold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a listing that has been sold"
        )
    
    success = phone_service.delete_phone(phone_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete listing"
        )
    
    return None
