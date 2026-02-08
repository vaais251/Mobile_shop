"""
Script to seed sample commissions for testing.
This creates test commission data for the commissions page.
"""

from app.core.database import SessionLocal
from app.models import User, PhoneInventory, Order, OrderItem, Commission
from app.models.commission import CommissionStatus
from decimal import Decimal
from datetime import datetime, timedelta
import random

def seed_commissions():
    db = SessionLocal()
    
    try:
        # Get all sellers (users with listings)
        sellers = db.query(User).join(PhoneInventory).filter(
            PhoneInventory.seller_id.isnot(None)
        ).distinct().all()
        
        if not sellers:
            print("No sellers found. Please create some phone listings first.")
            return
        
        # Get completed orders
        orders = db.query(Order).filter(
            Order.status.in_(['delivered', 'confirmed'])
        ).all()
        
        if not orders:
            print("No completed orders found. Creating sample commissions manually...")
            # Create sample commissions manually
            for i in range(5):
                seller = random.choice(sellers)
                
                # Use the enum correctly
                is_paid = i >= 3
                
                commission = Commission(
                    order_id=1,  # Dummy order ID
                    order_item_id=1,  # Dummy item ID
                    seller_id=seller.id,
                    product_price=Decimal(str(random.randint(10000, 50000))),
                    commission_rate=Decimal("10.00"),
                    commission_amount=Decimal("0.00"),  # Will be calculated
                    platform_revenue=Decimal("0.00"),
                    seller_payout=Decimal("0.00"),
                    status='paid' if is_paid else 'pending',  # Use string, SQLAlchemy will convert
                    paid_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)) if is_paid else None,
                    payment_method="bank_transfer" if is_paid else None,
                    notes=f"Sample commission {i+1}"
                )
                
                # Calculate amounts
                commission.commission_amount = (commission.product_price * commission.commission_rate) / 100
                commission.platform_revenue = commission.commission_amount
                commission.seller_payout = commission.product_price - commission.commission_amount
                
                db.add(commission)
            
            db.commit()
            print(f"Created 5 sample commissions successfully!")
            return
        
        # Create commissions for existing orders
        created_count = 0
        for order in orders:
            order_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
            
            for item in order_items:
                # Check if commission already exists
                existing = db.query(Commission).filter(
                    Commission.order_item_id == item.id
                ).first()
                
                if existing:
                    continue
                
                # Get phone to find seller
                phone = db.query(PhoneInventory).filter(PhoneInventory.id == item.phone_id).first()
                
                if not phone or not phone.seller_id:
                    continue
                
                # Create commission
                commission = Commission(
                    order_id=order.id,
                    order_item_id=item.id,
                    seller_id=phone.seller_id,
                    product_price=item.price_at_purchase,
                    commission_rate=Decimal("10.00"),
                    commission_amount=Decimal("0.00"),
                    platform_revenue=Decimal("0.00"),
                    seller_payout=Decimal("0.00"),
                    status='paid' if order.status == 'delivered' else 'pending',  # Use string
                    paid_at=order.updated_at if order.status == 'delivered' else None,
                    payment_method="bank_transfer" if order.status == 'delivered' else None
                )
                
                # Calculate amounts
                commission.commission_amount = (commission.product_price * commission.commission_rate) / 100
                commission.platform_revenue = commission.commission_amount
                commission.seller_payout = commission.product_price - commission.commission_amount
                
                db.add(commission)
                created_count += 1
        
        db.commit()
        
        total_commissions = db.query(Commission).count()
        print(f"✓ Seeded commissions successfully!")
        print(f"  Created: {created_count} new commissions")
        print(f"  Total in database: {total_commissions}")
        
    except Exception as e:
        print(f"Error seeding commissions: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_commissions()
