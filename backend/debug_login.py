#!/usr/bin/env python3
"""
Debug script to identify login issues
"""
import os
import sys
from dotenv import load_dotenv
import bcrypt

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def debug_database_connection():
    """Debug database connection"""
    try:
        print("🔍 Debugging database connection...")
        
        from config.database_simple import DatabaseConfig
        from mongo import MongoDB
        
        # Test database connection
        db = DatabaseConfig.get_database()
        db_name = DatabaseConfig.get_database_name()
        print(f"✅ Connected to database: {db_name}")
        
        # Test MongoDB class
        mongo = MongoDB()
        print("✅ MongoDB class initialized successfully")
        
        return True, mongo
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False, None

def debug_user_lookup(mongo, username):
    """Debug user lookup"""
    try:
        print(f"🔍 Looking up user: {username}")
        
        # Find user by username
        user = mongo.find_user_by_username(username)
        
        if user:
            print("✅ User found!")
            print(f"   User ID: {user.get('_id')}")
            print(f"   Username: {user.get('username')}")
            print(f"   Email: {user.get('email')}")
            print(f"   Role: {user.get('role')}")
            print(f"   Is Active: {user.get('is_active', True)}")
            print(f"   Has password_hash: {'password_hash' in user}")
            
            if 'password_hash' in user:
                print(f"   Password hash length: {len(user['password_hash'])}")
            else:
                print("   ⚠️ No password_hash found!")
            
            return True, user
        else:
            print("❌ User not found!")
            return False, None
            
    except Exception as e:
        print(f"❌ User lookup error: {e}")
        return False, None

def debug_password_verification(user, password):
    """Debug password verification"""
    try:
        print(f"🔍 Verifying password for user: {user.get('username')}")
        
        if 'password_hash' not in user:
            print("❌ No password_hash in user document")
            return False
        
        # Test password verification
        is_valid = bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8'))
        
        if is_valid:
            print("✅ Password verification successful!")
        else:
            print("❌ Password verification failed!")
        
        return is_valid
        
    except Exception as e:
        print(f"❌ Password verification error: {e}")
        return False

def debug_user_collection(mongo):
    """Debug users collection"""
    try:
        print("🔍 Debugging users collection...")
        
        # Get all users
        users = list(mongo.users.find())
        print(f"📊 Total users in collection: {len(users)}")
        
        for i, user in enumerate(users):
            print(f"   User {i+1}:")
            print(f"     ID: {user.get('_id')}")
            print(f"     Username: {user.get('username')}")
            print(f"     Email: {user.get('email')}")
            print(f"     Role: {user.get('role')}")
            print(f"     Has password_hash: {'password_hash' in user}")
            print(f"     Is Active: {user.get('is_active', True)}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Users collection debug error: {e}")
        return False

def test_login_flow(username, password):
    """Test the complete login flow"""
    print("🧪 Testing complete login flow...")
    print("=" * 60)
    
    # Step 1: Database connection
    db_success, mongo = debug_database_connection()
    if not db_success:
        return False
    
    print()
    
    # Step 2: User collection debug
    collection_success = debug_user_collection(mongo)
    if not collection_success:
        return False
    
    print()
    
    # Step 3: User lookup
    user_success, user = debug_user_lookup(mongo, username)
    if not user_success:
        return False
    
    print()
    
    # Step 4: Password verification
    password_success = debug_password_verification(user, password)
    if not password_success:
        return False
    
    print()
    print("🎉 All login flow tests passed!")
    return True

def main():
    """Main debug function"""
    print("🐛 Login Debug Tool")
    print("=" * 60)
    
    # Test credentials
    username = "superadmin"
    password = "superadmin123"
    
    print(f"Testing login for: {username}")
    print(f"Password: {password}")
    print()
    
    # Run the complete test
    success = test_login_flow(username, password)
    
    print("=" * 60)
    if success:
        print("✅ Login flow is working correctly!")
        print("The issue might be in the Flask route or server configuration.")
    else:
        print("❌ Login flow has issues that need to be fixed.")
    
    return success

if __name__ == "__main__":
    main() 