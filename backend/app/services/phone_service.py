"""
Phone service - Business logic for phone inventory management.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import Optional, List, Tuple
from decimal import Decimal

from app.models.phone_inventory import PhoneInventory, PhoneCondition
from app.models.user import User, UserRole
from app.schemas.phone import PhoneCreate, PhoneUpdate


class PhoneService:
    """Service class for phone inventory operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, phone_id: int) -> Optional[PhoneInventory]:
        """Get phone by ID with seller info."""
        return (
            self.db.query(PhoneInventory)
            .options(joinedload(PhoneInventory.seller))
            .filter(PhoneInventory.id == phone_id)
            .first()
        )
    
    def get_shop_phones(
        self,
        brand: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        min_condition: Optional[float] = None,
        storage_gb: Optional[int] = None,
        condition_category: Optional[PhoneCondition] = None,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[PhoneInventory], int]:
        """
        Get shop-owned phones (seller_id is NULL).
        These are the premium phones owned by the shop/admin.
        
        Returns:
            Tuple of (phones list, total count)
        """
        query = (
            self.db.query(PhoneInventory)
            .filter(
                PhoneInventory.seller_id.is_(None),  # Shop-owned
                PhoneInventory.is_sold == False,
                PhoneInventory.is_active == True,
            )
        )
        
        # Apply filters
        query = self._apply_filters(
            query, brand, min_price, max_price, 
            min_condition, storage_gb, condition_category
        )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        phones = (
            query
            .order_by(PhoneInventory.is_featured.desc(), PhoneInventory.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        
        return phones, total
    
    def get_community_phones(
        self,
        brand: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        min_condition: Optional[float] = None,
        storage_gb: Optional[int] = None,
        condition_category: Optional[PhoneCondition] = None,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[PhoneInventory], int]:
        """
        Get community phones (seller_id NOT NULL AND admin_approved).
        These are phones listed by verified sellers.
        
        Returns:
            Tuple of (phones list, total count)
        """
        query = (
            self.db.query(PhoneInventory)
            .options(joinedload(PhoneInventory.seller))
            .filter(
                PhoneInventory.seller_id.isnot(None),  # User-owned
                PhoneInventory.admin_approved == True,  # Approved by admin
                PhoneInventory.is_sold == False,
                PhoneInventory.is_active == True,
            )
        )
        
        # Apply filters
        query = self._apply_filters(
            query, brand, min_price, max_price, 
            min_condition, storage_gb, condition_category
        )
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        phones = (
            query
            .order_by(PhoneInventory.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        
        return phones, total
    
    def get_pending_approval(
        self,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[PhoneInventory], int]:
        """
        Get phones pending admin approval.
        
        Returns:
            Tuple of (phones list, total count)
        """
        query = (
            self.db.query(PhoneInventory)
            .options(joinedload(PhoneInventory.seller))
            .filter(
                PhoneInventory.seller_id.isnot(None),
                PhoneInventory.admin_approved == False,
                PhoneInventory.is_active == True,
            )
        )
        
        total = query.count()
        
        phones = (
            query
            .order_by(PhoneInventory.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        
        return phones, total
    
    def get_user_listings(
        self,
        user_id: int,
        page: int = 1,
        size: int = 20,
    ) -> Tuple[List[PhoneInventory], int]:
        """
        Get phones listed by a specific user.
        
        Returns:
            Tuple of (phones list, total count)
        """
        query = (
            self.db.query(PhoneInventory)
            .filter(PhoneInventory.seller_id == user_id)
        )
        
        total = query.count()
        
        phones = (
            query
            .order_by(PhoneInventory.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
        )
        
        return phones, total
    
    def create_shop_phone(self, phone_data: PhoneCreate) -> PhoneInventory:
        """
        Create a shop-owned phone (admin operation).
        Automatically approved and seller_id is NULL.
        """
        phone = PhoneInventory(
            brand=phone_data.brand,
            model=phone_data.model,
            storage_gb=phone_data.storage_gb,
            color=phone_data.color,
            condition_grade=phone_data.condition_grade,
            condition_category=phone_data.condition_category,
            defects=phone_data.defects,
            price=phone_data.price,
            original_price=phone_data.original_price,
            images=phone_data.images,
            battery_health=phone_data.battery_health,
            warranty_months=phone_data.warranty_months,
            accessories_included=phone_data.accessories_included,
            imei=phone_data.imei,
            seller_id=None,  # Shop-owned
            admin_approved=True,  # Auto-approved
            is_sold=False,
            is_active=True,
        )
        
        self.db.add(phone)
        self.db.commit()
        self.db.refresh(phone)
        
        return phone
    
    def create_user_phone(
        self, 
        phone_data: PhoneCreate, 
        seller_id: int
    ) -> PhoneInventory:
        """
        Create a user-listed phone.
        Requires admin approval (admin_approved = False).
        """
        phone = PhoneInventory(
            brand=phone_data.brand,
            model=phone_data.model,
            storage_gb=phone_data.storage_gb,
            color=phone_data.color,
            condition_grade=phone_data.condition_grade,
            condition_category=phone_data.condition_category,
            defects=phone_data.defects,
            price=phone_data.price,
            original_price=phone_data.original_price,
            images=phone_data.images,
            battery_health=phone_data.battery_health,
            warranty_months=phone_data.warranty_months,
            accessories_included=phone_data.accessories_included,
            imei=phone_data.imei,
            seller_id=seller_id,  # User-owned
            admin_approved=False,  # HARDCODED: Requires admin approval
            is_sold=False,
            is_active=True,
        )
        
        self.db.add(phone)
        self.db.commit()
        self.db.refresh(phone)
        
        return phone
    
    def approve_phone(self, phone_id: int) -> Optional[PhoneInventory]:
        """
        Approve a user-listed phone (admin operation).
        """
        phone = self.get_by_id(phone_id)
        if not phone:
            return None
        
        if phone.seller_id is None:
            # Shop phone, already approved
            return phone
        
        phone.admin_approved = True
        self.db.commit()
        self.db.refresh(phone)
        
        return phone
    
    def reject_phone(self, phone_id: int) -> Optional[PhoneInventory]:
        """
        Reject/deactivate a phone listing.
        """
        phone = self.get_by_id(phone_id)
        if not phone:
            return None
        
        phone.is_active = False
        phone.admin_approved = False
        self.db.commit()
        self.db.refresh(phone)
        
        return phone
    
    def delete_phone(self, phone_id: int) -> bool:
        """
        Delete a phone listing (admin operation).
        """
        phone = self.get_by_id(phone_id)
        if not phone:
            return False
        
        self.db.delete(phone)
        self.db.commit()
        
        return True
    
    def update_phone(
        self, 
        phone_id: int, 
        phone_data: PhoneUpdate,
        requesting_user: User,
    ) -> Optional[PhoneInventory]:
        """
        Update a phone listing.
        
        - Admins can update any phone
        - Sellers can only update their own phones
        """
        phone = self.get_by_id(phone_id)
        if not phone:
            return None
        
        # Check permission
        if requesting_user.role != UserRole.ADMIN:
            if phone.seller_id != requesting_user.id:
                return None  # Not authorized
        
        # Update only provided fields
        update_data = phone_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(phone, field, value)
        
        self.db.commit()
        self.db.refresh(phone)
        
        return phone
    
    def mark_as_sold(self, phone_id: int) -> Optional[PhoneInventory]:
        """Mark a phone as sold."""
        phone = self.get_by_id(phone_id)
        if not phone:
            return None
        
        phone.is_sold = True
        self.db.commit()
        self.db.refresh(phone)
        
        return phone
    
    def _apply_filters(
        self,
        query,
        brand: Optional[str],
        min_price: Optional[Decimal],
        max_price: Optional[Decimal],
        min_condition: Optional[float],
        storage_gb: Optional[int],
        condition_category: Optional[PhoneCondition],
    ):
        """Apply common filters to phone query."""
        
        if brand:
            query = query.filter(PhoneInventory.brand.ilike(f"%{brand}%"))
        
        if min_price is not None:
            query = query.filter(PhoneInventory.price >= min_price)
        
        if max_price is not None:
            query = query.filter(PhoneInventory.price <= max_price)
        
        if min_condition is not None:
            query = query.filter(PhoneInventory.condition_grade >= min_condition)
        
        if storage_gb is not None:
            query = query.filter(PhoneInventory.storage_gb == storage_gb)
        
        if condition_category is not None:
            query = query.filter(PhoneInventory.condition_category == condition_category)
        
        return query
