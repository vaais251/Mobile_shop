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




@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    new_status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """
    Update order status (admin only).
    
    Allowed statuses: pending, confirmed, shipped, delivered, cancelled
    """
    from app.models.order import OrderStatus
    
    # Validate status
    valid_statuses = {
        "pending": OrderStatus.PENDING,
        "confirmed": OrderStatus.CONFIRMED,
        "shipped": OrderStatus.SHIPPED,
        "delivered": OrderStatus.DELIVERED,
        "cancelled": OrderStatus.CANCELLED
    }
    
    if new_status.lower() not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {', '.join(valid_statuses.keys())}"
        )
    
    # Get order
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    
    # Transition status
    target_status = valid_statuses[new_status.lower()]
    success, message = order.transition_status(target_status, is_admin=True)
    
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
    
    db.commit()
    db.refresh(order)
    
    return {
        "id": order.id,
        "order_number": order.order_number,
        "status": order.status.value,
        "message": message
    }


@router.get("/orders")
async def get_all_orders_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin),
    skip: int = 0,
    limit: int = 100,
    status_filter: str = None,  # Filter by status: pending, shipped, delivered, cancelled
    search: str = None,  # Search by buyer name or order number
    start_date: datetime = None,  # Filter orders from this date
    end_date: datetime = None  # Filter orders until this date
):

    """
    Get all orders with detailed information for admin dashboard.
    Includes buyer, items, and seller information.
    Optional filters:
    - status_filter: pending, confirmed, shipped, delivered, cancelled, all
    - search: Search by buyer name or order number
    - start_date/end_date: Date range filter (defaults to last 1 month if not provided)
    """
    from app.models.order import OrderStatus
    from datetime import timedelta
    
    try:
        # Set default date range to last 1 month if not provided
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Build query with optional filter
        query = db.query(Order).options(
            joinedload(Order.buyer),
            joinedload(Order.items).joinedload(OrderItem.phone).joinedload(PhoneInventory.seller)
        )
        
        # Apply status filter if provided
        if status_filter and status_filter.lower() != "all":
            status_map = {
                "pending": OrderStatus.PENDING,
                "confirmed": OrderStatus.CONFIRMED,
                "shipped": OrderStatus.SHIPPED,
                "delivered": OrderStatus.DELIVERED,
                "cancelled": OrderStatus.CANCELLED
            }
            if status_filter.lower() in status_map:
                query = query.filter(Order.status == status_map[status_filter.lower()])
        
        # Apply search filter (buyer name or order number)
        if search:
            search_pattern = f"%{search}%"
            query = query.join(Order.buyer).filter(
                or_(
                    Order.order_number.ilike(search_pattern),
                    User.name.ilike(search_pattern)
                )
            )
        
        # Apply date range filter
        query = query.filter(
            and_(
                Order.created_at >= start_date,
                Order.created_at <= end_date
            )
        )
        
        orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
        
        result = []
        for order in orders:
            try:
                order_data = {
                    "id": order.id,
                    "order_number": order.order_number,
                    "status": order.status.value if hasattr(order.status, 'value') else order.status,
                    "total_amount": float(order.total_amount),
                    "created_at": order.created_at.isoformat(),
                    "completed_at": order.completed_at.isoformat() if order.completed_at else None,
                    "can_be_rated": order.can_be_rated,
                    "shipping_address": order.shipping_address or "",
                    "shipping_city": order.shipping_city or "",
                    "shipping_phone": order.shipping_phone or "",
                    "buyer": {
                        "id": order.buyer.id,
                        "name": order.buyer.name,
                        "email": order.buyer.email,
                        "phone_number": order.buyer.phone_number or ""
                    } if order.buyer else None,
                    "items": []
                }
                
                for item in order.items:
                    try:
                        item_data = {
                            "id": item.id,
                            "phone_brand": item.phone_brand,
                            "phone_model": item.phone_model,
                            "phone_storage_gb": item.phone_storage_gb,
                            "phone_color": item.phone_color,
                            "phone_condition": item.phone_condition,
                            "price_at_purchase": float(item.price_at_purchase),
                            "is_shop_owned": item.seller_id is None,
                            # Use snapshot data from OrderItem
                            "phone_details": {
                                "ram_gb": item.phone_ram_gb,
                                "camera_mp": item.phone_camera_mp,
                                "battery_health": item.phone_battery_health,
                                "battery_mah": item.phone_battery_mah,
                                "condition_grade": float(item.phone_condition_grade) if item.phone_condition_grade is not None else None,
                                "defects": item.phone_defects,
                                "accessories_included": item.phone_accessories,
                                "images": item.phone_images,
                                "thumbnail": item.phone_thumbnail,
                                "pta_approved": item.phone_pta_approved if item.phone_pta_approved is not None else False,
                                "warranty_months": item.phone_warranty_months if item.phone_warranty_months is not None else 0
                            } if any([
                                item.phone_ram_gb,
                                item.phone_camera_mp,
                                item.phone_battery_health,
                                item.phone_battery_mah,
                                item.phone_condition_grade,
                                item.phone_defects,
                                item.phone_accessories,
                                item.phone_images,
                                item.phone_thumbnail
                            ]) else None,
                            "seller": {
                                "id": item.seller_id,
                                "name": item.seller_name or "",
                                "email": item.seller_email or "",
                                "phone_number": item.seller_phone or "",
                                "city": item.seller_city or ""
                            } if item.seller_id else None
                        }
                        order_data["items"].append(item_data)
                    except Exception as item_error:
                        print(f"Error serializing order item {item.id}: {str(item_error)}")
                        # Add minimal item data
                        order_data["items"].append({
                            "id": item.id,
                            "phone_brand": item.phone_brand,
                            "phone_model": item.phone_model,
                            "phone_storage_gb": item.phone_storage_gb,
                            "phone_color": item.phone_color,
                            "phone_condition": item.phone_condition,
                            "price_at_purchase": float(item.price_at_purchase),
                            "is_shop_owned": item.seller_id is None,
                            "phone_details": None,
                            "seller": None
                        })
                
                result.append(order_data)
            except Exception as order_error:
                print(f"Error serializing order {order.id}: {str(order_error)}")
                continue
        
        return {"orders": result}
    except Exception as e:
        print(f"Error fetching orders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching orders: {str(e)}"
        )

