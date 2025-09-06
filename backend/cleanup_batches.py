from mongo import mongo_db
from bson import ObjectId

def cleanup_batches():
    """Clean up all existing batches and batch-course instances"""
    try:
        print("🧹 Starting batch cleanup...")
        
        # Count existing batches
        batch_count = mongo_db.batches.count_documents({})
        print(f"📊 Found {batch_count} existing batches")
        
        # Count existing batch-course instances
        instance_count = mongo_db.db.batch_course_instances.count_documents({})
        print(f"📊 Found {instance_count} existing batch-course instances")
        
        # Count students associated with batches
        student_count = mongo_db.students.count_documents({'batch_id': {'$exists': True}})
        print(f"📊 Found {student_count} students associated with batches")
        
        if batch_count == 0 and instance_count == 0:
            print("✅ No batches or instances to clean up")
            return
        
        # Confirm cleanup
        print("\n⚠️  WARNING: This will delete all batches, instances, and associated student data!")
        confirm = input("Type 'YES' to confirm cleanup: ")
        
        if confirm != 'YES':
            print("❌ Cleanup cancelled")
            return
        
        # Delete batch-course instances first
        if instance_count > 0:
            result = mongo_db.db.batch_course_instances.delete_many({})
            print(f"🗑️  Deleted {result.deleted_count} batch-course instances")
        
        # Delete students associated with batches
        if student_count > 0:
            result = mongo_db.students.delete_many({'batch_id': {'$exists': True}})
            print(f"🗑️  Deleted {result.deleted_count} students associated with batches")
        
        # Delete batches
        if batch_count > 0:
            result = mongo_db.batches.delete_many({})
            print(f"🗑️  Deleted {result.deleted_count} batches")
        
        print("✅ Batch cleanup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")

if __name__ == "__main__":
    cleanup_batches() 