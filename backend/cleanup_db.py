from config.database_simple import DatabaseConfig
from bson import ObjectId
import json

def cleanup_database():
    """Clean up the database by removing test data"""
    try:
        # Get database connection
        db = DatabaseConfig.get_database()
        
        print("🔄 Cleaning up database...")
        
        # Remove test users (excluding superadmin)
        result = db.users.delete_many({
            "$and": [
                {"role": {"$ne": "superadmin"}},
                {"username": {"$ne": "superadmin"}}
            ]
        })
        print(f"✅ Removed {result.deleted_count} test users")
        
        # Remove all test data
        collections_to_clean = [
            'students', 'modules', 'levels', 'tests', 
            'online_exams', 'student_test_attempts', 'student_progress',
            'campuses', 'batches', 'courses'
        ]
        
        for collection_name in collections_to_clean:
            try:
                collection = db[collection_name]
                result = collection.delete_many({})
                print(f"✅ Removed {result.deleted_count} records from {collection_name}")
            except Exception as e:
                print(f"⚠️ Could not clean collection {collection_name}: {e}")
        
        print("🎉 Database cleanup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error cleaning up database: {e}")

if __name__ == "__main__":
    cleanup_database() 