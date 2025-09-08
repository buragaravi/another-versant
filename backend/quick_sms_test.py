#!/usr/bin/env python3
"""
Quick SMS Test Script
====================

A simple script to quickly test SMS functionality with your phone number.
Just update the phone number and run the script.

Usage:
    python quick_sms_test.py
"""

import os
import sys

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.sms_service import (
    send_credentials_sms,
    send_test_notification_sms,
    check_sms_configuration
)

def quick_test():
    """Quick SMS test"""
    print("🚀 VERSANT SMS Quick Test")
    print("=" * 40)
    
    # Configuration check
    config = check_sms_configuration()
    if not config['available']:
        print("❌ SMS service not configured!")
        print("Please set these environment variables:")
        print("- BULKSMS_API_KEY")
        print("- BULKSMS_SENDER_ID")
        return
    
    print("✅ SMS service is configured!")
    
    # Update this phone number with your actual number
    PHONE_NUMBER = "9392604899"  # 👈 UPDATE THIS WITH YOUR PHONE NUMBER
    
    print(f"\n📱 Testing with phone number: {PHONE_NUMBER}")
    print("⚠️  Make sure to update the phone number in the script!")
    
    # Test 1: Credentials SMS
    print("\n📧 Testing Credentials SMS...")
    result1 = send_credentials_sms(
        phone_number=PHONE_NUMBER,
        username="Ravi",
        password="ravi"
    )
    
    if result1.get('success'):
        print("✅ Credentials SMS sent successfully!")
        print(f"📨 Message ID: {result1.get('messageId')}")
    else:
        print(f"❌ Credentials SMS failed: {result1.get('error')}")
    
    # Test 2: Test Notification SMS
    print("\n📝 Testing Test Notification SMS...")
    result2 = send_test_notification_sms(
        phone_number=PHONE_NUMBER,
        student_name="John Doe",
        test_name="Grammar Test 1",
        test_type="MCQ Test"
    )
    
    if result2.get('success'):
        print("✅ Test Notification SMS sent successfully!")
        print(f"📨 Message ID: {result2.get('messageId')}")
    else:
        print(f"❌ Test Notification SMS failed: {result2.get('error')}")
    
    print("\n🎉 Quick test completed!")
    print("Check your phone for the SMS messages.")

if __name__ == "__main__":
    quick_test()
