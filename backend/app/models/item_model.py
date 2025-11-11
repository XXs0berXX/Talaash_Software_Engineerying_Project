"""
Item data model for Talash
Handles found and lost item storage and retrieval
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Session, relationship
from app.db import Base
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List


class FoundItemDB(Base):
    """SQLAlchemy Found Item model"""
    __tablename__ = "found_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    date_found = Column(DateTime, nullable=False)
    image_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, approved, claimed
    created_at = Column(DateTime, default=datetime.utcnow)


class LostItemDB(Base):
    """SQLAlchemy Lost Item model"""
    __tablename__ = "lost_items"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=False)
    date_lost = Column(DateTime, nullable=False)
    image_url = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, approved, found
    created_at = Column(DateTime, default=datetime.utcnow)


class FoundItemRequest(BaseModel):
    """Pydantic model for found item creation"""
    description: str
    location: str
    date_found: str  # ISO format: "2024-01-15T14:30:00"
    
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Blue backpack with laptop",
                "location": "Main Library",
                "date_found": "2024-01-15T14:30:00"
            }
        }


class FoundItemResponse(BaseModel):
    """Pydantic model for found item response"""
    id: int
    user_id: int
    description: str
    location: str
    date_found: datetime
    image_url: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FoundItemListResponse(BaseModel):
    """Pydantic model for found items list"""
    items: List[FoundItemResponse]
    total: int
    
    class Config:
        from_attributes = True


class LostItemRequest(BaseModel):
    """Pydantic model for lost item creation"""
    description: str
    location: str
    date_lost: str  # ISO format: "2024-01-15T14:30:00"
    
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Red wallet with student ID",
                "location": "Cafeteria",
                "date_lost": "2024-01-14T12:00:00"
            }
        }


class LostItemResponse(BaseModel):
    """Pydantic model for lost item response"""
    id: int
    user_id: int
    description: str
    location: str
    date_lost: datetime
    image_url: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


def create_found_item(
    db: Session,
    user_id: int,
    description: str,
    location: str,
    date_found: datetime,
    image_url: Optional[str] = None
) -> FoundItemDB:
    """
    Create a new found item record
    
    Args:
        db: Database session
        user_id: ID of user reporting item
        description: Item description
        location: Location where item was found
        date_found: Date and time item was found
        image_url: Optional image URL
        
    Returns:
        Created found item object
    """
    db_item = FoundItemDB(
        user_id=user_id,
        description=description,
        location=location,
        date_found=date_found,
        image_url=image_url
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_found_items(db: Session, skip: int = 0, limit: int = 10) -> List[FoundItemDB]:
    """
    Get paginated list of found items
    
    Args:
        db: Database session
        skip: Number of items to skip
        limit: Number of items to return
        
    Returns:
        List of found items
    """
    return db.query(FoundItemDB).offset(skip).limit(limit).all()


def get_found_item_by_id(db: Session, item_id: int) -> Optional[FoundItemDB]:
    """
    Get found item by ID
    
    Args:
        db: Database session
        item_id: Item ID
        
    Returns:
        Found item object or None if not found
    """
    return db.query(FoundItemDB).filter(FoundItemDB.id == item_id).first()


def get_found_items_by_user(db: Session, user_id: int) -> List[FoundItemDB]:
    """
    Get all found items reported by a user
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        List of user's found items
    """
    return db.query(FoundItemDB).filter(FoundItemDB.user_id == user_id).all()


def create_lost_item(
    db: Session,
    user_id: int,
    description: str,
    location: str,
    date_lost: datetime,
    image_url: Optional[str] = None
) -> LostItemDB:
    """
    Create a new lost item record
    
    Args:
        db: Database session
        user_id: ID of user reporting item
        description: Item description
        location: Location where item was lost
        date_lost: Date and time item was lost
        image_url: Optional image URL
        
    Returns:
        Created lost item object
    """
    db_item = LostItemDB(
        user_id=user_id,
        description=description,
        location=location,
        date_lost=date_lost,
        image_url=image_url
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


def get_lost_items(db: Session, skip: int = 0, limit: int = 10) -> List[LostItemDB]:
    """
    Get paginated list of lost items
    
    Args:
        db: Database session
        skip: Number of items to skip
        limit: Number of items to return
        
    Returns:
        List of lost items
    """
    return db.query(LostItemDB).offset(skip).limit(limit).all()
