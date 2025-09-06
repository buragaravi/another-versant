#!/usr/bin/env python3
"""
Comprehensive test script for deployment verification
"""
import os
import sys
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

def test_environment_variables():
    """Test if all required environment variables are set"""
    print("🔍 Testing environment variables...")
    
    required_vars = [
        'MONGODB_URI',
        'JWT_SECRET_KEY',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'AWS_S3_BUCKET'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    else:
        print("✅ All required environment variables are set")
        return True

def test_mongodb_connection():
    """Test MongoDB connection"""
    try:
        print("🔄 Testing MongoDB connection...")
        
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

def test_aws_connection():
    """Test AWS S3 connection"""
    try:
        print("🔄 Testing AWS S3 connection...")
        
        from config.aws_config import init_aws
        
        # Test AWS connection
        init_aws()
        
        print("✅ AWS S3 connection test successful!")
        return True
        
    except Exception as e:
        print(f"❌ AWS S3 connection test failed: {e}")
        return False

def test_flask_app():
    """Test Flask app creation"""
    try:
        print("🔄 Testing Flask app creation...")
        
        from main import create_app
        
        # Create the Flask app
        app = create_app()
        
        print("✅ Flask app creation successful!")
        return True
        
    except Exception as e:
        print(f"❌ Flask app creation failed: {e}")
        return False

def test_imports():
    """Test all module imports"""
    try:
        print("🔄 Testing module imports...")
        
        # Test all route imports
        from routes.auth import auth_bp
        from routes.superadmin import superadmin_bp
        from routes.campus_admin import campus_admin_bp
        from routes.course_admin import course_admin_bp
        from routes.student import student_bp
        from routes.test_management import test_management_bp
        from routes.practice_management import practice_management_bp
        from routes.online_exam_management import online_exam_management_bp

        from routes.analytics import analytics_bp
        from routes.campus_management import campus_management_bp
        from routes.course_management import course_management_bp
        from routes.batch_management import batch_management_bp
        from routes.access_control import access_control_bp
        
        print("✅ All module imports successful!")
        return True
        
    except Exception as e:
        print(f"❌ Module import test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Starting comprehensive deployment tests...")
    print("=" * 60)
    
    # Test environment variables
    env_success = test_environment_variables()
    
    # Test MongoDB connection
    mongo_success = test_mongodb_connection()
    
    # Test MongoDB class
    mongo_class_success = test_mongo_class()
    
    # Test AWS connection
    aws_success = test_aws_connection()
    
    # Test Flask app
    flask_success = test_flask_app()
    
    # Test imports
    imports_success = test_imports()
    
    print("=" * 60)
    print("📊 Test Results Summary:")
    print(f"   Environment Variables: {'✅' if env_success else '❌'}")
    print(f"   MongoDB Connection: {'✅' if mongo_success else '❌'}")
    print(f"   MongoDB Class: {'✅' if mongo_class_success else '❌'}")
    print(f"   AWS S3 Connection: {'✅' if aws_success else '❌'}")
    print(f"   Flask App Creation: {'✅' if flask_success else '❌'}")
    print(f"   Module Imports: {'✅' if imports_success else '❌'}")
    
    all_success = all([
        env_success, mongo_success, mongo_class_success, 
        aws_success, flask_success, imports_success
    ])
    
    if all_success:
        print("🎉 All tests passed! Your application is ready for deployment.")
        print("\n📋 Next steps:")
        print("1. Push your changes to GitHub")
        print("2. Deploy to Render")
        print("3. Set environment variables in Render")
        print("4. Test the deployed application")
        sys.exit(0)
    else:
        print("💥 Some tests failed. Please fix the issues before deploying.")
        print("\n🔧 Troubleshooting tips:")
        if not env_success:
            print("- Check your .env file and environment variables")
        if not mongo_success or not mongo_class_success:
            print("- Verify your MongoDB Atlas configuration")
            print("- Check your MONGODB_URI environment variable")
        if not aws_success:
            print("- Verify your AWS credentials and S3 bucket")
        if not flask_success or not imports_success:
            print("- Check for any missing dependencies")
        sys.exit(1)

if __name__ == "__main__":
    main() 