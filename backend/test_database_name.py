#!/usr/bin/env python3
"""
Test script to verify database name extraction from MongoDB URI
"""
import os
import sys
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def test_database_name_extraction():
    """Test database name extraction from MongoDB URI"""
    try:
        print("🔍 Testing database name extraction...")
        
        # Import the database configuration
        from config.database_simple import DatabaseConfig
        
        # Get the database name
        db_name = DatabaseConfig.get_database_name()
        
        print(f"📊 Extracted database name: {db_name}")
        print(f"🔗 MongoDB URI: {DatabaseConfig.MONGODB_URI[:50]}...")
        
        # Test the connection
        print("🔄 Testing database connection...")
        db = DatabaseConfig.get_database()
        
        # Test a simple operation
        collections = db.list_collection_names()
        print(f"✅ Connection successful! Found {len(collections)} collections")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_superadmin_creation():
    """Test superadmin creation in the new database"""
    try:
        print("🔄 Testing superadmin creation...")
        
        from mongo import MongoDB
        
        # Initialize MongoDB
        mongo = MongoDB()
        
        # Check if superadmin exists
        existing_user = mongo.find_user_by_username("superadmin")
        if existing_user:
            print("⚠️ Superadmin user already exists!")
            return True
        else:
            print("ℹ️ No superadmin user found - ready to create")
            return True
        
    except Exception as e:
        print(f"❌ Error testing superadmin: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Testing database name extraction and connection...")
    print("=" * 60)
    
    # Test 1: Database name extraction
    extraction_success = test_database_name_extraction()
    
    # Test 2: Superadmin check
    superadmin_success = test_superadmin_creation()
    
    print("=" * 60)
    print("📊 Test Results:")
    print(f"   Database Name Extraction: {'✅' if extraction_success else '❌'}")
    print(f"   Superadmin Check: {'✅' if superadmin_success else '❌'}")
    
    if extraction_success and superadmin_success:
        print("🎉 All tests passed! Database configuration is working correctly.")
        print("\n📋 Next steps:")
        print("1. Run 'python setup_superadmin.py' to create superadmin (if needed)")
        print("2. Run 'python main.py' to start the application")
        print("3. Deploy to Render when ready")
        sys.exit(0)
    else:
        print("💥 Some tests failed. Please check your configuration.")
        sys.exit(1) 