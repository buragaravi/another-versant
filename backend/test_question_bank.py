#!/usr/bin/env python3
"""
Test script to verify question bank structure and data for technical questions
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config.database import mongo_db
from bson import ObjectId

def test_question_bank():
    """Test the question bank structure and data"""
    print("=== Question Bank Test ===")
    
    # Test 1: Check if question_bank collection exists
    collections = mongo_db.list_collection_names()
    print(f"Available collections: {collections}")
    
    if 'question_bank' not in collections:
        print("❌ question_bank collection not found!")
        return False
    
    # Test 2: Count total questions
    total_questions = mongo_db.question_bank.count_documents({})
    print(f"Total questions in bank: {total_questions}")
    
    # Test 3: Check CRT_TECHNICAL questions
    technical_questions = mongo_db.question_bank.find({'module_id': 'CRT_TECHNICAL'})
    technical_count = mongo_db.question_bank.count_documents({'module_id': 'CRT_TECHNICAL'})
    print(f"CRT_TECHNICAL questions: {technical_count}")
    
    # Test 4: Check with level_id
    technical_with_level = mongo_db.question_bank.find({
        'module_id': 'CRT_TECHNICAL',
        'level_id': 'CRT_TECHNICAL'
    })
    technical_level_count = mongo_db.question_bank.count_documents({
        'module_id': 'CRT_TECHNICAL',
        'level_id': 'CRT_TECHNICAL'
    })
    print(f"CRT_TECHNICAL with level_id: {technical_level_count}")
    
    # Test 5: Check question types
    compiler_questions = mongo_db.question_bank.count_documents({
        'module_id': 'CRT_TECHNICAL',
        'question_type': 'compiler_integrated'
    })
    mcq_questions = mongo_db.question_bank.count_documents({
        'module_id': 'CRT_TECHNICAL',
        'question_type': 'mcq'
    })
    print(f"Compiler-integrated questions: {compiler_questions}")
    print(f"MCQ questions: {mcq_questions}")
    
    # Test 6: Show sample questions
    print("\n=== Sample Questions ===")
    sample_questions = list(mongo_db.question_bank.find({'module_id': 'CRT_TECHNICAL'}).limit(3))
    
    for i, q in enumerate(sample_questions):
        print(f"\nQuestion {i+1}:")
        print(f"  ID: {q['_id']}")
        print(f"  Module: {q.get('module_id')}")
        print(f"  Level: {q.get('level_id')}")
        print(f"  Type: {q.get('question_type')}")
        print(f"  Question: {q.get('question', '')[:100]}...")
        
        if q.get('question_type') == 'compiler_integrated':
            print(f"  Test Cases: {q.get('testCases', '')[:50]}...")
            print(f"  Expected Output: {q.get('expectedOutput', '')[:50]}...")
            print(f"  Language: {q.get('language')}")
        else:
            print(f"  Options: A={q.get('optionA', '')[:30]}..., B={q.get('optionB', '')[:30]}...")
            print(f"  Answer: {q.get('answer')}")
    
    # Test 7: Check topics
    print("\n=== Topics ===")
    topics = list(mongo_db.crt_topics.find())
    print(f"Total topics: {len(topics)}")
    
    for topic in topics:
        print(f"  Topic: {topic.get('topic_name')} (ID: {topic['_id']})")
        
        # Count questions for this topic
        topic_questions = mongo_db.question_bank.count_documents({
            'module_id': 'CRT_TECHNICAL',
            'topic_id': topic['_id']
        })
        print(f"    Questions: {topic_questions}")
    
    return True

def test_query_consistency():
    """Test query consistency between count and bulk selection"""
    print("\n=== Query Consistency Test ===")
    
    # Test queries
    queries = [
        {'module_id': 'CRT_TECHNICAL'},
        {'module_id': 'CRT_TECHNICAL', 'level_id': 'CRT_TECHNICAL'},
        {'module_id': 'CRT_TECHNICAL', 'question_type': 'compiler_integrated'},
        {'module_id': 'CRT_TECHNICAL', 'question_type': 'mcq'}
    ]
    
    for i, query in enumerate(queries):
        count = mongo_db.question_bank.count_documents(query)
        print(f"Query {i+1} {query}: {count} questions")
    
    return True

if __name__ == "__main__":
    try:
        test_question_bank()
        test_query_consistency()
        print("\n✅ Tests completed successfully!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc() 