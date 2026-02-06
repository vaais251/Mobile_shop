from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List, Optional

from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.phone_inventory import PhoneInventory
from app.models.user import User
from app.schemas.order import OrderCreate

class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def generate_order_number(self) -> str:
        """Generate a unique order number."""
        return f"ORD-{datetime.now().year}-{str(uuid.uuid4())[:8].upper()}"

    def create_order(self, buyer_id: int, order_data: OrderCreate) -> Order:
        """Create a new order from a list of phone IDs."""
        # 1. Fetch phones and validate availability
        phones = self.db.query(PhoneInventory).filter(
            PhoneInventory.id.in_(order_data.phone_ids),
            PhoneInventory.is_active == True,
            PhoneInventory.is_sold == False
        ).all()

        if len(phones) != len(order_data.phone_ids):
            raise ValueError("One or more phones are unavailable or already sold")

        # 2. Calculate totals
        subtotal = sum(phone.price for phone in phones)
        shipping_cost = 200.0  # Flat rate for now
        total_amount = float(subtotal) + shipping_cost

        # 3. Create Order
        order = Order(
            order_number=self.generate_order_number(),
            buyer_id=buyer_id,
            status=OrderStatus.PENDING,
            payment_method=order_data.payment_method,
            payment_status=False,
            payment_reference=order_data.payment_reference,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total_amount=total_amount,
            shipping_address=order_data.shipping_address,
            shipping_city=order_data.shipping_city,
            shipping_phone=order_data.shipping_phone,
            notes=order_data.notes
        )
        self.db.add(order)
        self.db.flush() # Get order ID

        # 4. Create Order Items and Mark Phones as Sold
        for phone in phones:
            item = OrderItem(
                order_id=order.id,
                phone_id=phone.id,
                price_at_purchase=phone.price,
                phone_brand=phone.brand,
                phone_model=phone.model,
                phone_storage_gb=phone.storage_gb,
                phone_color=phone.color,
                phone_condition=phone.condition_category
            )
            self.db.add(item)
            phone.is_sold = True # Mark as sold

        self.db.commit()
        self.db.refresh(order)
        return order

    def get_user_orders(self, user_id: int) -> List[Order]:
        return self.db.query(Order).filter(Order.buyer_id == user_id).order_by(Order.created_at.desc()).all()

    def get_order_by_id(self, order_id: int) -> Optional[Order]:
        return self.db.query(Order).filter(Order.id == order_id).first()
