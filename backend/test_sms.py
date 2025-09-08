#!/usr/bin/env python3
"""
SMS Service Test Script
======================

This script allows you to test the SMS functionality before using it in the application.
You can test different types of SMS messages with your phone number.

Usage:
    python test_sms.py

Make sure to set your environment variables or update the configuration in this file.
"""

import os
import sys
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import SMS service functions
from utils.sms_service import (
    send_test_notification_sms,
    send_credentials_sms,
    send_result_notification_sms,
    send_custom_sms,
    check_sms_balance,
    check_delivery_status,
    check_sms_configuration
)

def print_separator(title=""):
    """Print a separator line with optional title"""
    print("\n" + "="*60)
    if title:
        print(f" {title}")
        print("="*60)
    else:
        print("="*60)

def print_result(result, test_name):
    """Print test result in a formatted way"""
    print(f"\n📱 {test_name} Result:")
    print("-" * 40)
    
    if result.get('success'):
        print("✅ Status: SUCCESS")
        if 'messageId' in result:
            print(f"📨 Message ID: {result['messageId']}")
        if 'type' in result:
            print(f"📝 Type: {result['type']}")
        if 'language' in result:
            print(f"🌐 Language: {result['language']}")
    else:
        print("❌ Status: FAILED")
        if 'error' in result:
            print(f"🚨 Error: {result['error']}")
    
    print(f"📊 Full Response: {json.dumps(result, indent=2)}")

def test_sms_configuration():
    """Test SMS service configuration"""
    print_separator("SMS Configuration Test")
    
    config = check_sms_configuration()
    
    print("🔧 SMS Service Configuration:")
    print("-" * 40)
    
    for key, value in config.items():
        status = "✅" if value else "❌"
        print(f"{status} {key.replace('_', ' ').title()}: {value}")
    
    if config['available']:
        print("\n🎉 SMS service is properly configured!")
        return True
    else:
        print("\n⚠️ SMS service is not properly configured!")
        print("Please check your environment variables:")
        print("- BULKSMS_API_KEY")
        print("- BULKSMS_SENDER_ID")
        print("- BULKSMS_ENGLISH_API_URL")
        return False

def test_sms_balance():
    """Test SMS balance check"""
    print_separator("SMS Balance Test")
    
    balance_result = check_sms_balance()
    
    if balance_result.get('success'):
        print(f"💰 SMS Balance: {balance_result['balance']}")
    else:
        print(f"❌ Failed to check balance: {balance_result.get('error', 'Unknown error')}")

def get_phone_number():
    """Get phone number from user input"""
    while True:
        phone = input("\n📱 Enter your phone number (with country code, e.g., +919876543210): ").strip()
        
        if not phone:
            print("❌ Phone number cannot be empty!")
            continue
            
        if len(phone) < 10:
            print("❌ Phone number seems too short!")
            continue
            
        confirm = input(f"📱 Confirm sending SMS to {phone}? (y/n): ").strip().lower()
        if confirm in ['y', 'yes']:
            return phone
        else:
            print("🔄 Please enter the phone number again.")

def test_credentials_sms(phone_number):
    """Test credentials SMS"""
    print_separator("Credentials SMS Test")
    
    # Sample student credentials
    username = "test.student"
    password = "temp123"
    login_url = "crt.pydahsoft.in"
    
    print(f"📝 Testing with credentials:")
    print(f"   Username: {username}")
    print(f"   Password: {password}")
    print(f"   Login URL: {login_url}")
    
    result = send_credentials_sms(
        phone_number=phone_number,
        username=username,
        password=password,
        login_url=login_url
    )
    
    print_result(result, "Credentials SMS")
    return result

def test_test_notification_sms(phone_number):
    """Test test notification SMS"""
    print_separator("Test Notification SMS Test")
    
    # Sample test data
    student_name = "John Doe"
    test_name = "Grammar Test 1"
    test_type = "MCQ Test"
    login_url = "crt.pydahsoft.in"
    
    print(f"📝 Testing with test data:")
    print(f"   Student Name: {student_name}")
    print(f"   Test Name: {test_name}")
    print(f"   Test Type: {test_type}")
    print(f"   Login URL: {login_url}")
    
    result = send_test_notification_sms(
        phone_number=phone_number,
        student_name=student_name,
        test_name=test_name,
        test_type=test_type,
        login_url=login_url
    )
    
    print_result(result, "Test Notification SMS")
    return result

def test_result_notification_sms(phone_number):
    """Test result notification SMS"""
    print_separator("Result Notification SMS Test")
    
    # Sample result data
    student_name = "John Doe"
    test_name = "Grammar Test 1"
    score = 85.5
    login_url = " crt.pydahsoft.in"
    
    print(f"📝 Testing with result data:")
    print(f"   Student Name: {student_name}")
    print(f"   Test Name: {test_name}")
    print(f"   Score: {score}%")
    print(f"   Login URL: {login_url}")
    
    result = send_result_notification_sms(
        phone_number=phone_number,
        student_name=student_name,
        test_name=test_name,
        score=score,
        login_url=login_url
    )
    
    print_result(result, "Result Notification SMS")
    return result

def test_custom_sms(phone_number):
    """Test custom SMS"""
    print_separator("Custom SMS Test")
    
    custom_message = input("📝 Enter your custom message: ").strip()
    
    if not custom_message:
        print("❌ Custom message cannot be empty!")
        return None
    
    is_unicode = input("🌐 Is this message in Unicode/Telugu? (y/n): ").strip().lower() in ['y', 'yes']
    
    result = send_custom_sms(
        phone_number=phone_number,
        message=custom_message,
        is_unicode=is_unicode
    )
    
    print_result(result, "Custom SMS")
    return result

def test_delivery_status(message_id):
    """Test delivery status check"""
    print_separator("Delivery Status Test")
    
    result = check_delivery_status(message_id)
    
    if result.get('success'):
        print(f"📊 Delivery Status: {result['status']}")
    else:
        print(f"❌ Failed to check delivery status: {result.get('error', 'Unknown error')}")

def main():
    """Main test function"""
    print_separator("VERSANT SMS Service Test")
    print(f"🕐 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test configuration first
    if not test_sms_configuration():
        print("\n❌ SMS service is not configured properly. Please fix the configuration and try again.")
        return
    
    # Test balance
    test_sms_balance()
    
    # Get phone number
    phone_number = get_phone_number()
    
    # Test menu
    while True:
        print_separator("SMS Test Menu")
        print("Choose a test to run:")
        print("1. 📧 Test Credentials SMS")
        print("2. 📝 Test Notification SMS")
        print("3. 📊 Test Result Notification SMS")
        print("4. 💬 Test Custom SMS")
        print("5. 📊 Check SMS Balance")
        print("6. 📨 Check Delivery Status (requires Message ID)")
        print("7. 🔄 Run All Tests")
        print("8. ❌ Exit")
        
        choice = input("\nEnter your choice (1-8): ").strip()
        
        if choice == '1':
            test_credentials_sms(phone_number)
        elif choice == '2':
            test_test_notification_sms(phone_number)
        elif choice == '3':
            test_result_notification_sms(phone_number)
        elif choice == '4':
            test_custom_sms(phone_number)
        elif choice == '5':
            test_sms_balance()
        elif choice == '6':
            message_id = input("📨 Enter Message ID: ").strip()
            if message_id:
                test_delivery_status(message_id)
            else:
                print("❌ Message ID cannot be empty!")
        elif choice == '7':
            print("\n🚀 Running all SMS tests...")
            test_credentials_sms(phone_number)
            test_test_notification_sms(phone_number)
            test_result_notification_sms(phone_number)
        elif choice == '8':
            print("\n👋 Goodbye!")
            break
        else:
            print("❌ Invalid choice! Please enter 1-8.")
        
        # Ask if user wants to continue
        if choice != '8':
            continue_test = input("\n🔄 Do you want to run another test? (y/n): ").strip().lower()
            if continue_test not in ['y', 'yes']:
                print("\n👋 Goodbye!")
                break

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user. Goodbye!")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        import traceback
        traceback.print_exc()
