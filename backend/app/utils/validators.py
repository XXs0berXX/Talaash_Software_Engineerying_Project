"""
Input validation utilities for Talash API
Validates email domains, file sizes, and required fields
"""

import re
from typing import Optional


def validate_iba_email(email: str) -> bool:
    """
    Validate that email is from IBA Karachi domain (@khi.iba.edu.pk ONLY)
    
    Args:
        email: Email address to validate
        
    Returns:
        bool: True if valid IBA Karachi email, False otherwise
    """
    if not email:
        return False
    
    # ONLY accept @khi.iba.edu.pk
    email_pattern = r'^[a-zA-Z0-9._%+-]+@khi\.iba\.edu\.pk$'
    
    return re.match(email_pattern, email) is not None


def validate_email_format(email: str) -> bool:
    """
    Validate general email format
    
    Args:
        email: Email address to validate
        
    Returns:
        bool: True if valid email format, False otherwise
    """
    if not email:
        return False
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(email_pattern, email) is not None


def validate_file_size(file_size: int, max_size_mb: int = 5) -> bool:
    """
    Validate file size doesn't exceed maximum
    
    Args:
        file_size: File size in bytes
        max_size_mb: Maximum allowed size in MB
        
    Returns:
        bool: True if file size is within limit, False otherwise
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes


def validate_required_fields(data: dict, required_fields: list) -> tuple[bool, Optional[str]]:
    """
    Validate that all required fields are present and non-empty
    
    Args:
        data: Dictionary containing the data
        required_fields: List of field names that are required
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    for field in required_fields:
        if field not in data or not data[field]:
            return False, f"Field '{field}' is required"
    
    return True, None


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal attacks
    
    Args:
        filename: Original filename
        
    Returns:
        str: Sanitized filename
    """
    # Remove any path separators
    filename = filename.replace("../", "").replace("..\\", "")
    filename = filename.replace("/", "_").replace("\\", "_")
    
    # Keep only safe characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    
    return filename