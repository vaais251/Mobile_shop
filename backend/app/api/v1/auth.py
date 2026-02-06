"""
Authentication API endpoints.

Endpoints:
- POST /auth/signup - Register new user
- POST /auth/login - Login and get JWT token
- GET /auth/me - Get current user info
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.dependencies import get_current_user
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.services.user_service import UserService
from app.models.user import User


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Register a new user account. All users start as 'Buyer' role by default."
)
async def signup(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """
    Register a new user account.
    
    - **email**: Valid email address (must be unique)
    - **password**: Password (min 6 characters)
    - **name**: Full name
    - **phone_number**: Optional phone number
    
    Returns access token for immediate login.
    
    **Note:** All new users are assigned 'Buyer' role by default.
    Only an Admin can promote users to 'Admin' or 'Seller' roles.
    """
    user_service = UserService(db)
    
    try:
        user = user_service.create(user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Create access token
    access_token = create_access_token(subject=user.id)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login to get access token",
    description="Authenticate with email and password to receive a JWT access token."
)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return JWT access token.
    
    - **username**: Email address
    - **password**: Password
    
    Returns JWT access token for authenticated requests.
    """
    user_service = UserService(db)
    
    user = user_service.authenticate(
        email=form_data.username,  # OAuth2 uses 'username' field
        password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(subject=user.id)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post(
    "/login/json",
    response_model=TokenResponse,
    summary="Login with JSON body",
    description="Alternative login endpoint that accepts JSON body instead of form data."
)
async def login_json(
    credentials: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with JSON body and return JWT access token.
    
    - **email**: Email address
    - **password**: Password
    """
    user_service = UserService(db)
    
    user = user_service.authenticate(
        email=credentials.email,
        password=credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(subject=user.id)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the currently authenticated user's information."
)
async def get_me(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user's profile.
    
    Requires valid JWT token in Authorization header.
    """
    return UserResponse.model_validate(current_user)
