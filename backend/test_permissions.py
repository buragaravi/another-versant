#!/usr/bin/env python3

import requests
import json
import sys

print("Script started", flush=True)

# Test the course creation endpoint
def test_course_creation():
    base_url = "http://localhost:5000"
    print("Starting test...", flush=True)
    
    # First, let's try to login and get a token
    login_data = {
        "username": "superadmin",
        "password": "Versant@2024"
    }
    print(f"Attempting login with: {login_data}", flush=True)
    
    try:
        # Login
        login_response = requests.post(f"{base_url}/auth/login", json=login_data)
        print("Login Response Status:", login_response.status_code, flush=True)
        print("Login Response:", login_response.text, flush=True)
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get('data', {}).get('access_token')
            print(f"Access token: {access_token}", flush=True)
            
            if access_token:
                print(f"Got access token: {access_token[:50]}...", flush=True)
                
                # Test course creation
                headers = {
                    'Authorization': f'Bearer {access_token}',
                    'Content-Type': 'application/json'
                }
                
                course_data = {
                    "course_name": "Test Course",
                    "admin_name": "Test Admin",
                    "admin_email": "testadmin@test.com",
                    "admin_password": "testpass123"
                }
                print(f"Attempting to create course with data: {course_data}", flush=True)
                
                # Use the campus ID from the database
                campus_id = "68543b81c1c6f530d2c9548a"  # Degree campus ID
                
                course_response = requests.post(
                    f"{base_url}/course-management/{campus_id}",
                    json=course_data,
                    headers=headers
                )
                
                print("Course Creation Response Status:", course_response.status_code, flush=True)
                print("Course Creation Response:", course_response.text, flush=True)
                
            else:
                print("No access token received", flush=True)
        else:
            print("Login failed", flush=True)
            
    except Exception as e:
        print(f"Error: {e}", flush=True)

if __name__ == "__main__":
    test_course_creation()
print("Test script finished.", flush=True) 