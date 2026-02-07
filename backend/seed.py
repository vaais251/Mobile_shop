"""
Seed script for Mobile Store database.
Creates:
- 1 Admin user
- 2 Regular users (1 seller, 1 buyer)
- 5 Shop-owned phones with placeholder images
"""

import sys
import os
from decimal import Decimal

# Add the parent directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.phone_inventory import PhoneInventory, PhoneCondition
import json


def seed_database():
    db = SessionLocal()
    
    try:
        print("🌱 Starting database seed...")
        
        # Clear existing data
        print("🗑️  Clearing existing data...")
        db.query(PhoneInventory).delete()
        db.query(User).delete()
        db.commit()
        
        # Create Admin
        print("👤 Creating admin user...")
        admin = User(
            email="admin@mobilestore.com",
            password_hash=get_password_hash("admin123"),
            name="Admin User",
            phone_number="+92300123456",
            city="Islamabad",
            role=UserRole.ADMIN,
            is_verified=True,
            is_active=True
        )
        db.add(admin)
        
        # Create Seller
        print("👤 Creating seller user...")
        seller = User(
            email="seller@example.com",
            password_hash=get_password_hash("seller123"),
            name="Ahmed Khan",
            phone_number="+92301234567",
            city="Karachi",
            role=UserRole.SELLER,
            is_verified=True,
            is_active=True
        )
        db.add(seller)
        
        # Create Buyer
        print("👤 Creating buyer user...")
        buyer = User(
            email="buyer@example.com",
            password_hash=get_password_hash("buyer123"),
            name="Fatima Ali",
            phone_number="+92302345678",
            city="Lahore",
            role=UserRole.BUYER,
            is_verified=True,
            is_active=True
        )
        db.add(buyer)
        
        db.commit()
        print("✅ Users created successfully!")
        
        # Create Shop-owned Phones
        print("📱 Creating shop-owned phones...")
        
        phones_data_with_images = [
            {
                "data": {
                    "brand": "Apple",
                    "model": "iPhone 14 Pro Max",
                    "storage_gb": 256,
                    "ram_gb": 6,
                    "camera_mp": 48,
                    "color": "Deep Purple",
                    "condition_grade": 9.5,
                    "condition_category": PhoneCondition.EXCELLENT,
                    "price": Decimal("185000"),
                    "original_price": Decimal("350000"),
                    "battery_health": 95,
                    "warranty_months": 3,
                    "defects": None,
                    "accessories_included": "Original box, charger, cable",
                    "pta_approved": True,
                    "is_featured": True,
                },
                "images": [
                    "/static/images/iphone-14-pro-max.svg",
                    "/static/images/iphone-14-pro-max.svg",
                    "/static/images/iphone-14-pro-max.svg",
                ]
            },
            {
                "data": {
                    "brand": "Samsung",
                    "model": "Galaxy S23 Ultra",
                    "storage_gb": 512,
                    "ram_gb": 12,
                    "camera_mp": 200,
                    "color": "Phantom Black",
                    "condition_grade": 9.0,
                    "condition_category": PhoneCondition.EXCELLENT,
                    "price": Decimal("165000"),
                    "original_price": Decimal("320000"),
                    "battery_health": 92,
                    "warranty_months": 6,
                    "defects": "Minor scuff on the back",
                    "accessories_included": "Box, charger, S-Pen",
                    "pta_approved": True,
                    "is_featured": True,
                },
                "images": [
                    "/static/images/samsung-s23-ultra.svg",
                    "/static/images/samsung-s23-ultra.svg",
                    "/static/images/samsung-s23-ultra.svg",
                ]
            },
            {
                "data": {
                    "brand": "Apple",
                    "model": "iPhone 13",
                    "storage_gb": 128,
                    "ram_gb": 4,
                    "camera_mp": 12,
                    "color": "Midnight",
                    "condition_grade": 8.5,
                    "condition_category": PhoneCondition.GOOD,
                    "price": Decimal("125000"),
                    "original_price": Decimal("220000"),
                    "battery_health": 88,
                    "warranty_months": 0,
                    "defects": "Light scratches on screen",
                    "accessories_included": "Charger, cable",
                    "pta_approved": True,
                    "is_featured": False,
                },
                "images": [
                    "/static/images/iphone-13.svg",
                    "/static/images/iphone-13.svg",
                ]
            },
            {
                "data": {
                    "brand": "OnePlus",
                    "model": "11 Pro",
                    "storage_gb": 256,
                    "ram_gb": 16,
                    "camera_mp": 50,
                    "color": "Eternal Green",
                    "condition_grade": 9.5,
                    "condition_category": PhoneCondition.EXCELLENT,
                    "price": Decimal("95000"),
                    "original_price": Decimal("140000"),
                    "battery_health": 97,
                    "warranty_months": 12,
                    "defects": None,
                    "accessories_included": "Full box with all accessories",
                    "pta_approved": True,
                    "is_featured": False,
                },
                "images": [
                    "/static/images/oneplus-11-pro.svg",
                    "/static/images/oneplus-11-pro.svg",
                    "/static/images/oneplus-11-pro.svg",
                ]
            },
            {
                "data": {
                    "brand": "Xiaomi",
                    "model": "13 Pro",
                    "storage_gb": 256,
                    "ram_gb": 12,
                    "camera_mp": 50,
                    "color": "Ceramic White",
                    "condition_grade": 8.0,
                    "condition_category": PhoneCondition.GOOD,
                    "price": Decimal("85000"),
                    "original_price": Decimal("135000"),
                    "battery_health": 85,
                    "warranty_months": 3,
                    "defects": "Small scratch on camera lens protector",
                    "accessories_included": "Charger, case",
                    "pta_approved": False,
                    "is_featured": False,
                },
                "images": [
                    "/static/images/xiaomi-13-pro.svg",
                    "/static/images/xiaomi-13-pro.svg",
                ]
            },
        ]
        
        for item in phones_data_with_images:
            phone_data = item["data"]
            images = item["images"]
            
            phone = PhoneInventory(
                **phone_data,
                images=json.dumps(images),
                thumbnail=images[0],
                seller_id=None,  # Shop-owned (no seller)
                admin_approved=True,
                is_sold=False,
                is_active=True,
            )
            db.add(phone)
        
        db.commit()
        print("✅ Shop phones created successfully!")
        
        # Create user-listed phones (community listings)
        print("📱 Creating user-listed phones (community listings)...")
        
        user_phones_data_with_images = [
            {
                "data": {
                    "brand": "Apple",
                    "model": "iPhone 12",
                    "storage_gb": 64,
                    "ram_gb": 4,
                    "camera_mp": 12,
                    "color": "Blue",
                    "seller_phone": "+92301234567",
                    "seller_city": "Karachi",
                    "condition_grade": 7.5,
                    "condition_category": PhoneCondition.FAIR,
                    "price": Decimal("85000"),
                    "battery_health": 82,
                    "defects": "Battery needs replacement soon",
                    "pta_approved": True,
                },
                "images": ["/static/images/iphone-12.svg"],
                "approved": False
            },
            {
                "data": {
                    "brand": "Samsung",
                    "model": "Galaxy A54",
                    "storage_gb": 128,
                    "ram_gb": 8,
                    "camera_mp": 50,
                    "color": "Awesome Violet",
                    "seller_phone": "+92301234567",
                    "seller_city": "Karachi",
                    "condition_grade": 9.0,
                    "condition_category": PhoneCondition.EXCELLENT,
                    "price": Decimal("55000"),
                    "battery_health": 95,
                    "defects": None,
                    "accessories_included": "Box, charger",
                    "pta_approved": True,
                },
                "images": ["/static/images/galaxy-a54.svg", "/static/images/galaxy-a54.svg"],
                "approved": False
            },
            {
                "data": {
                    "brand": "Vivo",
                    "model": "V27 Pro",
                    "storage_gb": 256,
                    "ram_gb": 12,
                    "camera_mp": 50,
                    "color": "Magic Blue",
                    "seller_phone": "+92321987654",
                    "seller_city": "Lahore",
                    "condition_grade": 8.8,
                    "condition_category": PhoneCondition.EXCELLENT,
                    "price": Decimal("68000"),
                    "battery_health": 91,
                    "warranty_months": 6,
                    "accessories_included": "Box, charger, earphones",
                    "pta_approved": True,
                },
                "images": ["/static/images/vivo-v27-pro.svg", "/static/images/vivo-v27-pro.svg"],
                "approved": True
            },
            {
                "data": {
                    "brand": "Oppo",
                    "model": "Reno 8",
                    "storage_gb": 128,
                    "ram_gb": 8,
                    "camera_mp": 50,
                    "color": "Shimmer Gold",
                    "seller_phone": "+92333456789",
                    "seller_city": "Islamabad",
                    "condition_grade": 9.0,
                    "condition_category": PhoneCondition.EXCELLENT,
                    "price": Decimal("42000"),
                    "battery_health": 94,
                    "warranty_months": 3,
                    "defects": None,
                    "accessories_included": "Charger, case",
                    "pta_approved": True,
                },
                "images": ["/static/images/oppo-reno-8.svg"],
                "approved": True
            },
            {
                "data": {
                    "brand": "Realme",
                    "model": "C55",
                    "storage_gb": 128,
                    "ram_gb": 6,
                    "camera_mp": 64,
                    "color": "Sunshower",
                    "seller_phone": "+92345678901",
                    "seller_city": "Faisalabad",
                    "condition_grade": 7.8,
                    "condition_category": PhoneCondition.GOOD,
                    "price": Decimal("28000"),
                    "battery_health": 88,
                    "defects": "Minor back panel scratches",
                    "pta_approved": True,
                },
                "images": ["/static/images/realme-c55.svg"],
                "approved": True
            },
            {
                "data": {
                    "brand": "Google",
                    "model": "Pixel 7",
                    "storage_gb": 128,
                    "ram_gb": 8,
                    "camera_mp": 50,
                    "color": "Snow",
                    "seller_phone": "+92311223344",
                    "seller_city": "Rawalpindi",
                    "condition_grade": 8.3,
                    "condition_category": PhoneCondition.GOOD,
                    "price": Decimal("72000"),
                    "battery_health": 86,
                    "defects": "Minor screen scratches, back in perfect condition",
                    "accessories_included": "Original charger",
                    "pta_approved": True,
                },
                "images": ["/static/images/google-pixel-7.svg", "/static/images/google-pixel-7.svg"],
                "approved": False
            },
            {
                "data": {
                    "brand": "Xiaomi",
                    "model": "Redmi Note 12",
                    "storage_gb": 128,
                    "ram_gb": 6,
                    "camera_mp": 48,
                    "color": "Onyx Gray",
                    "seller_phone": "+92322998877",
                    "seller_city": "Multan",
                    "condition_grade": 9.2,
                    "condition_category": PhoneCondition.EXCELLENT,
                    "price": Decimal("32000"),
                    "battery_health": 96,
                    "warranty_months": 9,
                    "defects": None,
                    "accessories_included": "Full box with all original accessories",
                    "pta_approved": True,
                },
                "images": ["/static/images/redmi-note-12.svg"],
                "approved": True
            },
            {
                "data": {
                    "brand": "Samsung",
                    "model": "Galaxy S21 FE",
                    "storage_gb": 256,
                    "ram_gb": 8,
                    "camera_mp": 32,
                    "color": "Lavender",
                    "seller_phone": "+92334556677",
                    "seller_city": "Sialkot",
                    "condition_grade": 9.3,
                    "condition_category": PhoneCondition.EXCELLENT,
                    "price": Decimal("78000"),
                    "original_price": Decimal("145000"),
                    "battery_health": 93,
                    "warranty_months": 4,
                    "defects": None,
                    "accessories_included": "Box, charger, cable, case",
                    "pta_approved": True,
                },
                "images": ["/static/images/galaxy-s21-fe.svg", "/static/images/galaxy-s21-fe.svg"],
                "approved": True
            },
        ]
        
        for item in user_phones_data_with_images:
            phone_data = item["data"]
            images = item["images"]
            is_approved = item["approved"]
            
            phone = PhoneInventory(
                **phone_data,
                images=json.dumps(images),
                thumbnail=images[0],
                seller_id=seller.id,
                admin_approved=is_approved,
                is_sold=False,
                is_active=True,
            )
            db.add(phone)
        
        db.commit()
        print("✅ User phones created successfully!")
        
        print("\n🎉 Database seeding completed successfully!")
        print("\n📋 Login Credentials:")
        print("=" * 50)
        print("Admin:")
        print("  Email: admin@mobilestore.com")
        print("  Password: admin123")
        print("\nSeller:")
        print("  Email: seller@example.com")
        print("  Password: seller123")
        print("\nBuyer:")
        print("  Email: buyer@example.com")
        print("  Password: buyer123")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
