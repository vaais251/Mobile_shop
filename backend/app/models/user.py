"""
User model with role-based access control.

Roles:
- Admin: Can manage all phones, approve seller listings, manage users
- Seller: Can list their own phones (requires admin approval)
- Buyer: Can browse and purchase phones
"""

import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Enum, Text
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User role enumeration for access control."""
    ADMIN = "admin"
    SELLER = "seller"
    BUYER = "buyer"


class User(Base):
    """
    User model representing customers, sellers, and admins.
    
    Attributes:
        id: Primary key
        email: Unique email address for authentication
        password_hash: Bcrypt hashed password
        name: Full name of the user
        phone_number: Contact phone number
        role: User role (Admin, Seller, Buyer)
        is_verified: Whether seller account is verified by admin
        is_active: Whether account is active (for soft delete)
        profile_image_url: URL to user's profile image
        address: Shipping/billing address
        created_at: Account creation timestamp
        updated_at: Last update timestamp
    """
    
    __tablename__ = "users"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Authentication fields
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # Profile information
    name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    city = Column(String(100), nullable=False, default="Unknown")
    profile_image_url = Column(String(500), nullable=True)
    address = Column(Text, nullable=True)
    
    # Shipping information (for smart checkout pre-fill)
    shipping_address = Column(Text, nullable=True, comment="Default shipping address")
    
    # Role and verification
    role = Column(
        Enum(UserRole),
        default=UserRole.BUYER,
        nullable=False,
        index=True
    )
    is_verified = Column(Boolean, default=False, nullable=False)
    is_verified_seller = Column(
        Boolean, 
        default=False, 
        nullable=False,
        comment="Verified seller trust badge (shown in community listings)"
    )
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    # Phones listed by this seller (if seller)
    listed_phones = relationship(
        "PhoneInventory",
        back_populates="seller",
        foreign_keys="PhoneInventory.seller_id",
        cascade="all, delete-orphan"
    )
    
    # Orders placed by this user (as buyer)
    orders = relationship(
        "Order",
        back_populates="buyer",
        foreign_keys="Order.buyer_id",
        cascade="all, delete-orphan"
    )
    
    # Chat messages sent by this user
    sent_messages = relationship(
        "ChatMessage",
        back_populates="sender",
        foreign_keys="ChatMessage.sender_id",
        cascade="all, delete-orphan"
    )
    
    # Chat messages received by this user
    received_messages = relationship(
        "ChatMessage",
        back_populates="receiver",
        foreign_keys="ChatMessage.receiver_id",
        cascade="all, delete-orphan"
    )
    
    # Admin messages sent by this user
    messages = relationship(
        "Message",
        back_populates="sender",
        foreign_keys="Message.sender_id"
    )
    
    # Product ratings given by this user
    ratings = relationship(
        "ProductRating",
        back_populates="user",
        foreign_keys="ProductRating.user_id"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role={self.role.value})>"
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role."""
        return self.role == UserRole.ADMIN
    
    @property
    def is_seller(self) -> bool:
        """Check if user has seller role."""
        return self.role == UserRole.SELLER
    
    @property
    def can_list_phones(self) -> bool:
        """Check if user can list phones (admin or verified seller)."""
        return self.is_admin or (self.is_seller and self.is_verified)
