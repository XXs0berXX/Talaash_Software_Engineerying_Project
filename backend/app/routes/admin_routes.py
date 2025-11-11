"""
Admin routes for administrative operations
Handles admin signup, login, and item moderation
"""

import os
from fastapi import APIRouter, HTTPException, status, Depends, Query
from sqlalchemy.orm import Session
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
from app.models.item_model import (
    get_found_items,
    get_found_item_by_id,
    FoundItemResponse
)
from sqlalchemy.orm import Session

router = APIRouter()

# Simple admin key for registration (should be environment variable in production)
ADMIN_KEY = os.getenv("ADMIN_KEY", "admin_secret_2024")

initialize_firebase()


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_signup(
    request: AdminSignupRequest,
    db: Session = Depends(get_db)
):
    """
    Admin signup endpoint
    
    - Validates admin key
    - Validates @iba.edu.pk email domain
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
            detail="Only @iba.edu.pk email addresses are allowed"
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
    email: str,
    token: str,
    db: Session = Depends(get_db)
):
    """
    Admin login endpoint
    
    - Validates Firebase token
    - Verifies user is admin
    - Returns admin dashboard redirect
    
    Args:
        email: Admin's email
        token: Firebase ID token from frontend
        db: Database session
        
    Returns:
        Admin information and authentication status
        
    Raises:
        HTTPException: If token invalid, user not found, or not admin
    """
    
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
            detail="Admin user not found"
        )
    
    # Verify user is admin
    if db_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not an admin"
        )
    
    return {
        "status": "success",
        "admin": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email,
            "role": db_user.role
        },
        "redirect": "/admin/dashboard",
        "token": token
    }


@router.get("/dashboard")
def admin_dashboard(
    authorization: str,
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
            detail="User is not an admin"
        )
    
    # Get statistics
    pending_items = db.query(get_found_items).filter_by(status="pending").count()
    total_items = db.query(get_found_items).count()
    approved_items = db.query(get_found_items).filter_by(status="approved").count()
    
    return {
        "status": "success",
        "admin": {
            "id": db_user.id,
            "name": db_user.name,
            "email": db_user.email
        },
        "statistics": {
            "pending_items": pending_items,
            "total_items": total_items,
            "approved_items": approved_items
        }
    }


@router.get("/items/pending")
def get_pending_items(
    authorization: str,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50)
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
            detail="User is not an admin"
        )
    
    # Get pending items
    from app.models.item_model import FoundItemDB
    pending_items = db.query(FoundItemDB).filter(
        FoundItemDB.status == "pending"
    ).offset(skip).limit(limit).all()
    
    return {
        "status": "success",
        "items": pending_items
    }


@router.post("/items/{item_id}/approve")
def approve_item(
    item_id: int,
    authorization: str,
    db: Session = Depends(get_db)
):
    """
    Approve a found item
    
    Path Parameters:
        item_id: ID of item to approve
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        Updated item object
        
    Raises:
        HTTPException: If item not found, token invalid, or user not admin
    """
    
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
            detail="User is not an admin"
        )
    
    # Get item
    db_item = get_found_item_by_id(db, item_id)
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
        "message": "Item approved successfully",
        "item": db_item
    }


@router.post("/items/{item_id}/reject")
def reject_item(
    item_id: int,
    authorization: str,
    db: Session = Depends(get_db)
):
    """
    Reject a found item
    
    Path Parameters:
        item_id: ID of item to reject
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        Updated item object
        
    Raises:
        HTTPException: If item not found, token invalid, or user not admin
    """
    
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
            detail="User is not an admin"
        )
    
    # Get item
    db_item = get_found_item_by_id(db, item_id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    # Delete item
    db.delete(db_item)
    db.commit()
    
    return {
        "status": "success",
        "message": "Item rejected and deleted"
    }
