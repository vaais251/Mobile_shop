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

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import math

from app.core.database import get_db
from app.core.dependencies import get_current_admin
from app.schemas.phone import PhoneCreate, PhoneResponse, PhoneListResponse, SellerInfo
from app.schemas.user import UserResponse
from app.services.phone_service import PhoneService
from app.services.user_service import UserService
from app.models.user import User, UserRole
from app.models.phone_inventory import PhoneInventory


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
