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
    order_service = OrderService(db)
    try:
        order = order_service.create_order(current_user.id, order_data)
        return order
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
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
    
    - Only the buyer can cancel their own order
    - Can only cancel orders that are still pending or confirmed
    """
    order_service = OrderService(db)
    order = order_service.get_order_by_id(order_id)
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.buyer_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to cancel this order")
    
    # Can only cancel pending or confirmed orders
    if order.status not in ["pending", "confirmed"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot cancel order with status '{order.status}'. Only pending or confirmed orders can be cancelled."
        )
    
    # Update order status
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    
    return order

