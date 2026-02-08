from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas.order import OrderCreate, OrderResponse
from app.services.order_service import OrderService
from app.models.user import User

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Place a new order."""
    import traceback
    print(f"[ORDER] Received order request from user {current_user.id}")
    print(f"[ORDER] Order data: {order_data}")
    
    order_service = OrderService(db)
    try:
        print("[ORDER] Creating order...")
        order = order_service.create_order(current_user.id, order_data)
        print(f"[ORDER] Order created successfully: {order.id}")
        
        # **FEATURE 2: Auto-update user's shipping address**
        # If the user doesn't have a saved shipping address, save this one
        if not current_user.shipping_address and order_data.shipping_address:
            current_user.shipping_address = order_data.shipping_address
            current_user.city = order_data.shipping_city
            current_user.phone_number = order_data.shipping_phone
            db.commit()
        
        # **TRIGGER 2: Create notification for new order**
        from app.models.notification import Notification, NotificationType
        notification = Notification(
            type=NotificationType.NEW_ORDER,
            title="New Order Received",
            message=f"New order #{order.order_number} from {current_user.name} - Total: {order.total_amount} PKR",
            related_id=order.id
        )
        db.add(notification)
        db.commit()
        
        return order
    except ValueError as e:
        print(f"[ORDER ERROR] ValueError: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        print(f"[ORDER ERROR] Unexpected error: {str(e)}")
        print(f"[ORDER ERROR] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/me", response_model=List[OrderResponse])
async def get_my_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get orders for the current user."""
    order_service = OrderService(db)
    return order_service.get_user_orders(current_user.id)

@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific order."""
    order_service = OrderService(db)
    order = order_service.get_order_by_id(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.buyer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
        
    return order


@router.patch("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Cancel an order.
    
    - Buyers can cancel their own orders within 1 day from PENDING status
    - Admins can cancel any order at any time
    """
    from app.models.order import OrderStatus
    
    order_service = OrderService(db)
    order = order_service.get_order_by_id(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    is_buyer = order.buyer_id == current_user.id
    is_admin = current_user.role.value == "admin"
    
    if not is_buyer and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    # Attempt to transition to cancelled status
    success, message = order.transition_status(OrderStatus.CANCELLED, is_admin=is_admin)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    # **STOCK RESTORATION: Restore stock for cancelled orders**
    from app.models.phone_inventory import PhoneInventory
    for item in order.items:
        if item.phone_id:  # Only restore if phone still exists
            phone = db.query(PhoneInventory).filter(PhoneInventory.id == item.phone_id).first()
            if phone:
                # Increment stock back
                phone.stock += 1
                # Mark as not sold if it was previously sold
                if phone.is_sold:
                    phone.is_sold = False
    
    # Commit changes
    db.commit()
    db.refresh(order)
    
    return order

