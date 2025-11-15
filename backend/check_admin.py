"""
Script to check which database your app is using
"""
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./talaash.db")

print("=" * 80)
print("DATABASE CONFIGURATION CHECK")
print("=" * 80)
print(f"\nDatabase URL from .env: {DATABASE_URL}")

# Extract database file path for SQLite
if "sqlite:///" in DATABASE_URL:
    db_file = DATABASE_URL.replace("sqlite:///", "")
    if db_file.startswith("./"):
        db_file = db_file[2:]
    
    print(f"Database file: {db_file}")
    print(f"Absolute path: {os.path.abspath(db_file)}")
    
    if os.path.exists(db_file):
        print(f"✅ Database file EXISTS")
        size = os.path.getsize(db_file)
        print(f"File size: {size:,} bytes")
    else:
        print(f"❌ Database file DOES NOT EXIST")
else:
    print("Using PostgreSQL or other database (not SQLite)")

print("\n" + "=" * 80)

# Check if database/talash.db exists (from create_admin.py)
admin_db_path = "database/talash.db"
print(f"\nAdmin script database: {admin_db_path}")
print(f"Absolute path: {os.path.abspath(admin_db_path)}")

if os.path.exists(admin_db_path):
    print(f"✅ Admin database file EXISTS")
    size = os.path.getsize(admin_db_path)
    print(f"File size: {size:,} bytes")
else:
    print(f"❌ Admin database file DOES NOT EXIST")

print("\n" + "=" * 80)
print("\n⚠️  WARNING: If the paths are different, your admin user might be in a")
print("different database than your app is using!")
print("=" * 80 + "\n")