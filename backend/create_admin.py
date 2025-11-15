"""
Script to create admin users in the database
Run this script to create admin accounts for Lost & Found staff

Usage:
    python create_admin.py
"""
import sys
import os
import sqlite3
from datetime import datetime

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def create_admin_user_sqlite(name: str, email: str):
    """
    Create an admin user directly in SQLite database
    
    Args:
        name: Admin's full name
        email: Admin's email address
    """
    db_path = "database/talash.db"
    
    # Ensure database directory exists
    os.makedirs("database", exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id, role FROM users WHERE email = ?", (email,))
    existing = cursor.fetchone()
    
    if existing:
        user_id, role = existing
        if role == "admin":
            print(f"✅ Admin user already exists: {email}")
        else:
            # Update to admin
            cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email,))
            conn.commit()
            print(f"✅ Updated user to admin: {email}")
    else:
        # Create new admin
        cursor.execute(
            "INSERT INTO users (name, email, role, created_at) VALUES (?, ?, 'admin', ?)",
            (name, email, datetime.now())
        )
        conn.commit()
        print(f"✅ Created new admin user: {email}")
    
    conn.close()


def main():
    """
    Main function to create admin users
    """
    print("=" * 50)
    print("Talash - Admin User Creation Script")
    print("=" * 50)
    print()
    
    # Ensure database exists
    db_path = "database/talash.db"
    if not os.path.exists(db_path):
        print("Creating database...")
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
        
        conn.commit()
        conn.close()
        print("✅ Database created")
    
    print()
    
    try:
        # List of admin users to create
        admin_users = [
            {
                "name": "Maryam Sultan",
                "email": "m.sultan.29186@khi.iba.edu.pk"
            },
            # Add more admins here if needed in the future
            # {
            #     "name": "Another Admin",
            #     "email": "admin@khi.iba.edu.pk"
            # },
        ]
        
        print("Creating admin users...")
        print()
        
        for admin_data in admin_users:
            create_admin_user_sqlite(
                name=admin_data["name"],
                email=admin_data["email"]
            )
        
        print()
        print("=" * 50)
        print("✅ Admin user creation completed!")
        print("=" * 50)
        print()
        print("IMPORTANT: You must create a Firebase account for this user:")
        print()
        print("1. Go to Firebase Console > Authentication")
        print("2. Add user with their email and a secure password")
        print("3. Keep the password secure")
        print()
        print("Admin user created:")
        for admin_data in admin_users:
            print(f"  • {admin_data['name']} ({admin_data['email']})")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()