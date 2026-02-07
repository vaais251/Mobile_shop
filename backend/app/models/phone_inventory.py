"""
Phone Inventory model for second-hand phone listings.

Features:
- Detailed phone specifications (brand, model, storage, color)
- Condition grading system (10/10 scale)
- Defects tracking for transparency
- Admin approval workflow for user-listed phones
- Sold status tracking
"""

import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Text, Numeric, Float, Enum
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class PhoneCondition(str, enum.Enum):
    """
    Phone condition grades.
    Uses descriptive grades that map to the 10/10 scale.
    """
    MINT = "mint"           # 10/10 - Like new, perfect condition
    EXCELLENT = "excellent"  # 9/10 - Minimal signs of use
    GOOD = "good"           # 8/10 - Light scratches/marks
    FAIR = "fair"           # 7/10 - Visible wear but fully functional
    POOR = "poor"           # 6/10 or below - Significant wear/damage


class PhoneInventory(Base):
    """
    Phone inventory model representing second-hand phones for sale.
    
    Attributes:
        id: Primary key
        brand: Phone manufacturer (Apple, Samsung, etc.)
        model: Phone model name (iPhone 14 Pro, Galaxy S23, etc.)
        storage_gb: Storage capacity in GB
        ram_gb: Phone RAM in GB
        camera_mp: Main camera megapixels
        color: Phone color
        seller_phone: Seller's contact phone number
        seller_city: Seller's city
        condition_grade: Numeric condition rating (1-10)
        condition_category: Categorical condition (Mint, Excellent, etc.)
        defects: Text description of any issues/defects
        price: Selling price
        original_price: Original retail price (for comparison)
        is_sold: Whether the phone has been sold
        seller_id: User ID of seller (NULL if shop-owned)
        admin_approved: Whether listing is approved (for user listings)
        images: JSON array of image URLs
        imei: Phone IMEI number (for verification)
        battery_health: Battery health percentage
        warranty_months: Remaining warranty in months
        accessories_included: Description of included accessories
        created_at: Listing creation timestamp
        updated_at: Last update timestamp
    """
    
    __tablename__ = "phone_inventory"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Phone Specifications
    brand = Column(String(50), nullable=False, index=True)
    model = Column(String(100), nullable=False, index=True)
    storage_gb = Column(Integer, nullable=False)  # e.g., 64, 128, 256, 512, 1024
    ram_gb = Column(Integer, nullable=True, comment="Phone RAM in GB")
    camera_mp = Column(Integer, nullable=True, comment="Main camera megapixels")
    color = Column(String(50), nullable=False)
    
    # Seller Contact Information
    seller_phone = Column(String(20), nullable=True, comment="Seller's contact phone number")
    seller_city = Column(String(100), nullable=True, comment="Seller's city")
    
    # Condition Information
    condition_grade = Column(
        Float,
        nullable=False,
        comment="Condition rating from 1.0 to 10.0"
    )
    condition_category = Column(
        Enum(PhoneCondition),
        nullable=False,
        default=PhoneCondition.GOOD
    )
    defects = Column(
        Text,
        nullable=True,
        comment="Description of any defects (e.g., 'dot on screen, charging port loose')"
    )
    
    # Pricing
    price = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Current selling price"
    )
    original_price = Column(
        Numeric(10, 2),
        nullable=True,
        comment="Original retail price for comparison"
    )
    
    # Status flags
    is_sold = Column(Boolean, default=False, nullable=False, index=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    pta_approved = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Indicates if the phone is PTA approved for use in Pakistan"
    )
    
    # Seller and approval
    seller_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="NULL indicates shop/admin owned phone"
    )
    admin_approved = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="User listings require admin approval"
    )
    
    # Additional details
    images = Column(
        Text,
        nullable=True,
        comment="JSON array of multiple image file paths"
    )
    thumbnail = Column(
        String(255),
        nullable=True,
        comment="Main cover image path (one of the images)"
    )
    imei = Column(
        String(20),
        nullable=True,
        unique=True,
        comment="IMEI for phone verification"
    )
    battery_health = Column(
        Integer,
        nullable=True,
        comment="Battery health percentage (0-100)"
    )
    battery_mah = Column(
        Integer,
        nullable=True,
        comment="Battery capacity in mAh (e.g., 4000, 5000)"
    )
    warranty_months = Column(
        Integer,
        default=0,
        comment="Remaining warranty in months"
    )
    accessories_included = Column(
        Text,
        nullable=True,
        comment="Description of included accessories"
    )
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    seller = relationship(
        "User",
        back_populates="listed_phones",
        foreign_keys=[seller_id]
    )
    
    order_items = relationship(
        "OrderItem",
        back_populates="phone",
        cascade="all, delete-orphan"
    )
    
    # Product ratings for this phone
    ratings = relationship(
        "ProductRating",
        back_populates="phone",
        foreign_keys="ProductRating.phone_id"
    )
    
    def __repr__(self) -> str:
        return f"<PhoneInventory(id={self.id}, brand='{self.brand}', model='{self.model}', price={self.price})>"
    
    @property
    def is_shop_owned(self) -> bool:
        """Check if phone is owned by shop (not a user listing)."""
        return self.seller_id is None
    
    @property
    def is_available(self) -> bool:
        """Check if phone is available for purchase."""
        return (
            not self.is_sold 
            and self.is_active 
            and (self.is_shop_owned or self.admin_approved)
        )
    
    @property
    def condition_display(self) -> str:
        """Get display string for condition (e.g., '9/10')."""
        return f"{self.condition_grade:.1f}/10"
    
    @property
    def discount_percentage(self) -> float:
        """Calculate discount percentage from original price."""
        if self.original_price and self.original_price > 0:
            discount = ((self.original_price - self.price) / self.original_price) * 100
            return round(float(discount), 1)
        return 0.0
