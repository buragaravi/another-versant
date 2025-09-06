import os
from pymongo import MongoClient
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

class DatabaseConfig:
    # MongoDB URI from environment variable
    MONGODB_URI = os.getenv('MONGODB_URI')
    
    @staticmethod
    def get_database_name():
        """Extract database name from MongoDB URI"""
        if not DatabaseConfig.MONGODB_URI:
            return 'versant_final'  # fallback default
        
        try:
            # Parse the URI to extract database name
            parsed_uri = urlparse(DatabaseConfig.MONGODB_URI)
            # The path will be like '/database_name?params'
            db_name = parsed_uri.path.strip('/').split('?')[0]
            return db_name if db_name else 'versant_final'
        except Exception:
            return 'versant_final'  # fallback default
    
    @staticmethod
    def get_client():
        """Get MongoDB client instance with cloud-optimized settings"""
        try:
            if not DatabaseConfig.MONGODB_URI:
                raise ValueError("MONGODB_URI environment variable is not set")
            
            # Cloud-optimized client options (using valid PyMongo parameters)
            client_options = {
                'connectTimeoutMS': 60000,  # Increased timeout for cloud
                'socketTimeoutMS': 60000,
                'serverSelectionTimeoutMS': 60000,
                'maxPoolSize': 50,  # Increased pool size for cloud
                'minPoolSize': 5,
                'maxIdleTimeMS': 30000,
                'waitQueueTimeoutMS': 60000,
                'retryWrites': True,
                'w': 'majority',
                'appName': 'Versant-Cloud',
                'directConnection': False,
                'retryReads': True,
                # SSL/TLS configuration (using correct parameter names)
                'tls': True,
                'tlsAllowInvalidCertificates': False,
                'tlsAllowInvalidHostnames': False,
                'tlsInsecure': False,
                # Connection stability
                'heartbeatFrequencyMS': 10000,
                'maxConnecting': 5,
                'compressors': ['zlib'],
                'zlibCompressionLevel': 6
            }
            
            # Ensure SSL parameters are in the connection string
            uri = DatabaseConfig.MONGODB_URI
            
            # Add required parameters for cloud deployment
            required_params = [
                'retryWrites=true',
                'w=majority',
                'ssl=true',
                'tls=true'
            ]
            
            # Add parameters if not present
            for param in required_params:
                if param not in uri:
                    if '?' in uri:
                        uri += f'&{param}'
                    else:
                        uri += f'?{param}'
            
            print(f"🔗 Connecting to MongoDB with URI: {uri[:50]}...")
            
            return MongoClient(uri, **client_options)
            
        except Exception as e:
            print(f"❌ Error creating MongoDB client: {e}")
            raise e
    
    @staticmethod
    def get_database():
        """Get database instance"""
        client = DatabaseConfig.get_client()
        db_name = DatabaseConfig.get_database_name()
        print(f"📊 Using database: {db_name}")
        return client[db_name]
    
    @staticmethod
    def get_collection(collection_name):
        """Get specific collection"""
        db = DatabaseConfig.get_database()
        return db[collection_name]

def init_db():
    """Initialize database connection and create indexes"""
    try:
        print("🔄 Initializing MongoDB connection for cloud deployment...")
        
        client = DatabaseConfig.get_client()
        db_name = DatabaseConfig.get_database_name()
        db = client[db_name]
        
        # Test connection with retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                client.admin.command('ping')
                print("✅ MongoDB connection successful")
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                print(f"⚠️ Connection attempt {attempt + 1} failed, retrying...")
                import time
                time.sleep(2 ** attempt)  # Exponential backoff
        
        # Create indexes for better performance
        print("🔄 Creating database indexes...")
        
        users_collection = db['users']
        users_collection.create_index([("email", 1)], unique=True)
        users_collection.create_index([("username", 1)], unique=True)
        
        tests_collection = db['tests']
        tests_collection.create_index([("test_id", 1)], unique=True)
        tests_collection.create_index([("module", 1), ("difficulty", 1)])
        
        results_collection = db['test_results']
        results_collection.create_index([("user_id", 1), ("test_id", 1)])
        results_collection.create_index([("submitted_at", -1)])
        
        print("✅ Database indexes created successfully")
        
    except Exception as e:
        print(f"❌ Database initialization error: {e}")
        raise e 