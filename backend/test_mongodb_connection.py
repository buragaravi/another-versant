#!/usr/bin/env python3
"""
Test script to verify MongoDB connection with simple configuration
"""
import os
import sys
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def test_mongodb_connection():
    """Test MongoDB connection with the simple configuration"""
    try:
        print("🔄 Testing MongoDB connection...")
        
        # Import the simple database configuration
        from config.database_simple import DatabaseConfig, init_db
        
        # Test the connection
        init_db()
        
        print("✅ MongoDB connection test successful!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection test failed: {e}")
        return False

def test_mongo_class():
    """Test the MongoDB class initialization"""
    try:
        print("🔄 Testing MongoDB class initialization...")
        
        from mongo import MongoDB
        
        # Initialize the MongoDB class
        mongo_instance = MongoDB()
        
        print("✅ MongoDB class initialization successful!")
        return True
        
    except Exception as e:
        print(f"❌ MongoDB class initialization failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Starting MongoDB connection tests...")
    print(f"📊 MongoDB URI: {os.getenv('MONGODB_URI', 'Not set')[:50]}...")
    
    # Test 1: Direct connection
    connection_success = test_mongodb_connection()
    
    # Test 2: MongoDB class
    class_success = test_mongo_class()
    
    if connection_success and class_success:
        print("🎉 All tests passed! MongoDB is ready for deployment.")
        sys.exit(0)
    else:
        print("💥 Some tests failed. Please check your MongoDB configuration.")
        sys.exit(1) 