"""
Firebase token verification utilities
Handles JWT token validation and user authentication
"""

import os
from typing import Optional, Dict
import firebase_admin
from firebase_admin import credentials, auth
from firebase_admin import exceptions # Import the exceptions module
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
                # 💡 Ensure this path is an absolute path or relative to where main.py is run
                cred = credentials.Certificate(config_path)
                firebase_admin.initialize_app(cred)
            else:
                # For development, use default credentials (NOTE: This is what caused the DefaultCredentialsError)
                print("WARNING: FIREBASE_CONFIG_PATH not set or file not found. Attempting default initialization.")
                firebase_admin.initialize_app()
    except Exception as e:
        print(f"Firebase initialization error: {e}")
        print("Note: Firebase must be configured correctly for login to work.")


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
        # initialize_firebase() is called here, which is fine, but it's often called once on app startup (in auth_routes.py)
        # We'll leave it here as it was in the original code, but keep the initial call in auth_routes.py as well.
        initialize_firebase() 
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    # 💡 FIX: Catch the generic FirebaseError which covers ExpiredSignatureError and InvalidIdTokenError
    except exceptions.FirebaseError as e: 
        # Check for specific error types if needed for distinct messages
        if 'expired' in str(e).lower():
             detail_message = "Token has expired"
        elif 'invalid' in str(e).lower():
             detail_message = "Invalid token"
        else:
             detail_message = f"Token verification failed: {str(e)}"
             
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail_message
        )
    except Exception as e:
        # Catch all other unexpected errors (e.g., initial configuration issues)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, # Changed to 500 since this is likely a server/config error
            detail=f"Server configuration error during token verification: {str(e)}"
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
        if not decoded_token: # Should not happen if verify_token raises HTTPException, but good for safety
             return None
             
        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name"),
            "email_verified": decoded_token.get("email_verified", False)
        }
    except HTTPException:
        # If verify_token raises an HTTPException (401), we catch it here and return None for the router logic
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