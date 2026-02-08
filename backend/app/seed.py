"""
Database seed script for testing.

Creates:
- 1 Admin user (admin@mobilestore.com / admin123)
- 2 Standard users
- 5 Shop phones (high-end, 10/10 condition)
- 3 Community phones (pending approval)

Run with: python -m app.seed
"""

import sys
import os
from decimal import Decimal

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.phone_inventory import PhoneInventory, PhoneCondition


def seed_database():
    """Seed the database with test data."""
    
    print("[SEED] Starting database seed...")
    
    # Initialize database tables
    init_db()
    
    db = SessionLocal()
    
    try:
        # Check if already seeded
        existing_admin = db.query(User).filter(User.email == "admin@mobilestore.com").first()
        if existing_admin:
            print("[WARNING] Database already seeded. Skipping...")
            return
        
        # ============== Create Users ==============
        print("[SEED] Creating users...")
        
        # Admin user
        admin = User(
            email="admin@mobilestore.com",
            password_hash=get_password_hash("admin123"),
            name="Admin User",
            phone_number="+923001234567",
            role=UserRole.ADMIN,
            is_verified=True,
            is_active=True,
        )
        db.add(admin)
        
        # Regular buyer
        buyer1 = User(
            email="ali@example.com",
            password_hash=get_password_hash("password123"),
            name="Ali Ahmed",
            phone_number="+923011234567",
            role=UserRole.BUYER,
            is_verified=False,
            is_active=True,
        )
        db.add(buyer1)
        
        # Seller (verified)
        seller1 = User(
            email="hassan@example.com",
            password_hash=get_password_hash("password123"),
            name="Hassan Khan",
            phone_number="+923021234567",
            role=UserRole.SELLER,
            is_verified=True,
            is_active=True,
        )
        db.add(seller1)
        
        db.commit()
        print(f"   [OK] Created: Admin (admin@mobilestore.com / admin123)")
        print(f"   [OK] Created: Buyer (ali@example.com / password123)")
        print(f"   [OK] Created: Seller (hassan@example.com / password123)")
        
        # ============== Create Shop Phones ==============
        print("[SEED] Creating shop phones...")
        
        shop_phones = [
            {
                "brand": "Apple",
                "model": "iPhone 15 Pro Max",
                "storage_gb": 256,
                "color": "Natural Titanium",
                "condition_grade": 10.0,
                "condition_category": PhoneCondition.MINT,
                "defects": None,
                "price": Decimal("385000"),
                "original_price": Decimal("550000"),
                "battery_health": 100,
                "warranty_months": 6,
                "accessories_included": "Original box, charger, cable, unused earphones",
                "is_featured": True,
            },
            {
                "brand": "Apple",
                "model": "iPhone 14 Pro",
                "storage_gb": 128,
                "color": "Deep Purple",
                "condition_grade": 9.5,
                "condition_category": PhoneCondition.EXCELLENT,
                "defects": None,
                "price": Decimal("265000"),
                "original_price": Decimal("380000"),
                "battery_health": 96,
                "warranty_months": 3,
                "accessories_included": "Charger and cable",
                "is_featured": True,
            },
            {
                "brand": "Samsung",
                "model": "Galaxy S24 Ultra",
                "storage_gb": 512,
                "color": "Titanium Black",
                "condition_grade": 10.0,
                "condition_category": PhoneCondition.MINT,
                "defects": None,
                "price": Decimal("320000"),
                "original_price": Decimal("450000"),
                "battery_health": 100,
                "warranty_months": 8,
                "accessories_included": "Full box with S-Pen",
                "is_featured": True,
            },
            {
                "brand": "Samsung",
                "model": "Galaxy Z Fold 5",
                "storage_gb": 256,
                "color": "Phantom Black",
                "condition_grade": 9.0,
                "condition_category": PhoneCondition.EXCELLENT,
                "defects": "Minimal crease visibility",
                "price": Decimal("295000"),
                "original_price": Decimal("480000"),
                "battery_health": 94,
                "warranty_months": 2,
                "accessories_included": "Charger only",
                "is_featured": False,
            },
            {
                "brand": "Apple",
                "model": "iPhone 13",
                "storage_gb": 128,
                "color": "Midnight",
                "condition_grade": 9.0,
                "condition_category": PhoneCondition.EXCELLENT,
                "defects": None,
                "price": Decimal("145000"),
                "original_price": Decimal("220000"),
                "battery_health": 89,
                "warranty_months": 0,
                "accessories_included": "Charger",
                "is_featured": False,
            },
        ]
        
        for phone_data in shop_phones:
            phone = PhoneInventory(
                **phone_data,
                seller_id=None,  # Shop-owned
                admin_approved=True,
                is_sold=False,
                is_active=True,
            )
            db.add(phone)
        
        db.commit()
        print(f"   [OK] Created {len(shop_phones)} shop phones")
        
        # ============== Create Community Phones (Pending) ==============
        print("[SEED] Creating community phones (pending approval)...")
        
        # Get seller ID
        seller = db.query(User).filter(User.email == "hassan@example.com").first()
        
        community_phones = [
            {
                "brand": "OnePlus",
                "model": "11 5G",
                "storage_gb": 256,
                "color": "Titan Black",
                "condition_grade": 8.5,
                "condition_category": PhoneCondition.GOOD,
                "defects": "Minor scratch on back",
                "price": Decimal("85000"),
                "original_price": Decimal("140000"),
                "battery_health": 91,
                "warranty_months": 0,
                "accessories_included": "Charger",
                "seller_id": seller.id,
                "admin_approved": False,  # Pending
            },
            {
                "brand": "Xiaomi",
                "model": "14 Ultra",
                "storage_gb": 512,
                "color": "White",
                "condition_grade": 9.0,
                "condition_category": PhoneCondition.EXCELLENT,
                "defects": None,
                "price": Decimal("165000"),
                "original_price": Decimal("230000"),
                "battery_health": 97,
                "warranty_months": 4,
                "accessories_included": "Full box",
                "seller_id": seller.id,
                "admin_approved": False,  # Pending
            },
            {
                "brand": "Google",
                "model": "Pixel 8 Pro",
                "storage_gb": 128,
                "color": "Bay",
                "condition_grade": 8.0,
                "condition_category": PhoneCondition.GOOD,
                "defects": "Light scratches on screen protector",
                "price": Decimal("115000"),
                "original_price": Decimal("180000"),
                "battery_health": 93,
                "warranty_months": 1,
                "accessories_included": "Charger and case",
                "seller_id": seller.id,
                "admin_approved": False,  # Pending
            },
        ]
        
        for phone_data in community_phones:
            phone = PhoneInventory(
                **phone_data,
                is_sold=False,
                is_active=True,
            )
            db.add(phone)
        
        db.commit()
        print(f"   [OK] Created {len(community_phones)} community phones (pending approval)")
        
        # ============== Summary ==============
        print("\n" + "="*50)
        print("[SUCCESS] Database seeded successfully!")
        print("="*50)
        print("\n[INFO] Test Accounts:")
        print("   Admin:  admin@mobilestore.com / admin123")
        print("   Buyer:  ali@example.com / password123")
        print("   Seller: hassan@example.com / password123")
        print("\n[INFO] Phones Created:")
        print(f"   Shop phones: {len(shop_phones)}")
        print(f"   Community phones (pending): {len(community_phones)}")
        print("\n[INFO] API Endpoints:")
        print("   GET /phones/shop - View shop inventory")
        print("   GET /phones/community - View approved listings")
        print("   GET /admin/phones/pending - View pending (admin only)")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
