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
    ForeignKey, Text, Numeric, Enum
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
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    order = relationship("Order", back_populates="items")
    phone = relationship("PhoneInventory", back_populates="order_items")
    
    def __repr__(self) -> str:
        return f"<OrderItem(id={self.id}, phone='{self.phone_brand} {self.phone_model}', price={self.price_at_purchase})>"
