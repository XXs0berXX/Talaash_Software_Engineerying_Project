"""
Item routes for managing found and lost items
Handles upload, retrieval, and search functionality
"""

import os
import uuid
from datetime import datetime
# 💥 FIX 1: Import necessary dependencies for Form data and Security
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile, Query, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials # <-- ADD THIS IMPORT
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
    # 💥 FIX 2: extract_token_from_header is no longer needed in the handler function
    get_user_from_token,
    initialize_firebase
)

router = APIRouter()
# 💥 FIX 3: Initialize the security scheme
security = HTTPBearer()

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
    # 💥 CRITICAL FIX: Use Form() for non-file fields and Depends(security) for the token
    description: str = Form(...),
    location: str = Form(...),
    date_found: str = Form(...),
    file: UploadFile = File(...),
    token: HTTPAuthorizationCredentials = Depends(security), # <-- Inject token here
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
    
    # 💥 FIX 4: Use the injected token dependency to extract the string
    token_str = token.credentials
    if not token_str:
        # This check is mostly redundant due to Depends(security) but kept for clarity
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization token provided."
        )
    
    # Extract and verify token
    user_data = get_user_from_token(token_str)
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
    # file.filename is now available directly from the UploadFile object
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
    
    # Check file size (Read content *before* proceeding)
    file_content = await file.read()
    # Reset file pointer to the beginning for safety if needed later (though not strictly necessary here)
    await file.seek(0) 
    
    if not validate_file_size(len(file_content), MAX_FILE_SIZE_MB):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
        )
    
    # Validate required fields (This can be simplified now that FastAPI handles required fields via Form(...))
    # Keep validation for complex logic like date format
    
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
        # Write file content that was previously read
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


# --- Endpoints below this line remain the same, but the /lost endpoint needs the same fix ---

@router.get("/found", response_model=FoundItemListResponse)
def get_found_items_list(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    status_filter: str = Query("approved", regex="^(pending|approved|claimed|all)$")
):
    """
    Get list of found items
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
    # 💥 FIX 5: Use Depends(security) for authentication here too
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get all found items reported by a specific user
    Requires authentication
    """
    
    # Extract and verify token
    token_str = token.credentials
    user_data = get_user_from_token(token_str)
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
    # 💥 CRITICAL FIX: Apply Form() and Depends(security) to the /lost route as well
    description: str = Form(...),
    location: str = Form(...),
    date_lost: str = Form(...),
    file: UploadFile = File(...),
    token: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Upload a lost item with image
    """
    
    # Extract and verify token
    token_str = token.credentials
    user_data = get_user_from_token(token_str)
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
    await file.seek(0)
    if not validate_file_size(len(file_content), MAX_FILE_SIZE_MB):
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds {MAX_FILE_SIZE_MB}MB limit"
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