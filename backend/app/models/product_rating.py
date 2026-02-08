from sqlalchemy import Column, Integer, String, Numeric, Text, ForeignKey, TIMESTAMP, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ProductRating(Base):
    __tablename__ = "product_ratings"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    phone_id = Column(Integer, ForeignKey("phone_inventory.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Numeric(2, 1), nullable=False)
    review = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('order_id', 'phone_id', 'user_id', name='uq_rating_order_phone_user'),
    )
    
    # Relationships
    order = relationship("Order", back_populates="ratings")
    phone = relationship("PhoneInventory", back_populates="ratings")
    user = relationship("User", back_populates="ratings")
