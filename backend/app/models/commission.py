"""
Commission model for tracking platform fees on community sales.

Business Logic:
- Community sellers list products
- Admin acts as intermediary/consultant
- Platform takes commission on each sale
- Track pending and paid commissions
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


class CommissionStatus(str, enum.Enum):
    """Commission payment status."""
    PENDING = "pending"      # Commission calculated but not paid to seller
    PROCESSING = "processing" # Payment being processed
    PAID = "paid"            # Commission paid to seller
    CANCELLED = "cancelled"  # Order cancelled, commission void
    DISPUTED = "disputed"    # Dispute raised


class Commission(Base):
    """
    Commission tracking model for community marketplace sales.
    
    Attributes:
        id: Primary key
        order_id: Reference to order
        order_item_id: Specific item in order (multiple items may have different sellers)
        seller_id: Seller who listed the product
        product_price: Sale price of product
        commission_rate: Percentage rate applied (e.g., 10.00 for 10%)
        commission_amount: Calculated commission amount
        platform_revenue: Amount kept by platform
        seller_payout: Amount to be paid to seller
        status: Payment status
        paid_at: When commission was paid
        payment_method: How payment was made
        payment_reference: Transaction reference
        notes: Internal notes
    """
    
    __tablename__ = "commissions"
    
    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Order References
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Reference to order"
    )
    order_item_id = Column(
        Integer,
        ForeignKey("order_items.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Specific order item (for multi-seller orders)"
    )
    
    # Seller Reference
    seller_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="Community seller"
    )
    
    # Financial Details
    product_price = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Sale price of product"
    )
    commission_rate = Column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("10.00"),
        comment="Commission percentage (e.g., 10.00 = 10%)"
    )
    commission_amount = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Calculated commission (price * rate / 100)"
    )
    platform_revenue = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Amount kept by platform (= commission_amount)"
    )
    seller_payout = Column(
        Numeric(10, 2),
        nullable=False,
        comment="Amount to pay seller (= product_price - commission_amount)"
    )
    
    # Payment Status
    status = Column(
        Enum(CommissionStatus, native_enum=True, values_callable=lambda x: [e.value for e in x]),
        default=CommissionStatus.PENDING,
        nullable=False,
        index=True
    )
    
    # Payment Details
    paid_at = Column(
        DateTime,
        nullable=True,
        comment="Timestamp when commission was paid"
    )
    payment_method = Column(
        String(50),
        nullable=True,
        comment="Payment method (bank_transfer, easypaisa, jazzcash)"
    )
    payment_reference = Column(
        String(100),
        nullable=True,
        comment="Transaction reference number"
    )
    processed_by_user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Team member who processed payment"
    )
    
    # Notes
    notes = Column(
        Text,
        nullable=True,
        comment="Internal notes or dispute resolution"
    )
    
    # Timestamps
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
        index=True
    )
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    order = relationship("Order", backref="commissions")
    order_item = relationship("OrderItem", backref="commission")
    seller = relationship(
        "User",
        foreign_keys=[seller_id],
        backref="earned_commissions"
    )
    processed_by = relationship(
        "User",
        foreign_keys=[processed_by_user_id]
    )
    
    def __repr__(self) -> str:
        return f"<Commission(id={self.id}, seller_id={self.seller_id}, amount={self.commission_amount}, status={self.status.value})>"
    
    @property
    def is_payable(self) -> bool:
        """Check if commission can be paid."""
        return self.status == CommissionStatus.PENDING
    
    @property
    def is_paid(self) -> bool:
        """Check if commission has been paid."""
        return self.status == CommissionStatus.PAID
    
    def mark_as_paid(self, payment_method: str, payment_reference: str, processed_by_id: int) -> None:
        """Mark commission as paid."""
        self.status = CommissionStatus.PAID
        self.paid_at = datetime.utcnow()
        self.payment_method = payment_method
        self.payment_reference = payment_reference
        self.processed_by_user_id = processed_by_id
    
    def calculate_commission(self) -> None:
        """Calculate commission amounts based on rate."""
        self.commission_amount = (self.product_price * self.commission_rate) / Decimal("100")
        self.platform_revenue = self.commission_amount
        self.seller_payout = self.product_price - self.commission_amount
    
    @staticmethod
    def create_from_order_item(
        order_item,
        commission_rate: Decimal = Decimal("10.00")
    ) -> "Commission":
        """
        Factory method to create commission from order item.
        Only creates commission for community products (seller_id is not None).
        """
        # Use the snapshot seller_id from order_item, not the phone relationship
        if not order_item.seller_id:
            return None  # Shop-owned products don't generate commissions
        
        commission = Commission(
            order_id=order_item.order_id,
            order_item_id=order_item.id,
            seller_id=order_item.seller_id,  # Use snapshot field
            product_price=order_item.price_at_purchase,
            commission_rate=commission_rate,
            status=CommissionStatus.PENDING
        )
        commission.calculate_commission()
        return commission
