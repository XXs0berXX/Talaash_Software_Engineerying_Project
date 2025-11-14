"""
Authentication routes for user signup and login
Handles Firebase authentication integration
"""

from fastapi import APIRouter, HTTPException, status, Depends, Header, Body
from pydantic import BaseModel
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

# Initialize the router
router = APIRouter()

# Initialize Firebase on startup
initialize_firebase()


class LoginRequest(BaseModel):
    email: str
    token: str


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(
    request: UserSignupRequest,
    db: Session = Depends(get_db)
):
    """
    User signup endpoint
    """
    print(f"Signup attempt - Name: {request.name}, Email: {request.email}")
    
    # Validate email domain
    if not validate_iba_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @iba.edu.pk email addresses are allowed"
        )
    
    # Check if user already exists in database
    existing_user = get_user_by_email(db, request.email)
    if existing_user:
        print(f"User already exists in database: {existing_user.email}")
        # Return the existing user instead of throwing error
        return existing_user
    
    print("Creating new user in database...")
    
    # Create user with default "user" role
    db_user = create_user(
        db=db,
        name=request.name,
        email=request.email,
        role="user"
    )
    
    print(f"User created successfully: {db_user.email}")
    return db_user


@router.post("/login")
def login(
    request: LoginRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    User login endpoint
    """
    print(f"Login attempt - Email: {request.email}")
    
    if not request.email:
        raise HTTPException(status_code=422, detail="Email is required")
    
    if not request.token:
        raise HTTPException(status_code=422, detail="Token is required")
    
    # Validate email domain
    if not validate_iba_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @iba.edu.pk email addresses are allowed"
        )
    
    # Get user from database
    db_user = get_user_by_email(db, request.email)
    if not db_user:
        # Attempt to create a backend user from the provided Firebase token
        try:
            token_user = get_user_from_token(request.token)
        except Exception as e:
            print(f"Failed to get user from token: {e}")
            token_user = None

        # If token_user was retrieved and emails match, create the DB user automatically
        if token_user and token_user.get("email") == request.email:
            print(f"No DB user found for {request.email}, creating from token info")
            db_user = create_user(
                db=db,
                name=token_user.get("name") or request.email.split("@")[0],
                email=request.email,
                role="user"
            )
            print(f"Created backend user for {db_user.email} (id={db_user.id})")
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found. Please sign up first."
            )
    
    print(f"Login successful for: {db_user.email}")
    
    return {
        "status": "success",
        "user": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        },
        "token": request.token
    }


@router.get("/verify-token")
def verify_token(
    authorization: str = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    """
    Verify Firebase token validity
    """
    try:
        # Check if authorization header exists
        if not authorization:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authorization header is required"
            )
        
        # Extract token from header
        token = extract_token_from_header(authorization)
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format. Expected: Bearer <token>"
            )
        
        # Verify token and get user data
        user_data = get_user_from_token(token)
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        # Get user from database using email from token
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
        
    except Exception as e:
        print(f"Error in verify-token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )


@router.post("/logout")
def logout():
    """
    User logout endpoint
    """
    return {
        "status": "success",
        "message": "Logged out successfully"
    }