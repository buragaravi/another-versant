#!/usr/bin/env python3
"""
Script to create the initial super admin user for VERSANT system
"""

import os
import sys
from dotenv import load_dotenv
from datetime import datetime
import bcrypt

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.database_simple import DatabaseConfig
from mongo import MongoDB

load_dotenv()

def create_superadmin():
    """Create a superadmin user"""
    try:
        # Initialize MongoDB
        mongo = MongoDB()
        
        # Superadmin credentials
        superadmin_data = {
            "username": "superadmin",
            "email": "superadmin@versant.com",
            "password_hash": bcrypt.hashpw("superadmin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "role": "superadmin",
            "first_name": "Super",
            "last_name": "Admin",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "last_login": None
        }
        
        # Check if superadmin already exists
        existing_user = mongo.find_user_by_username("superadmin")
        if existing_user:
            print("⚠️ Superadmin user already exists!")
            return False
        
        # Insert superadmin user
        user_id = mongo.insert_user(superadmin_data)
        print(f"✅ Superadmin user created successfully with ID: {user_id}")
        print("📋 Superadmin credentials:")
        print("   Username: superadmin")
        print("   Password: superadmin123")
        print("   Email: superadmin@versant.com")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating superadmin: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Creating superadmin user...")
    success = create_superadmin()
    
    if success:
        print("🎉 Superadmin setup completed successfully!")
    else:
        print("💥 Superadmin setup failed!")
        sys.exit(1) 