"""
Admin routes for administrative operations
Handles admin signup, login, and item moderation
"""

import os
from fastapi import APIRouter, HTTPException, status, Depends, Query, Header
from typing import Annotated
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.db import get_db
from app.models.user_model import (
    AdminSignupRequest,
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

# Simple admin key for registration (should be environment variable in production)
ADMIN_KEY = os.getenv("ADMIN_KEY", "admin_secret_2024")

initialize_firebase()


# Pydantic model for login request
class AdminLoginRequest(BaseModel):
    email: str
    token: str


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_signup(
    request: AdminSignupRequest,
    db: Session = Depends(get_db)
):
    """
    Admin signup endpoint
    
    - Validates admin key
    - Validates @khi.iba.edu.pk email domain
    - Creates admin user record
    
    Args:
        request: Admin signup request with name, email, and admin key
        db: Database session
        
    Returns:
        Created admin user object
        
    Raises:
        HTTPException: If admin key is invalid, email is invalid, or user exists
    """
    
    # Validate admin key
    if request.admin_key != ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin registration key"
        )
    
    # Validate email domain
    if not validate_iba_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only @khi.iba.edu.pk email addresses are allowed"
        )
    
    # Check if user already exists
    if user_exists(db, request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    
    # Create admin user with "admin" role
    db_user = create_user(
        db=db,
        name=request.name,
        email=request.email,
        role="admin"
    )
    
    return db_user


@router.post("/login")
def admin_login(
    request: AdminLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Admin login endpoint
    
    - Validates Firebase token
    - Verifies user is admin
    - Returns admin dashboard redirect
    
    Args:
        request: Login request with email and Firebase token
        db: Database session
        
    Returns:
        Admin information and authentication status
        
    Raises:
        HTTPException: If token invalid, user not found, or not admin
    """
    
    # Validate email domain
    if not validate_iba_email(request.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email domain"
        )
    
    # Verify Firebase token
    user_data = get_user_from_token(request.token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user from database
    db_user = get_user_by_email(db, request.email)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin user not found"
        )
    
    # Verify user is admin
    if db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    return {
        "status": "success",
        "admin": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        },
        "redirect": "/admin/dashboard"
    }


@router.get("/dashboard")
def admin_dashboard(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db)
):
    """
    Admin dashboard data endpoint
    Returns statistics and pending items
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        Dashboard statistics and pending items
        
    Raises:
        HTTPException: If token invalid or user not admin
    """
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing"
        )
    
    # Extract and verify token
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user and verify admin
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user or db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Import FoundItemDB here to avoid circular imports
    from app.models.item_model import FoundItemDB
    
    # Get statistics
    pending_items = db.query(func.count(FoundItemDB.id)).filter(FoundItemDB.status == "pending").scalar()
    total_items = db.query(func.count(FoundItemDB.id)).scalar()
    approved_items = db.query(func.count(FoundItemDB.id)).filter(FoundItemDB.status == "approved").scalar()
    
    return {
        "status": "success",
        "admin": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email
        },
        "statistics": {
            "pending_items": pending_items or 0,
            "total_items": total_items or 0,
            "approved_items": approved_items or 0
        }
    }


@router.get("/items/pending")
def get_pending_items(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50)
):
    """
    Get pending items for admin review
    
    Headers:
        authorization: "Bearer <token>"
    
    Query Parameters:
        skip: Number of items to skip (pagination)
        limit: Number of items to return
    
    Returns:
        List of pending found items
        
    Raises:
        HTTPException: If token invalid or user not admin
    """
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing"
        )
    
    # Extract and verify token
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user and verify admin
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user or db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Get pending items
    from app.models.item_model import FoundItemDB
    pending_items = db.query(FoundItemDB).filter(
        FoundItemDB.status == "pending"
    ).offset(skip).limit(limit).all()
    
    return {
        "status": "success",
        "items": [
            {
                "id": item.id,
                "description": item.description,
                "location": item.location,
                "date_found": item.date_found.isoformat() if item.date_found else None,
                "image_url": item.image_url,
                "status": item.status,
                "created_at": item.created_at.isoformat() if item.created_at else None
            }
            for item in pending_items
        ]
    }


@router.post("/items/{item_id}/approve")
def approve_item(
    item_id: int,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db)
):
    """
    Approve a found item
    
    Path Parameters:
        item_id: ID of item to approve
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        Success message
        
    Raises:
        HTTPException: If item not found, token invalid, or user not admin
    """
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing"
        )
    
    # Extract and verify token
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user and verify admin
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user or db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Get item
    from app.models.item_model import FoundItemDB
    db_item = db.query(FoundItemDB).filter(FoundItemDB.id == item_id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Update item status
    db_item.status = "approved"
    db.commit()
    db.refresh(db_item)
    
    return {
        "status": "success",
        "message": "Item approved successfully"
    }


@router.get("/items/approved")
def get_approved_items(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get all approved items
    
    Headers:
        authorization: "Bearer <token>"
    
    Query Parameters:
        skip: Number of items to skip (pagination)
        limit: Number of items to return
    
    Returns:
        List of approved items
        
    Raises:
        HTTPException: If token invalid or user not admin
    """
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing"
        )
    
    # Extract and verify token
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user and verify admin
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user or db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Get approved items
    from app.models.item_model import FoundItemDB
    approved_items = db.query(FoundItemDB).filter(
        FoundItemDB.status == "approved"
    ).offset(skip).limit(limit).all()
    
    return {
        "status": "success",
        "items": [
            {
                "id": item.id,
                "description": item.description,
                "location": item.location,
                "date_found": item.date_found.isoformat() if item.date_found else None,
                "image_url": item.image_url,
                "status": item.status,
                "created_at": item.created_at.isoformat() if item.created_at else None
            }
            for item in approved_items
        ]
    }


@router.get("/items/all")
def get_all_items(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100)
):
    """
    Get all items (pending, approved, rejected)
    
    Headers:
        authorization: "Bearer <token>"
    
    Query Parameters:
        skip: Number of items to skip (pagination)
        limit: Number of items to return
    
    Returns:
        List of all items
        
    Raises:
        HTTPException: If token invalid or user not admin
    """
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing"
        )
    
    # Extract and verify token
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user and verify admin
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user or db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Get all items
    from app.models.item_model import FoundItemDB
    all_items = db.query(FoundItemDB).offset(skip).limit(limit).all()
    
    return {
        "status": "success",
        "items": [
            {
                "id": item.id,
                "description": item.description,
                "location": item.location,
                "date_found": item.date_found.isoformat() if item.date_found else None,
                "image_url": item.image_url,
                "status": item.status,
                "created_at": item.created_at.isoformat() if item.created_at else None
            }
            for item in all_items
        ]
    }


@router.post("/items/{item_id}/reject")
def reject_item(
    item_id: int,
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db)
):
    """
    Reject a found item
    
    Path Parameters:
        item_id: ID of item to reject
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        Success message
        
    Raises:
        HTTPException: If item not found, token invalid, or user not admin
    """
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing"
        )
    
    # Extract and verify token
    token = extract_token_from_header(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_data = get_user_from_token(token)
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Get user and verify admin
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user or db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    
    # Get item
    from app.models.item_model import FoundItemDB
    db_item = db.query(FoundItemDB).filter(FoundItemDB.id == item_id).first()
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Update status to rejected (or delete if you prefer)
    db_item.status = "rejected"
    db.commit()
    
    return {
        "status": "success",
        "message": "Item rejected successfully"
    }