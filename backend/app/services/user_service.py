"""
User service - Business logic for user management.
"""

from sqlalchemy.orm import Session
from typing import Optional

from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.core.security import get_password_hash, verify_password


class UserService:
    """Service class for user-related operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID."""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        return self.db.query(User).filter(User.email == email).first()
    
    def create(self, user_data: UserCreate) -> User:
        """
        Create a new user.
        
        Args:
            user_data: User registration data
            
        Returns:
            Created user object
            
        Raises:
            ValueError: If email already exists
        """
        # Check if email exists
        existing = self.get_by_email(user_data.email)
        if existing:
            raise ValueError("Email already registered")
        
        # Create user with hashed password
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            name=user_data.name,
            phone_number=user_data.phone_number,
            city=user_data.city,
            role=UserRole.BUYER,  # Default role is Buyer
            is_verified=False,
            is_active=True,
        )
        
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def authenticate(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate user with email and password.
        
        Args:
            email: User email
            password: Plain text password
            
        Returns:
            User if credentials are valid, None otherwise
        """
        user = self.get_by_email(email)
        if not user:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        if not user.is_active:
            return None
        
        return user
    
    def update_role(self, user_id: int, new_role: UserRole) -> Optional[User]:
        """
        Update user role (Admin only operation).
        
        Args:
            user_id: User ID to update
            new_role: New role to assign
            
        Returns:
            Updated user or None if not found
        """
        user = self.get_by_id(user_id)
        if not user:
            return None
        
        user.role = new_role
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def verify_seller(self, user_id: int, verified: bool = True) -> Optional[User]:
        """
        Verify or unverify a seller account.
        
        Args:
            user_id: Seller user ID
            verified: Verification status
            
        Returns:
            Updated user or None
        """
        user = self.get_by_id(user_id)
        if not user or user.role != UserRole.SELLER:
            return None
        
        user.is_verified = verified
        self.db.commit()
        self.db.refresh(user)
        
        return user
