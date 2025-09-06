#!/usr/bin/env python3
"""
Test MongoDB connection script
"""
import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

def test_mongodb_connection():
    """Test MongoDB connection with different configurations"""
    
    # Test URI with different connection options
    test_uris = [
        # Original URI
        'mongodb+srv://teja:teja0000@versant.ia46v3i.mongodb.net/versant_final?retryWrites=true&w=majority&appName=Versant',
        
        # URI with timeout options
        'mongodb+srv://teja:teja0000@versant.ia46v3i.mongodb.net/versant_final?retryWrites=true&w=majority&appName=Versant&connectTimeoutMS=30000&socketTimeoutMS=30000&serverSelectionTimeoutMS=30000',
        
        # URI with additional options
        'mongodb+srv://teja:teja0000@versant.ia46v3i.mongodb.net/versant_final?retryWrites=true&w=majority&appName=Versant&connectTimeoutMS=30000&socketTimeoutMS=30000&serverSelectionTimeoutMS=30000&maxPoolSize=10&minPoolSize=1&maxIdleTimeMS=30000&waitQueueTimeoutMS=30000'
    ]
    
    for i, uri in enumerate(test_uris, 1):
        print(f"\n🔍 Testing URI #{i}:")
        print(f"URI: {uri}")
        
        try:
            # Test with minimal options first
            client = MongoClient(uri, serverSelectionTimeoutMS=10000)
            
            # Test connection
            client.admin.command('ping')
            print("✅ Connection successful!")
            
            # Test database access
            db = client['versant_final']
            collections = db.list_collection_names()
            print(f"✅ Database accessible. Collections: {len(collections)} found")
            
            client.close()
            return uri  # Return the working URI
            
        except ServerSelectionTimeoutError as e:
            print(f"❌ Server selection timeout: {e}")
        except ConnectionFailure as e:
            print(f"❌ Connection failure: {e}")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
    
    return None

def test_with_dns_resolver():
    """Test with DNS resolver configuration"""
    print("\n🔍 Testing with DNS resolver configuration...")
    
    try:
        import dns.resolver
        dns.resolver.default_resolver = dns.resolver.Resolver(configure=True)
        dns.resolver.default_resolver.timeout = 10
        dns.resolver.default_resolver.lifetime = 10
        
        uri = 'mongodb+srv://teja:teja0000@versant.ia46v3i.mongodb.net/versant_final?retryWrites=true&w=majority&appName=Versant&connectTimeoutMS=30000&socketTimeoutMS=30000&serverSelectionTimeoutMS=30000'
        
        client = MongoClient(uri, serverSelectionTimeoutMS=15000)
        client.admin.command('ping')
        print("✅ Connection successful with DNS resolver!")
        client.close()
        return uri
        
    except Exception as e:
        print(f"❌ DNS resolver test failed: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Testing MongoDB Connection...")
    
    # Test basic connection
    working_uri = test_mongodb_connection()
    
    if not working_uri:
        # Test with DNS resolver
        working_uri = test_with_dns_resolver()
    
    if working_uri:
        print(f"\n✅ Working URI found: {working_uri}")
        print("\n💡 To fix the connection issue, update your .env file or database.py with this URI")
    else:
        print("\n❌ All connection attempts failed")
        print("💡 Possible solutions:")
        print("1. Check your internet connection")
        print("2. Check if MongoDB Atlas is accessible")
        print("3. Try using a different DNS server")
        print("4. Check if your IP is whitelisted in MongoDB Atlas") 