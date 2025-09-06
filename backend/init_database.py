#!/usr/bin/env python3
"""
Database Initialization Script
Creates missing collections and indexes for the VERSANT system
"""

import os
import sys
from pymongo import MongoClient
from pymongo.errors import OperationFailure
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.database import DatabaseConfig

def init_database():
    """Initialize database with all required collections and indexes"""
    try:
        print("🚀 Initializing VERSANT Database...")
        
        # Get database connection
        client = DatabaseConfig.get_client()
        db_name = DatabaseConfig.get_database_name()
        db = client[db_name]
        
        print(f"📊 Connected to database: {db_name}")
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # Create collections if they don't exist
        collections_to_create = [
            'users',
            'tests', 
            'test_results',
            'student_test_attempts',
            'modules',
            'levels',
            'question_bank',
            'campus',
            'courses',
            'batches',
            'students'
        ]
        
        for collection_name in collections_to_create:
            try:
                # Create collection if it doesn't exist
                if collection_name not in db.list_collection_names():
                    db.create_collection(collection_name)
                    print(f"✅ Created collection: {collection_name}")
                else:
                    print(f"ℹ️  Collection already exists: {collection_name}")
            except Exception as e:
                print(f"⚠️  Could not create collection {collection_name}: {e}")
        
        # Create indexes for better performance
        print("\n🔧 Creating database indexes...")
        
        # Users collection indexes
        try:
            users_collection = db['users']
            users_collection.create_index([("email", 1)], unique=True)
            users_collection.create_index([("username", 1)], unique=True)
            users_collection.create_index([("role", 1)])
            print("✅ Users indexes created")
        except Exception as e:
            print(f"⚠️  Users indexes error: {e}")
        
        # Tests collection indexes
        try:
            tests_collection = db['tests']
            tests_collection.create_index([("module_id", 1)])
            tests_collection.create_index([("level_id", 1)])
            tests_collection.create_index([("test_type", 1)])
            tests_collection.create_index([("is_active", 1)])
            print("✅ Tests indexes created")
        except Exception as e:
            print(f"⚠️  Tests indexes error: {e}")
        
        # Test results collection indexes
        try:
            test_results_collection = db['test_results']
            test_results_collection.create_index([("test_id", 1)])
            test_results_collection.create_index([("student_id", 1)])
            test_results_collection.create_index([("module_id", 1)])
            test_results_collection.create_index([("submitted_at", -1)])
            test_results_collection.create_index([("test_type", 1)])
            print("✅ Test results indexes created")
        except Exception as e:
            print(f"⚠️  Test results indexes error: {e}")
        
        # Student test attempts collection indexes
        try:
            student_test_attempts_collection = db['student_test_attempts']
            student_test_attempts_collection.create_index([("test_id", 1)])
            student_test_attempts_collection.create_index([("student_id", 1)])
            student_test_attempts_collection.create_index([("module_id", 1)])
            student_test_attempts_collection.create_index([("submitted_at", -1)])
            student_test_attempts_collection.create_index([("test_type", 1)])
            print("✅ Student test attempts indexes created")
        except Exception as e:
            print(f"⚠️  Student test attempts indexes error: {e}")
        
        # Modules collection indexes
        try:
            modules_collection = db['modules']
            modules_collection.create_index([("module_id", 1)], unique=True)
            modules_collection.create_index([("is_active", 1)])
            print("✅ Modules indexes created")
        except Exception as e:
            print(f"⚠️  Modules indexes error: {e}")
        
        # Levels collection indexes
        try:
            levels_collection = db['levels']
            levels_collection.create_index([("level_id", 1)], unique=True)
            levels_collection.create_index([("module_id", 1)])
            print("✅ Levels indexes created")
        except Exception as e:
            print(f"⚠️  Levels indexes error: {e}")
        
        # Question bank collection indexes
        try:
            question_bank_collection = db['question_bank']
            question_bank_collection.create_index([("module_id", 1)])
            question_bank_collection.create_index([("level_id", 1)])
            question_bank_collection.create_index([("question_type", 1)])
            question_bank_collection.create_index([("is_active", 1)])
            print("✅ Question bank indexes created")
        except Exception as e:
            print(f"⚠️  Question bank indexes error: {e}")
        
        # Campus collection indexes
        try:
            campus_collection = db['campus']
            campus_collection.create_index([("campus_id", 1)], unique=True)
            campus_collection.create_index([("is_active", 1)])
            print("✅ Campus indexes created")
        except Exception as e:
            print(f"⚠️  Campus indexes error: {e}")
        
        # Courses collection indexes
        try:
            courses_collection = db['courses']
            courses_collection.create_index([("course_id", 1)], unique=True)
            courses_collection.create_index([("campus_id", 1)])
            courses_collection.create_index([("is_active", 1)])
            print("✅ Courses indexes created")
        except Exception as e:
            print(f"⚠️  Courses indexes error: {e}")
        
        # Batches collection indexes
        try:
            batches_collection = db['batches']
            batches_collection.create_index([("batch_id", 1)], unique=True)
            batches_collection.create_index([("course_id", 1)])
            batches_collection.create_index([("campus_id", 1)])
            print("✅ Batches indexes created")
        except Exception as e:
            print(f"⚠️  Batches indexes error: {e}")
        
        # Students collection indexes
        try:
            students_collection = db['students']
            students_collection.create_index([("student_id", 1)], unique=True)
            students_collection.create_index([("batch_id", 1)])
            students_collection.create_index([("campus_id", 1)])
            students_collection.create_index([("email", 1)])
            print("✅ Students indexes created")
        except Exception as e:
            print(f"⚠️  Students indexes error: {e}")
        
        print("\n🎉 Database initialization completed successfully!")
        print(f"📊 Database: {db_name}")
        print(f"🔧 Collections: {len(db.list_collection_names())}")
        
        # Show collection statistics
        print("\n📈 Collection Statistics:")
        for collection_name in db.list_collection_names():
            try:
                count = db[collection_name].count_documents({})
                print(f"  {collection_name}: {count} documents")
            except Exception as e:
                print(f"  {collection_name}: Error counting - {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
