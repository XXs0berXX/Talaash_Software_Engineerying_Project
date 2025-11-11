"""
Firebase token verification utilities
Handles JWT token validation and user authentication
"""

import os
from typing import Optional, Dict
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, status


def initialize_firebase():
    """
    Initialize Firebase Admin SDK
    Ensure FIREBASE_CONFIG_PATH environment variable points to credentials JSON
    """
    try:
        if not firebase_admin._apps:
            # Try to load from environment variable first
            config_path = os.getenv("FIREBASE_CONFIG_PATH")
            if config_path and os.path.exists(config_path):
                cred = credentials.Certificate(config_path)
                firebase_admin.initialize_app(cred)
            else:
                # For development, use default credentials
                firebase_admin.initialize_app()
    except Exception as e:
        print(f"Firebase initialization error: {e}")
        print("Note: Firebase is optional for development. Set FIREBASE_CONFIG_PATH for production.")


def verify_token(token: str) -> Optional[Dict]:
    """
    Verify Firebase JWT token and extract user claims
    
    Args:
        token: Firebase ID token
        
    Returns:
        Dict with user claims if valid, None otherwise
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        initialize_firebase()
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )


def get_user_from_token(token: str) -> Optional[Dict]:
    """
    Extract user information from verified token
    
    Args:
        token: Firebase ID token
        
    Returns:
        Dict containing user email, uid, and other claims
    """
    try:
        decoded_token = verify_token(token)
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name"),
            "email_verified": decoded_token.get("email_verified", False)
        }
    except HTTPException:
        return None


def extract_token_from_header(authorization_header: Optional[str]) -> Optional[str]:
    """
    Extract token from Authorization header
    Expected format: "Bearer <token>"
    
    Args:
        authorization_header: Authorization header value
        
    Returns:
        Token string if valid format, None otherwise
    """
    if not authorization_header:
        return None
    
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]
