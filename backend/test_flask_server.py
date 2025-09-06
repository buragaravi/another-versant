#!/usr/bin/env python3
"""
Test Flask server with login functionality
"""
import os
import sys
import json
import requests
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def test_flask_server():
    """Test Flask server with login request"""
    try:
        print("🧪 Testing Flask server...")
        
        # Import and create Flask app
        from main import create_app
        
        app = create_app()
        
        # Test client
        with app.test_client() as client:
            print("✅ Flask app created successfully")
            
            # Test health endpoint
            response = client.get('/health')
            print(f"📊 Health check status: {response.status_code}")
            print(f"📊 Health check response: {response.get_json()}")
            
            # Test login endpoint
            login_data = {
                'username': 'superadmin',
                'password': 'superadmin123'
            }
            
            print(f"🔍 Testing login with data: {login_data}")
            
            response = client.post('/auth/login', 
                                 json=login_data,
                                 content_type='application/json')
            
            print(f"📊 Login response status: {response.status_code}")
            print(f"📊 Login response: {response.get_json()}")
            
            if response.status_code == 200:
                print("✅ Login test successful!")
                return True
            else:
                print("❌ Login test failed!")
                return False
                
    except Exception as e:
        print(f"❌ Flask server test error: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return False

def test_direct_login():
    """Test login directly without Flask"""
    try:
        print("🧪 Testing direct login...")
        
        from mongo import MongoDB
        import bcrypt
        
        # Initialize MongoDB
        mongo = MongoDB()
        
        # Test credentials
        username = "superadmin"
        password = "superadmin123"
        
        # Find user
        user = mongo.find_user_by_username(username)
        
        if not user:
            print("❌ User not found")
            return False
        
        print(f"✅ User found: {user.get('username')}")
        
        # Verify password
        if 'password_hash' not in user:
            print("❌ No password hash")
            return False
        
        is_valid = bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8'))
        
        if is_valid:
            print("✅ Password verified")
            return True
        else:
            print("❌ Password verification failed")
            return False
            
    except Exception as e:
        print(f"❌ Direct login test error: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Flask Server Test")
    print("=" * 60)
    
    # Test 1: Direct login
    direct_success = test_direct_login()
    
    print()
    
    # Test 2: Flask server
    flask_success = test_flask_server()
    
    print("=" * 60)
    print("📊 Test Results:")
    print(f"   Direct Login: {'✅' if direct_success else '❌'}")
    print(f"   Flask Server: {'✅' if flask_success else '❌'}")
    
    if direct_success and flask_success:
        print("🎉 All tests passed! Server should work correctly.")
    elif direct_success and not flask_success:
        print("⚠️ Direct login works but Flask server has issues.")
        print("This suggests a Flask configuration problem.")
    else:
        print("❌ Both tests failed. Check database and configuration.")

if __name__ == "__main__":
    main() 