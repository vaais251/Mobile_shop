"""
Admin API endpoints.

All routes require Admin role authentication.

Routes:
- GET /admin/phones/pending - Get phones awaiting approval
- PATCH /admin/phones/{id}/approve - Approve a phone listing
- PATCH /admin/phones/{id}/reject - Reject a phone listing
- POST /admin/phones - Add phone directly to shop inventory
- DELETE /admin/phones/{id} - Delete any phone listing
- GET /admin/users - List all users
- PATCH /admin/users/{id}/role - Change user role
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
from app.core.dependencies import get_current_admin
from app.schemas.phone import PhoneCreate, PhoneUpdate, PhoneResponse, PhoneListResponse, SellerInfo
from app.schemas.user import UserResponse
from app.services.phone_service import PhoneService
from app.services.user_service import UserService
from app.models.user import User, UserRole
from app.models.phone_inventory import PhoneInventory, PhoneCondition


router = APIRouter(prefix="/admin", tags=["Admin"])


def phone_to_response(phone: PhoneInventory) -> PhoneResponse:
    """Convert phone model to response schema."""
    response = PhoneResponse.model_validate(phone)
    response.condition_display = f"{phone.condition_grade:.1f}/10"
    
    if phone.original_price and phone.original_price > 0:
        discount = ((phone.original_price - phone.price) / phone.original_price) * 100
        response.discount_percentage = round(float(discount), 1)
    else:
        response.discount_percentage = 0.0
    
    if phone.seller:
        response.seller = SellerInfo.model_validate(phone.seller)
    
    return response


# ============== Phone Management ==============

@router.get(
    "/phones/pending",
    response_model=PhoneListResponse,
    summary="Get phones pending approval",
    description="Get all phone listings waiting for admin approval."
)
async def get_pending_phones(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all phones pending admin approval.
    
    These are phones listed by users that need to be reviewed
    before appearing in the community marketplace.
    """
    phone_service = PhoneService(db)
    
    phones, total = phone_service.get_pending_approval(page=page, size=size)
    
    return PhoneListResponse(
        items=[phone_to_response(p) for p in phones],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.patch(
    "/phones/{phone_id}/approve",
    response_model=PhoneResponse,
    summary="Approve a phone listing",
    description="Approve a user-listed phone to appear in the community marketplace."
)
async def approve_phone(
    phone_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Approve a phone listing.
    
    Sets `admin_approved` to `True`, making the phone visible
    in the community marketplace (GET /phones/community).
    """
    phone_service = PhoneService(db)
    
    phone = phone_service.approve_phone(phone_id)
    
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    return phone_to_response(phone)


@router.patch(
    "/phones/{phone_id}/reject",
    response_model=PhoneResponse,
    summary="Reject a phone listing",
    description="Reject and deactivate a phone listing."
)
async def reject_phone(
    phone_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Reject a phone listing.
    
    Sets `admin_approved` to `False` and `is_active` to `False`.
    The listing will no longer be visible.
    """
    phone_service = PhoneService(db)
    
    phone = phone_service.reject_phone(phone_id)
    
    if not phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    return phone_to_response(phone)


@router.post(
    "/phones",
    response_model=PhoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add phone to shop inventory",
    description="Add a phone directly to the shop inventory. Bypasses approval process."
)
async def create_shop_phone(
    phone_data: PhoneCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Add a phone directly to shop inventory.
    
    - `seller_id` is automatically set to NULL (shop-owned)
    - `admin_approved` is automatically set to TRUE
    - Phone immediately appears in GET /phones/shop
    
    Use this for phones purchased by the shop for resale.
    """
    phone_service = PhoneService(db)
    
    phone = phone_service.create_shop_phone(phone_data)
    
    return phone_to_response(phone)


@router.post(
    "/phones/upload",
    response_model=PhoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add phone with images upload",
    description="Add a phone with multiple images to the shop inventory. Accepts multipart form data."
)
async def create_shop_phone_with_image(
    brand: str = Form(...),
    model: str = Form(...),
    storage_gb: int = Form(...),
    ram_gb: Optional[int] = Form(None),
    camera_mp: Optional[int] = Form(None),
    color: str = Form(...),
    condition_grade: float = Form(...),
    condition_category: PhoneCondition = Form(...),
    price: Decimal = Form(...),
    defects: Optional[str] = Form(None),
    original_price: Optional[Decimal] = Form(None),
    battery_health: Optional[int] = Form(None),
    battery_mah: Optional[int] = Form(None),
    warranty_months: int = Form(0),
    accessories_included: Optional[str] = Form(None),
    pta_approved: bool = Form(False),
    is_featured: bool = Form(False),
    images: List[UploadFile] = File(..., description="Multiple phone images"),
    thumbnail_index: int = Form(0, description="Index of the image to use as thumbnail (0-based)"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Add a phone with multiple images to shop inventory.
    
    Accepts multipart form data with multiple image upload.
    - `images`: List of image files
    - `thumbnail_index`: Index (0-based) of which image to use as cover
    - `seller_id` is automatically set to NULL (shop-owned)
    - `admin_approved` is automatically set to TRUE
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
        condition_grade=condition_grade,
        condition_category=condition_category,
        price=price,
        defects=defects,
        original_price=original_price,
        battery_health=battery_health,
        battery_mah=battery_mah,
        warranty_months=warranty_months,
        accessories_included=accessories_included,
        pta_approved=pta_approved,
        images=images_json,
        thumbnail=thumbnail_path
    )
    
    phone_service = PhoneService(db)
    phone = phone_service.create_shop_phone(phone_data)
    
    # Update is_featured if set
    if is_featured:
        phone.is_featured = True
        db.commit()
        db.refresh(phone)
    
    return phone_to_response(phone)


@router.delete(
    "/phones/{phone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a phone listing",
    description="Permanently delete any phone listing."
)
async def delete_phone(
    phone_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Permanently delete a phone listing.
    
    This action cannot be undone. Use reject for soft-delete.
    """
    phone_service = PhoneService(db)
    
    success = phone_service.delete_phone(phone_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found"
        )
    
    return None


@router.patch(
    "/phones/{phone_id}",
    response_model=PhoneResponse,
    summary="Update any phone listing",
    description="Update an existing phone listing (Admin only)."
)
async def update_phone_admin(
    phone_id: int,
    phone_data: PhoneUpdate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Update any phone listing as an administrator.
    """
    phone_service = PhoneService(db)
    
    updated_phone = phone_service.update_phone(
        phone_id=phone_id,
        phone_data=phone_data,
        requesting_user=admin
    )
    
    if not updated_phone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone not found or update failed"
        )
        
    return phone_to_response(updated_phone)


@router.get(
    "/phones",
    response_model=PhoneListResponse,
    summary="Get all phone listings",
    description="Get all phone listings including shop, community, sold, and pending."
)
async def get_all_phones(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all inventory with pagination."""
    # We can use the service or a direct query
    query = db.query(PhoneInventory)
    total = query.count()
    phones = query.offset((page-1)*size).limit(size).all()
    
    return PhoneListResponse(
        items=[phone_to_response(p) for p in phones],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )


@router.get(
    "/stats",
    summary="Get administration stats",
)
async def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get backend stats for dashboard.
    """
    total_users = db.query(User).count()
    pending_approvals = db.query(PhoneInventory).filter(PhoneInventory.admin_approved == False).count()
    # Dummy total sales for now as orders might not have items yet or we need sum
    from app.models.order import Order
    total_sales = db.query(Order).count() # Simply using order count for 'Total Sales' stat placeholder
    
    return {
        "total_users": total_users,
        "pending_approvals": pending_approvals,
        "total_orders": total_sales
    }


# ============== User Management ==============

@router.get(
    "/users",
    response_model=List[UserResponse],
    summary="List all users",
    description="Get all registered users."
)
async def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get all registered users with optional role filter.
    """
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    users = query.order_by(User.created_at.desc()).all()
    
    return [UserResponse.model_validate(u) for u in users]


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    summary="Change user role",
    description="Change a user's role (Admin, Seller, Buyer)."
)
async def change_user_role(
    user_id: int,
    new_role: UserRole,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Change a user's role.
    
    Available roles:
    - `buyer` - Can browse and purchase phones
    - `seller` - Can list phones for sale (requires verification)
    - `admin` - Full access to all features
    """
    user_service = UserService(db)
    
    user = user_service.update_role(user_id, new_role)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/verify",
    response_model=UserResponse,
    summary="Verify seller",
    description="Verify a seller account to allow them to list phones."
)
async def verify_seller(
    user_id: int,
    verified: bool = True,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Verify or unverify a seller account.
    
    Verified sellers can list phones that still require
    individual approval, but they get priority review.
    """
    user_service = UserService(db)
    
    user = user_service.verify_seller(user_id, verified)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or not a seller"
        )
    
    return UserResponse.model_validate(user)


@router.patch(
    "/users/{user_id}/verified-seller-badge",
    response_model=UserResponse,
    summary="Toggle Verified Seller Badge",
    description="Toggle the verified seller trust badge for community listings."
)
async def toggle_verified_seller_badge(
    user_id: int,
    verified_seller: bool = True,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Toggle verified seller badge (trust system).
    
    This is separate from basic seller verification and indicates
    a trusted seller in the community marketplace with a blue checkmark.
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_verified_seller = verified_seller
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)


@router.delete(
    "/users/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user",
    description="Permanently delete a user account."
)
async def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Permanently delete a user account.
    
    - Cannot delete own account
    - This will also delete all their listings
    """
    if user_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete user's phone listings first
    db.query(PhoneInventory).filter(PhoneInventory.seller_id == user_id).delete()
    
    # Delete user
    db.delete(user)
    db.commit()
    
    return None


from pydantic import BaseModel
from app.core.security import get_password_hash


class PasswordChange(BaseModel):
    new_password: str


@router.patch(
    "/users/{user_id}/password",
    response_model=UserResponse,
    summary="Change user password",
    description="Change a user's password (Admin only)."
)
async def change_user_password(
    user_id: int,
    password_data: PasswordChange,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Change a user's password.
    
    - Admin can change any user's password
    - Useful for helping users who forgot their password
    """
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
    
    user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    db.refresh(user)
    
    return UserResponse.model_validate(user)
