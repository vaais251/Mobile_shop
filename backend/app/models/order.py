"""
Order model for managing phone purchases.

Features:
- Order status tracking (Pending, Shipped, Delivered, Cancelled)
- Multiple payment methods (COD, Credit Card, Easypaisa)
- Tracking ID for shipments
- Order items for multiple phones per order
"""

import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Text, Numeric, Enum, Float
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class OrderStatus(str, enum.Enum):
    """Order status enumeration for tracking order lifecycle."""
    PENDING = "pending"          # Order placed, awaiting payment/processing
    CONFIRMED = "confirmed"      # Payment confirmed, preparing for shipment
    PROCESSING = "processing"    # Order is being prepared
    SHIPPED = "shipped"          # Order has been shipped
    OUT_FOR_DELIVERY = "out_for_delivery"  # Package is out for delivery
    DELIVERED = "delivered"      # Order delivered to customer
    CANCELLED = "cancelled"      # Order cancelled
    RETURNED = "returned"        # Order returned by customer
    REFUNDED = "refunded"        # Order refunded


class PaymentMethod(str, enum.Enum):
    """Payment method enumeration."""
    COD = "cod"                  # Cash on Delivery
    CREDIT_CARD = "credit_card"  # Credit/Debit Card
    EASYPAISA = "easypaisa"      # Easypaisa Mobile Wallet
    JAZZCASH = "jazzcash"        # JazzCash Mobile Wallet
    BANK_TRANSFER = "bank_transfer"  # Direct Bank Transfer


class Order(Base):
    """
    Order model representing a customer purchase.
    
    Attributes:
        id: Primary key
        order_number: Unique order reference number
        buyer_id: User ID of the buyer
        status: Current order status
        payment_method: Selected payment method
        payment_status: Whether payment is complete
        total_amount: Total order amount
        shipping_address: Delivery address
        tracking_id: Shipment tracking number
        notes: Additional order notes
        created_at: Order creation timestamp
        updated_at: Last update timestamp
        shipped_at: Shipment timestamp
        delivered_at: Delivery timestamp
    """
    
    __tablename__ = "orders"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Order identification
    order_number = Column(
        String(50),
        unique=True,
        nullable=False,
        index=True,
        comment="Unique order reference (e.g., ORD-2024-001234)"
    )
    
    # Buyer information
    buyer_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Order status
    status = Column(
        Enum(OrderStatus),
        default=OrderStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Payment information
    payment_method = Column(
        Enum(PaymentMethod),
        nullable=False
    )
    payment_status = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="True if payment is confirmed"
    )
    payment_reference = Column(
        String(100),
        nullable=True,
        comment="Payment transaction reference"
    )
    
    # Pricing
    subtotal = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Sum of all items before shipping/tax"
    )
    shipping_cost = Column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )
    tax_amount = Column(
        Numeric(10, 2),
        default=0,
        nullable=False
    )
    total_amount = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Final total including shipping and tax"
    )
    
    # Shipping information
    shipping_address = Column(Text, nullable=False)
    shipping_city = Column(String(100), nullable=False)
    shipping_phone = Column(String(20), nullable=False)
    tracking_id = Column(
        String(100),
        nullable=True,
        comment="Courier tracking number"
    )
    courier_name = Column(
        String(50),
        nullable=True,
        comment="Name of courier service"
    )
    
    # Additional information
    notes = Column(
        Text,
        nullable=True,
        comment="Customer or admin notes"
    )
    cancellation_reason = Column(
        Text,
        nullable=True,
        comment="Reason for cancellation if cancelled"
    )
    
    # Order completion tracking (for admin)
    completed_at = Column(
        DateTime,
        nullable=True,
        comment="When admin marked order as complete"
    )
    completion_notes = Column(
        Text,
        nullable=True,
        comment="Admin notes when completing order"
    )
    can_be_rated = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether customer can rate products in this order"
    )
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    confirmed_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Relationships
    buyer = relationship(
        "User",
        back_populates="orders",
        foreign_keys=[buyer_id]
    )
    
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )
    
    ratings = relationship(
        "ProductRating",
        back_populates="order",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Order(id={self.id}, order_number='{self.order_number}', status={self.status.value})>"
    
    @property
    def is_cancellable(self) -> bool:
        """Check if order can be cancelled."""
        return self.status in [OrderStatus.PENDING, OrderStatus.CONFIRMED]
    
    @property
    def is_complete(self) -> bool:
        """Check if order is complete."""
        return self.status == OrderStatus.DELIVERED
    
    def can_be_cancelled_by_buyer(self) -> bool:
        """
        Check if order can be cancelled by the buyer.
        Buyers can only cancel within 1 day of order placement and if status is PENDING.
        """
        if self.status != OrderStatus.PENDING:
            return False
        
        # Check if within 1 day (24 hours)
        from datetime import timedelta
        time_since_creation = datetime.utcnow() - self.created_at
        return time_since_creation < timedelta(days=1)
    
    def can_be_managed_by_admin(self) -> bool:
        """Admin can manage orders at any time and in any status."""
        return True
    
    def transition_status(self, new_status: 'OrderStatus', is_admin: bool = False) -> tuple[bool, str]:
        """
        Transition order to a new status with validation.
        
        Args:
            new_status: The target status
            is_admin: Whether the user making the change is an admin
            
        Returns:
            Tuple of (success: bool, message: str)
        """
        # Admins can change to any status
        if is_admin:
            old_status = self.status
            self.status = new_status
            
            # Update timestamps
            if new_status == OrderStatus.CONFIRMED:
                self.confirmed_at = datetime.utcnow()
            elif new_status == OrderStatus.SHIPPED:
                self.shipped_at = datetime.utcnow()
            elif new_status == OrderStatus.DELIVERED:
                self.delivered_at = datetime.utcnow()
                self.completed_at = datetime.utcnow()
            elif new_status == OrderStatus.CANCELLED:
                self.cancelled_at = datetime.utcnow()
            
            return True, f"Status changed from {old_status.value} to {new_status.value}"
        
        # Buyer can only cancel within 1 day and only from PENDING
        if new_status == OrderStatus.CANCELLED:
            if self.can_be_cancelled_by_buyer():
                self.status = OrderStatus.CANCELLED
                self.cancelled_at = datetime.utcnow()
                return True, "Order cancelled successfully"
            else:
                if self.status != OrderStatus.PENDING:
                    return False, "Order can no longer be cancelled (not in pending status)"
                else:
                    return False, "Order can only be cancelled within 1 day of placement"
        
        return False, "Unauthorized status transition"


class OrderItem(Base):
    """
    Order item model representing individual phones in an order.
    
    Allows for multiple phones per order with price history.
    """
    
    __tablename__ = "order_items"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign Keys
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    phone_id = Column(
        Integer,
        ForeignKey("phone_inventory.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    
    # Price at time of purchase (preserved even if phone price changes)
    price_at_purchase = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Price locked at time of order"
    )
    
    # Phone details snapshot (in case phone is deleted)
    phone_brand = Column(String(50), nullable=False)
    phone_model = Column(String(100), nullable=False)
    phone_storage_gb = Column(Integer, nullable=False)
    phone_color = Column(String(50), nullable=False)
    phone_condition = Column(String(50), nullable=False)
    
    # Extended snapshot fields for comprehensive order history
    phone_ram_gb = Column(Integer, nullable=True, comment="Phone RAM in GB")
    phone_camera_mp = Column(Integer, nullable=True, comment="Main camera megapixels")
    phone_battery_health = Column(Integer, nullable=True, comment="Battery health percentage")
    phone_battery_mah = Column(Integer, nullable=True, comment="Battery capacity in mAh")
    phone_condition_grade = Column(Float, nullable=True, comment="Condition rating 1.0-10.0")
    phone_defects = Column(Text, nullable=True, comment="Description of defects")
    phone_accessories = Column(Text, nullable=True, comment="Included accessories")
    phone_images = Column(Text, nullable=True, comment="JSON array of image paths")
    phone_thumbnail = Column(String(255), nullable=True, comment="Main product image")
    phone_pta_approved = Column(Boolean, default=False, comment="PTA approval status")
    phone_warranty_months = Column(Integer, default=0, comment="Warranty in months")
    
    # Seller snapshot (for community products)
    seller_id = Column(Integer, nullable=True, comment="Seller user ID (NULL = shop owned)")
    seller_name = Column(String(100), nullable=True, comment="Seller name")
    seller_email = Column(String(255), nullable=True, comment="Seller email")
    seller_phone = Column(String(20), nullable=True, comment="Seller phone number")
    seller_city = Column(String(100), nullable=True, comment="Seller city")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    phone = relationship("PhoneInventory", back_populates="order_items")
    
    def __repr__(self) -> str:
        return f"<OrderItem(id={self.id}, phone='{self.phone_brand} {self.phone_model}', price={self.price_at_purchase})>"
