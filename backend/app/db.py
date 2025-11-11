"""
Database configuration and initialization
SQLite for development, can be switched to PostgreSQL
"""

import os
import sqlite3
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database/talash.db")

# Ensure database directory exists
os.makedirs("database", exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize SQLite with schema if using SQLite
    if "sqlite" in DATABASE_URL:
        init_sqlite_schema()


def init_sqlite_schema():
    """Initialize SQLite database schema"""
    db_path = "database/talash.db"
    os.makedirs("database", exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Create found_items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS found_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        date_found TIMESTAMP NOT NULL,
        image_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    
    # Create lost_items table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS lost_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        date_lost TIMESTAMP NOT NULL,
        image_url TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
    """)
    
    conn.commit()
    conn.close()
