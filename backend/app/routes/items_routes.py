"""
Item routes for managing found and lost items
Handles upload, retrieval, and search functionality
"""

import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app.models.item_model import (
    FoundItemRequest,
    FoundItemResponse,
    FoundItemListResponse,
    LostItemRequest,
    LostItemResponse,
    create_found_item,
    get_found_items,
    get_found_item_by_id,
    get_found_items_by_user,
    create_lost_item,
    get_lost_items,
    FoundItemDB,
    LostItemDB
)
from app.models.user_model import get_user_by_email, get_user_by_id
from app.utils.validators import (
    validate_file_size,
    sanitize_filename,
    validate_required_fields
)
from app.utils.firebase_verify import (
    extract_token_from_header,
    get_user_from_token,
    initialize_firebase
)

router = APIRouter()

# Configuration
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE_MB = 5
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}

initialize_firebase()


def validate_image_file(filename: str) -> bool:
    """Validate image file extension"""
    _, ext = os.path.splitext(filename)
    return ext.lower() in ALLOWED_EXTENSIONS


@router.post("/found", response_model=FoundItemResponse, status_code=status.HTTP_201_CREATED)
async def upload_found_item(
    authorization: str,
    description: str,
    location: str,
    date_found: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a found item with image
    
    Requires Firebase authentication token in Authorization header
    
    Form Data:
        description: Description of the found item
        location: Location where item was found
        date_found: Date and time found (ISO format: "2024-01-15T14:30:00")
        file: Image file (max 5MB, jpg/png/gif/webp)
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        Created found item object with image URL
        
    Raises:
        HTTPException: If authentication fails, validation fails, or upload fails
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
    
    # Get user from database
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in database"
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    if not validate_image_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file_content = await file.read()
    if not validate_file_size(len(file_content), MAX_FILE_SIZE_MB):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
        )
    
    # Validate required fields
    is_valid, error_msg = validate_required_fields(
        {
            "description": description,
            "location": location,
            "date_found": date_found
        },
        ["description", "location", "date_found"]
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Parse date
    try:
        date_found_obj = datetime.fromisoformat(date_found)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format: 2024-01-15T14:30:00"
        )
    
    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )
    
    # Create image URL
    image_url = f"/uploads/{unique_filename}"
    
    # Create database record
    db_item = create_found_item(
        db=db,
        user_id=db_user.id,
        description=description,
        location=location,
        date_found=date_found_obj,
        image_url=image_url
    )
    
    return db_item


@router.get("/found", response_model=FoundItemListResponse)
def get_found_items_list(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    status_filter: str = Query("approved", regex="^(pending|approved|claimed|all)$")
):
    """
    Get list of found items
    
    Query Parameters:
        skip: Number of items to skip (pagination)
        limit: Number of items to return
        status_filter: Filter by status (pending, approved, claimed, or all)
    
    Returns:
        List of found items with total count
    """
    
    query = db.query(FoundItemDB)
    
    if status_filter != "all":
        query = query.filter(FoundItemDB.status == status_filter)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    return FoundItemListResponse(
        items=items,
        total=total
    )


@router.get("/found/{item_id}", response_model=FoundItemResponse)
def get_found_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    """
    Get details of a specific found item
    
    Path Parameters:
        item_id: ID of the found item
    
    Returns:
        Found item details
        
    Raises:
        HTTPException: If item not found
    """
    
    db_item = get_found_item_by_id(db, item_id)
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Found item not found"
        )
    
    return db_item


@router.get("/found/user/{user_id}")
def get_user_found_items(
    user_id: int,
    authorization: str,
    db: Session = Depends(get_db)
):
    """
    Get all found items reported by a specific user
    Requires authentication
    
    Path Parameters:
        user_id: ID of the user
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        List of user's found items
        
    Raises:
        HTTPException: If authentication fails
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
    
    # Get items
    items = get_found_items_by_user(db, user_id)
    
    return {
        "status": "success",
        "items": items,
        "total": len(items)
    }


@router.post("/lost", response_model=LostItemResponse, status_code=status.HTTP_201_CREATED)
async def upload_lost_item(
    authorization: str,
    description: str,
    location: str,
    date_lost: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a lost item with image
    
    Requires Firebase authentication token
    
    Form Data:
        description: Description of the lost item
        location: Location where item was lost
        date_lost: Date and time lost (ISO format: "2024-01-15T14:30:00")
        file: Image file (max 5MB, jpg/png/gif/webp)
    
    Headers:
        authorization: "Bearer <token>"
    
    Returns:
        Created lost item object with image URL
        
    Raises:
        HTTPException: If authentication fails, validation fails, or upload fails
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
    
    # Get user from database
    db_user = get_user_by_email(db, user_data.get("email"))
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in database"
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    if not validate_image_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check file size
    file_content = await file.read()
    if not validate_file_size(len(file_content), MAX_FILE_SIZE_MB):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
        )
    
    # Validate required fields
    is_valid, error_msg = validate_required_fields(
        {
            "description": description,
            "location": location,
            "date_lost": date_lost
        },
        ["description", "location", "date_lost"]
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Parse date
    try:
        date_lost_obj = datetime.fromisoformat(date_lost)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format: 2024-01-15T14:30:00"
        )
    
    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        with open(file_path, "wb") as f:
            f.write(file_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )
    
    # Create image URL
    image_url = f"/uploads/{unique_filename}"
    
    # Create database record
    db_item = create_lost_item(
        db=db,
        user_id=db_user.id,
        description=description,
        location=location,
        date_lost=date_lost_obj,
        image_url=image_url
    )
    
    return db_item


@router.get("/lost")
def get_lost_items_list(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    status_filter: str = Query("approved", regex="^(pending|approved|found|all)$")
):
    """
    Get list of lost items
    
    Query Parameters:
        skip: Number of items to skip (pagination)
        limit: Number of items to return
        status_filter: Filter by status (pending, approved, found, or all)
    
    Returns:
        List of lost items with total count
    """
    
    query = db.query(LostItemDB)
    
    if status_filter != "all":
        query = query.filter(LostItemDB.status == status_filter)
    
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    return {
        "items": items,
        "total": total
    }
