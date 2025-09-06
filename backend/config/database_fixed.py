import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

load_dotenv()

class DatabaseConfig:
    # MongoDB URI must be set in environment
    MONGODB_URI = os.getenv('MONGODB_URI')
    DATABASE_NAME = 'versant_final'
    
    @staticmethod
    def get_client():
        """Get MongoDB client instance with robust connection settings"""
        if not DatabaseConfig.MONGODB_URI:
            raise ValueError("MONGODB_URI environment variable is not set.")
        try:
            # Connection options to handle DNS and network issues
            client_options = {
                'connectTimeoutMS': 30000,
                'socketTimeoutMS': 30000,
                'serverSelectionTimeoutMS': 30000,
                'maxPoolSize': 10,
                'minPoolSize': 1,
                'maxIdleTimeMS': 30000,
                'waitQueueTimeoutMS': 30000,
                'retryWrites': True,
                'retryReads': True,
                'w': 'majority',
                'appName': 'Versant',
                'directConnection': False,
                'heartbeatFrequencyMS': 10000,
                'maxConnecting': 2
            }
            
            print(f"🔄 Connecting to MongoDB...")
            client = MongoClient(DatabaseConfig.MONGODB_URI, **client_options)
            
            # Test connection immediately
            client.admin.command('ping')
            print("✅ MongoDB connection established successfully")
            
            return client
            
        except ServerSelectionTimeoutError as e:
            print(f"❌ Server selection timeout: {e}")
            print("💡 This usually indicates DNS resolution issues or network connectivity problems")
            raise e
        except ConnectionFailure as e:
            print(f"❌ Connection failure: {e}")
            print("💡 Please check your MongoDB Atlas connection string and network connectivity")
            raise e
        except Exception as e:
            print(f"❌ Unexpected error creating MongoDB client: {e}")
            raise e
    
    @staticmethod
    def get_database():
        """Get database instance"""
        client = DatabaseConfig.get_client()
        return client[DatabaseConfig.DATABASE_NAME]
    
    @staticmethod
    def get_collection(collection_name):
        """Get specific collection"""
        db = DatabaseConfig.get_database()
        return db[collection_name]

def init_db():
    """Initialize database connection and create indexes with better error handling"""
    try:
        print("🔄 Initializing database connection...")
        client = DatabaseConfig.get_client()
        db = client[DatabaseConfig.DATABASE_NAME]
        
        print("🔄 Creating database indexes...")
        
        # Create indexes for better performance
        users_collection = db['users']
        users_collection.create_index([("email", 1)], unique=True)
        users_collection.create_index([("username", 1)], unique=True)
        users_collection.create_index([("role", 1)])
        users_collection.create_index([("campus_id", 1)])
        users_collection.create_index([("course_id", 1)])
        
        tests_collection = db['tests']
        tests_collection.create_index([("test_id", 1)], unique=True)
        tests_collection.create_index([("module", 1), ("difficulty", 1)])
        tests_collection.create_index([("status", 1)])
        
        results_collection = db['test_results']
        results_collection.create_index([("user_id", 1), ("test_id", 1)])
        results_collection.create_index([("submitted_at", -1)])
        
        # Additional indexes for new collections
        campuses_collection = db['campuses']
        campuses_collection.create_index([("name", 1)], unique=True)
        
        courses_collection = db['courses']
        courses_collection.create_index([("name", 1), ("campus_id", 1)])
        courses_collection.create_index([("campus_id", 1)])
        
        batches_collection = db['batches']
        batches_collection.create_index([("name", 1)], unique=True)
        batches_collection.create_index([("campus_ids", 1)])
        batches_collection.create_index([("course_ids", 1)])
        
        students_collection = db['students']
        students_collection.create_index([("roll_number", 1)], unique=True)
        students_collection.create_index([("email", 1)], unique=True)
        students_collection.create_index([("campus_id", 1)])
        students_collection.create_index([("course_id", 1)])
        students_collection.create_index([("batch_id", 1)])
        
        print("✅ Database indexes created successfully")
        print(f"✅ Connected to database: {DatabaseConfig.DATABASE_NAME}")
        
    except ServerSelectionTimeoutError as e:
        print(f"❌ Database initialization failed - Server selection timeout: {e}")
        print("💡 This is likely a DNS resolution issue. Try the following:")
        print("   1. Check your internet connection")
        print("   2. Try using a different DNS server (8.8.8.8 or 1.1.1.1)")
        print("   3. Check if MongoDB Atlas is accessible from your network")
        print("   4. Verify your IP is whitelisted in MongoDB Atlas")
        raise e
    except ConnectionFailure as e:
        print(f"❌ Database initialization failed - Connection failure: {e}")
        print("💡 Please check your MongoDB connection string and credentials")
        raise e
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        print("💡 Please check your MongoDB connection and try again")
        raise e 