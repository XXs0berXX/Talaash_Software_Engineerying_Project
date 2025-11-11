"""
User data model for Talash
Handles user information storage and retrieval
"""

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import Session
from app.db import Base
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserDB(Base):
    """SQLAlchemy User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="user", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class UserSignupRequest(BaseModel):
    """Pydantic model for user signup"""
    name: str
    email: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@iba.edu.pk"
            }
        }


class UserResponse(BaseModel):
    """Pydantic model for user response"""
    id: int
    name: str
    email: str
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AdminSignupRequest(BaseModel):
    """Pydantic model for admin signup"""
    name: str
    email: str
    admin_key: str  # Simple validation key for admin registration
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Admin User",
                "email": "admin@iba.edu.pk",
                "admin_key": "secret_admin_key"
            }
        }


def create_user(db: Session, name: str, email: str, role: str = "user") -> UserDB:
    """
    Create a new user in database
    
    Args:
        db: Database session
        name: User's name
        email: User's email
        role: User's role (default: "user")
        
    Returns:
        Created user object
    """
    db_user = UserDB(name=name, email=email, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str) -> Optional[UserDB]:
    """
    Get user by email
    
    Args:
        db: Database session
        email: User's email
        
    Returns:
        User object or None if not found
    """
    return db.query(UserDB).filter(UserDB.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[UserDB]:
    """
    Get user by ID
    
    Args:
        db: Database session
        user_id: User's ID
        
    Returns:
        User object or None if not found
    """
    return db.query(UserDB).filter(UserDB.id == user_id).first()


def user_exists(db: Session, email: str) -> bool:
    """
    Check if user exists by email
    
    Args:
        db: Database session
        email: User's email
        
    Returns:
        True if user exists, False otherwise
    """
    return db.query(UserDB).filter(UserDB.email == email).first() is not None
