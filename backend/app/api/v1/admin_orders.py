"""
Admin-specific routes for order management and seller statistics.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, or_, and_
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_admin
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.phone_inventory import PhoneInventory
from app.models.product_rating import ProductRating
from app.models.chat import ChatMessage
from app.schemas.rating import SellerStatistics, OrderCompletionRequest, ProductRatingResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/sellers/{seller_id}/statistics", response_model=SellerStatistics)
async def get_seller_statistics(
    seller_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Get comprehensive statistics for a specific seller.
    
    Returns:
        - Total products listed (ever)
        - Total products sold
        - Pending approval count
        - Approved & active listings count
        - Total revenue  
        - Average product rating
        - Join date
    """
    seller = db.query(User).filter(User.id == seller_id).first()
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )
    
    # Total products listed by this seller
    total_listed = db.query(func.count(PhoneInventory.id)).filter(
        PhoneInventory.seller_id == seller_id
    ).scalar() or 0
    
    # Total products sold (is_sold = True)
    total_sold = db.query(func.count(PhoneInventory.id)).filter(
        PhoneInventory.seller_id == seller_id,
        PhoneInventory.is_sold == True
    ).scalar() or 0
    
    # Pending approval (not admin approved yet)
    pending_approval = db.query(func.count(PhoneInventory.id)).filter(
        PhoneInventory.seller_id == seller_id,
        PhoneInventory.admin_approved == False
    ).scalar() or 0
    
    # Approved and active (not sold, approved)
    approved_active = db.query(func.count(PhoneInventory.id)).filter(
        PhoneInventory.seller_id == seller_id,
        PhoneInventory.admin_approved == True,
        PhoneInventory.is_sold == False
    ).scalar() or 0
    
    # Total revenue from sold products
    total_revenue = db.query(func.sum(PhoneInventory.price)).filter(
        PhoneInventory.seller_id == seller_id,
        PhoneInventory.is_sold == True
    ).scalar() or 0.0
    
    # Average rating for seller's products
    avg_rating = db.query(func.avg(ProductRating.rating)).join(
        PhoneInventory, ProductRating.phone_id == PhoneInventory.id
    ).filter(
        PhoneInventory.seller_id == seller_id
    ).scalar()
    
    return SellerStatistics(
        seller_id=seller.id,
        seller_name=seller.name,
        total_listed=total_listed,
        total_sold=total_sold,
        pending_approval=pending_approval,
        approved_active=approved_active,
        total_revenue=float(total_revenue),
        avg_rating=float(avg_rating) if avg_rating else None,
        join_date=seller.created_at
    )


@router.post("/orders/{order_id}/complete")
async def complete_order(
    order_id: int,
    completion_data: OrderCompletionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Mark an order as complete and enable customer ratings.
    Only admins can complete orders.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.completed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already marked as complete"
        )
    
    # Mark order as complete
    order.completed_at = datetime.utcnow()
    order.completion_notes = completion_data.completion_notes
    order.can_be_rated = True
    order.status = "delivered"  # Auto-set to delivered
    
    # Auto-delete chat messages between admin and buyer
    db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == order.buyer_id),
            and_(ChatMessage.sender_id == order.buyer_id, ChatMessage.receiver_id == current_user.id)
        )
    ).delete()
    
    # Auto-delete chat messages between admin and seller (for community products)
    # Get list of sellers from order items
    seller_ids = set()
    for item in order.items:
        if item.phone and item.phone.seller_id:
            seller_ids.add(item.phone.seller_id)
    
    # Delete chats with each seller
    for seller_id in seller_ids:
        db.query(ChatMessage).filter(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == seller_id),
                and_(ChatMessage.sender_id == seller_id, ChatMessage.receiver_id == current_user.id)
            )
        ).delete()
    
    db.commit()
    db.refresh(order)
    
    return {
        "message": "Order marked as complete and related chats deleted",
        "order_id": order.id,
        "completed_at": order.completed_at,
        "can_be_rated": order.can_be_rated,
        "chats_deleted": True
    }


@router.get("/orders")
async def get_all_orders_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 100
):
    """
    Get all orders with detailed information for admin dashboard.
    Includes buyer, items, and seller information.
    """
    orders = db.query(Order).options(
        joinedload(Order.buyer),
        joinedload(Order.items).joinedload(OrderItem.phone).joinedload(PhoneInventory.seller)
    ).order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    result = []
    for order in orders:
        order_data = {
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status.value if hasattr(order.status, 'value') else order.status,
            "total_amount": float(order.total_amount),
            "created_at": order.created_at.isoformat(),
            "completed_at": order.completed_at.isoformat() if order.completed_at else None,
            "can_be_rated": order.can_be_rated,
            "buyer": {
                "id": order.buyer.id,
                "name": order.buyer.name,
                "email": order.buyer.email,
                "phone_number": order.buyer.phone_number
            } if order.buyer else None,
            "items": []
        }
        
        for item in order.items:
            item_data = {
                "id": item.id,
                "phone_brand": item.phone_brand,
                "phone_model": item.phone_model,
                "phone_storage_gb": item.phone_storage_gb,
                "phone_color": item.phone_color,
                "price_at_purchase": float(item.price_at_purchase),
                "is_shop_owned": item.phone.seller_id is None if item.phone else True,
                "seller": {
                    "id": item.phone.seller.id,
                    "name": item.phone.seller.name,
                    "email": item.phone.seller.email,
                    "phone_number": item.phone.seller.phone_number
                } if item.phone and item.phone.seller else None
            }
            order_data["items"].append(item_data)
        
        result.append(order_data)
    
    return {"orders": result}
