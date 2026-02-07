"""
FastAPI dependencies for authentication and authorization.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole


# OAuth2 scheme for JWT tokens
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    
    Raises:
        HTTPException 401: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token
    user_id = decode_access_token(token)
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current active user.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    return current_user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current user if they are an admin.
    
    Raises:
        HTTPException 403: If user is not an admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_seller(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current user if they can sell (admin or verified seller).
    
    Raises:
        HTTPException 403: If user cannot sell
    """
    if current_user.role == UserRole.ADMIN:
        return current_user
    
    if current_user.role == UserRole.SELLER and current_user.is_verified:
        return current_user
    
    # Allow buyers to list phones too (community marketplace)
    if current_user.role == UserRole.BUYER:
        return current_user
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You are not authorized to sell phones"
    )


def get_optional_user(
    db: Session = Depends(get_db)
):
    """
    Optional authentication - returns user if token valid, None otherwise.
    Useful for endpoints that work both authenticated and unauthenticated.
    This is a factory that returns the actual dependency.
    """
    from fastapi import Request
    
    async def _get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
        
        token = auth_header.split(" ")[1]
        if not token:
            return None
        
        try:
            user_id = decode_access_token(token)
            if user_id is None:
                return None
            
            user = db.query(User).filter(User.id == int(user_id)).first()
            return user if user and user.is_active else None
        except Exception:
            return None
    
    return _get_optional_user


# Optional OAuth2 scheme that doesn't require authentication
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Optional authentication - returns user if token valid, None otherwise.
    Useful for endpoints that work both authenticated and unauthenticated.
    """
    if not token:
        return None
    
    try:
        user_id = decode_access_token(token)
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user if user and user.is_active else None
    except Exception:
        return None

