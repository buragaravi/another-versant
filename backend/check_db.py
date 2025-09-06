from config.database_simple import DatabaseConfig
from bson import ObjectId
import json

def check_database():
    """Check database connection and collections"""
    try:
        # Get database connection
        db = DatabaseConfig.get_database()
        
        print("🔄 Checking database connection...")
        
        # Test connection
        db.command('ping')
        print("✅ Database connection successful")
        
        # List all collections
        collections = db.list_collection_names()
        print(f"📊 Found {len(collections)} collections:")
        
        for collection_name in collections:
            try:
                collection = db[collection_name]
                count = collection.count_documents({})
                print(f"   - {collection_name}: {count} documents")
            except Exception as e:
                print(f"   - {collection_name}: Error counting documents - {e}")
        
        # Check for superadmin user
        superadmin = db.users.find_one({"username": "superadmin"})
        if superadmin:
            print("✅ Superadmin user exists")
        else:
            print("⚠️ Superadmin user not found")
        
        print("🎉 Database check completed successfully!")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_database() 