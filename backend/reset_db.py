from config.database_simple import DatabaseConfig
from bson import ObjectId
import json

def reset_database():
    """Reset the database by dropping all collections"""
    try:
        # Get database connection
        db = DatabaseConfig.get_database()
        
        # List of collections to drop
        collections = [
            'users', 'students', 'modules', 'levels', 'tests', 
            'online_exams', 'student_test_attempts', 'student_progress',
            'campuses', 'batches', 'courses'
        ]
        
        print("🔄 Resetting database...")
        
        # Drop each collection
        for collection_name in collections:
            try:
                collection = db[collection_name]
                result = collection.drop()
                print(f"✅ Dropped collection: {collection_name}")
            except Exception as e:
                print(f"⚠️ Could not drop collection {collection_name}: {e}")
        
        print("🎉 Database reset completed successfully!")
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")

if __name__ == "__main__":
    reset_database() 