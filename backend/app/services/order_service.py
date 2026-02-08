from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

from app.models.order import Order, OrderItem, OrderStatus, PaymentMethod
from app.models.phone_inventory import PhoneInventory
from app.models.commission import Commission
from app.schemas.order import OrderCreate

class OrderService:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, buyer_id: int, order_data: OrderCreate) -> Order:
        """
        Create a new order from one or more products.
        
        Auto-creates commissions for community marketplace products.
        """
        # Validate all phones exist and are available
        phones = []
        for phone_id in order_data.phone_ids:
            phone = self.db.query(PhoneInventory).filter(
                PhoneInventory.id == phone_id
            ).first()
            
            if not phone:
                raise ValueError(f"Phone with ID {phone_id} not found")
            
            if phone.is_sold:
                raise ValueError(f"Phone '{phone.model}' is already sold")
            
            if not phone.is_available:
                raise ValueError(f"Phone '{phone.model}' is not available for purchase")
            
            phones.append(phone)
        
        # Generate order number
        order_count = self.db.query(Order).count()
        order_number = f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(order_count + 1).zfill(6)}"
        
        # Calculate totals
        subtotal = sum(phone.price for phone in phones)
        shipping_cost = Decimal("200.00")  # Fixed shipping cost
        tax_amount = Decimal("0.00")  # No tax
        total_amount = subtotal + shipping_cost + tax_amount
        
        # Create order
        order = Order(
            order_number=order_number,
            buyer_id=buyer_id,
            status=OrderStatus.PENDING,
            payment_method=PaymentMethod[order_data.payment_method.upper()],
            payment_status=False,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            tax_amount=tax_amount,
            total_amount=total_amount,
            shipping_address=order_data.shipping_address,
            shipping_city=order_data.shipping_city,
            shipping_phone=order_data.shipping_phone,
            notes=order_data.notes if hasattr(order_data, 'notes') else None
        )
        self.db.add(order)
        self.db.flush()  # Get order ID
        
        # Create order items and commissions
        for idx, phone_id in enumerate(order_data.phone_ids):
            phone = phones[idx]
            
            order_item = OrderItem(
                order_id=order.id,
                phone_id=phone.id,
                price_at_purchase=phone.price,
                phone_brand=phone.brand,
                phone_model=phone.model,
                phone_storage_gb=phone.storage_gb,
                phone_color=phone.color,
                phone_condition=phone.condition_category.value,
                # Extended snapshot fields
                phone_ram_gb=phone.ram_gb,
                phone_camera_mp=phone.camera_mp,
                phone_battery_health=phone.battery_health,
                phone_battery_mah=phone.battery_mah,
                phone_condition_grade=phone.condition_grade,
                phone_defects=phone.defects,
                phone_accessories=phone.accessories_included,
                phone_images=phone.images,
                phone_thumbnail=phone.thumbnail,
                phone_pta_approved=phone.pta_approved,
                phone_warranty_months=phone.warranty_months,
                # Seller snapshot
                seller_id=phone.seller_id,
                seller_name=phone.seller.name if phone.seller else None,
                seller_email=phone.seller.email if phone.seller else None,
                seller_phone=phone.seller.phone_number if phone.seller else None,
                seller_city=phone.seller.city if phone.seller else None
            )
            self.db.add(order_item)
            self.db.flush()  # Get order_item ID
            
            # **ENTERPRISE FEATURE: Auto-create commission for community products**
            if phone.seller_id:  # Community product (not shop-owned)
                commission = Commission.create_from_order_item(
                    order_item=order_item,
                    commission_rate=Decimal("10.00")  # Default 10% commission
                )
                if commission:
                    self.db.add(commission)
            
            # Mark phone as sold
            phone.is_sold = True
        
        self.db.commit()
        self.db.refresh(order)
        
        return order

    def get_user_orders(self, user_id: int) -> List[Order]:
        return self.db.query(Order).filter(Order.buyer_id == user_id).order_by(Order.created_at.desc()).all()

    def get_order_by_id(self, order_id: int) -> Optional[Order]:
        return self.db.query(Order).filter(Order.id == order_id).first()
