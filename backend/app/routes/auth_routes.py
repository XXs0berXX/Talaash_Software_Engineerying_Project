"""
Authentication routes for user signup and login
Handles Firebase authentication integration
"""
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.user_model import (
    UserSignupRequest,
    UserResponse,
    create_user,
    get_user_by_email,
    user_exists
)
from app.utils.validators import validate_iba_email
from app.utils.firebase_verify import (
    extract_token_from_header,
    get_user_from_token,
    initialize_firebase
)

router = APIRouter()

# Initialize Firebase on startup
initialize_firebase()


# 💡 FIX: Inherit from BaseModel to define the expected JSON body structure
class LoginRequest(BaseModel): 
    """Pydantic Model for login request body"""
    email: str
    token: str


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(
    request: UserSignupRequest,
    db: Session = Depends(get_db)
):
    """
    User signup endpoint
    
    - Validates that email ends with @iba.edu.pk
    - Creates user record in database
    - Frontend handles Firebase Authentication
    
    Args:
        request: Signup request with name and email
        db: Database session
        
    Returns:
        Created user object
        
    Raises:
        HTTPException: If email is invalid or user already exists
    """
    
    # Validate email domain
    if not validate_iba_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @iba.edu.pk email addresses are allowed"
        )
    
    # Check if user already exists
    if user_exists(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create user with default "user" role
    db_user = create_user(
        db=db,
        name=request.name,
        email=request.email,
        role="user"
    )
    
    return db_user


@router.post("/login")
def login(
    request: LoginRequest, # 💡 FIX: Accept the LoginRequest Pydantic model
    db: Session = Depends(get_db)
):
    """
    User login endpoint
    
    - Validates Firebase token
    - Returns user information
    - Frontend handles Firebase Authentication, backend validates token
    
    Args:
        request: JSON body containing email and Firebase ID token
        db: Database session
        
    Returns:
        User information and authentication status
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    # 💡 Access email and token from the request object
    email = request.email
    token = request.token
    
    # Validate email domain
    if not validate_iba_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email domain"
        )
    
    # Verify Firebase token
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user from database
    db_user = get_user_by_email(db, email)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please sign up first."
        )
    
    return {
        "status": "success",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        },
        "token": token
    }


@router.get("/verify-token")
def verify_token(
    authorization: str,
    db: Session = Depends(get_db)
):
    """
    Verify Firebase token validity
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        Token validity status and user information
        
    Raises:
        HTTPException: If token is invalid
    """
    
    # Extract token from header
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    # Verify token
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user from database
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user:
        return {
            "status": "needs_signup",
            "email": user_data.get("email"),
            "message": "User needs to complete signup"
        }
    
    return {
        "status": "valid",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        }
    }


@router.post("/logout")
def logout():
    """
    User logout endpoint
    Note: Firebase handles token invalidation on client side
    
    Returns:
        Logout status
    """
    return {
        "status": "success",
        "message": "Logged out successfully. Clear your frontend token."
    }