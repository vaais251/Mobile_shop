from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.order import OrderStatus, PaymentMethod

class OrderItemBase(BaseModel):
    phone_id: int
    price_at_purchase: Decimal

class OrderItemResponse(OrderItemBase):
    id: int
    phone_brand: str
    phone_model: str
    phone_storage_gb: int
    phone_color: str
    phone_condition: str
    created_at: datetime

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    payment_method: PaymentMethod
    shipping_address: str
    shipping_city: str
    shipping_phone: str
    notes: Optional[str] = None
    payment_reference: Optional[str] = None

class OrderCreate(OrderBase):
    phone_ids: List[int]

class OrderResponse(OrderBase):
    id: int
    order_number: str
    buyer_id: int
    status: OrderStatus
    payment_status: bool
    subtotal: Decimal
    shipping_cost: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    tracking_id: Optional[str] = None
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True
