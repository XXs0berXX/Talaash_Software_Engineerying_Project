"""
File upload utility for handling image uploads
Save this as: backend/app/utils/file_upload.py
"""

import os
import uuid
from fastapi import UploadFile
from pathlib import Path


async def upload_image(file: UploadFile) -> str:
    """
    Upload image file and return the URL/path
    
    Args:
        file: The uploaded file from FastAPI
        
    Returns:
        str: URL or path to the uploaded file
        
    Raises:
        Exception: If file upload fails
    """
    try:
        # Generate unique filename
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        # Define upload directory
        # This creates uploads/found_items directory
        upload_dir = Path("uploads/found_items")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Full file path
        file_path = upload_dir / unique_filename
        
        # Write file to disk
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Return URL path (adjust based on how you serve static files)
        return f"/uploads/found_items/{unique_filename}"
        
    except Exception as e:
        raise Exception(f"Failed to upload image: {str(e)}")


def delete_image(image_url: str) -> bool:
    """
    Delete an image file from the server
    
    Args:
        image_url: URL or path of the image to delete
        
    Returns:
        bool: True if deleted successfully, False otherwise
    """
    try:
        # Extract filename from URL
        if image_url.startswith('/uploads/'):
            file_path = Path(image_url.lstrip('/'))
            if file_path.exists():
                file_path.unlink()
                return True
        return False
    except Exception:
        return False