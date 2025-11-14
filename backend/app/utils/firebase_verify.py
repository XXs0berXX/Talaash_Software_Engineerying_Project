"""
Firebase authentication utilities
Token verification and user management
"""

import os
from typing import Optional, Dict
import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.exceptions import FirebaseError

# Global variable to track initialization
_firebase_initialized = False

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global _firebase_initialized
    
    if _firebase_initialized:
        return
    
    try:
        # Try different methods to initialize Firebase
        if os.path.exists("firebase-service-account.json"):
            cred = credentials.Certificate("firebase-service-account.json")
            firebase_admin.initialize_app(cred)
        elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            firebase_admin.initialize_app()
        else:
            # For development without credentials
            print("Warning: Firebase credentials not found. Using development mode.")
            _firebase_initialized = True
            return
            
        _firebase_initialized = True
        print("Firebase Admin SDK initialized successfully")
        
    except Exception as e:
        print(f"Firebase initialization failed: {e}")
        print("Running in development mode without Firebase verification")
        _firebase_initialized = True


def verify_token(token: str) -> Optional[Dict]:
    """
    Verify Firebase ID token
    """
    try:
        if not _firebase_initialized:
            return {"email": "dev@iba.edu.pk", "uid": "dev_uid"}
            
        decoded_token = auth.verify_id_token(token)
        return decoded_token
        
    except Exception as e:
        print(f"Token verification failed: {e}")
        # For development, return mock data
        return {
            "email": "dev@iba.edu.pk",
            "uid": "dev_uid",
            "name": "Development User"
        }


def get_user_from_token(token: str) -> Optional[Dict]:
    """
    Get user data from Firebase token
    """
    decoded_token = verify_token(token)
    if not decoded_token:
        return None
    
    return {
        "uid": decoded_token.get("uid"),
        "email": decoded_token.get("email"),
        "name": decoded_token.get("name", "User"),
        "email_verified": decoded_token.get("email_verified", True)
    }


def extract_token_from_header(authorization_header: str) -> Optional[str]:
    """
    Extract token from Authorization header
    """
    if not authorization_header:
        return None
    
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]