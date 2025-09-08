import os
import requests
import logging
from typing import Dict, List, Optional, Tuple

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# BulkSMS Configuration
BULKSMS_API_KEY = os.getenv('BULKSMS_API_KEY', "7c9c967a-4ce9-4748-9dc7-d2aaef847275")
BULKSMS_SENDER_ID = os.getenv('BULKSMS_SENDER_ID', "PYDAHK")

# API URLs based on BulkSMS documentation
BULKSMS_ENGLISH_API_URL = os.getenv('BULKSMS_ENGLISH_API_URL', "https://www.bulksmsapps.com/api/apismsv2.aspx")
BULKSMS_UNICODE_API_URL = os.getenv('BULKSMS_UNICODE_API_URL', "https://www.bulksmsapps.com/api/apibulkv2.aspx")

# DLT Template IDs
BULKSMS_DLT_TEMPLATE_ID = os.getenv('BULKSMS_DLT_TEMPLATE_ID', "1707175151835691501")
BULKSMS_ENGLISH_DLT_TEMPLATE_ID = os.getenv('BULKSMS_ENGLISH_DLT_TEMPLATE_ID', "1707175151753778713")
ADMIN_CREDENTIAL_TEMPLATE_ID = os.getenv('ADMIN_CREDENTIAL_TEMPLATE_ID', "1707175393810117693")

# SMS Templates
HOSTEL_TELUGU_OTP_TEMPLATE = "ప్రియమైన తల్లిదండ్రులారా, మీ {#var#} {#var#} హాస్టల్ నుండి సెలవు కోరుతున్నారు. ఈ OTP {#var#} ని షేర్ చేయండి. మీరు అంగీకరిస్తేనే -Pydah Hostel"
HOSTEL_ENGLISH_OTP_TEMPLATE = "Dear Parents, your child {#var#} is seeking leave from hostel. share this OTP {#var#}. Only if you would like to approve-Pydah Hostel"
ADMIN_CREDENTIAL_TEMPLATE = "Welcome to PYDAH HOSTEL. Your Account is created with UserID: {#var#} Password: {#var#} login with link: {#var#} -Pydah"

# VERSANT specific templates
VERSANT_TEST_NOTIFICATION_TEMPLATE = "Dear {#var#}, A new test '{#var#}' has been assigned to you. Test Type: {#var#}. Login to attempt: {#var#} -VERSANT"
VERSANT_CREDENTIALS_TEMPLATE = "Welcome to PYDAH HOSTEL. Your Account is created with UserID: {#var#} Password: {#var#} login with link: {#var#} -Pydah"
VERSANT_RESULT_TEMPLATE = "Dear {#var#}, Your test '{#var#}' result is available. Score: {#var#}%. Login to view details: {#var#} -VERSANT"

# Check if SMS service is available
SMS_AVAILABLE = bool(BULKSMS_API_KEY and BULKSMS_SENDER_ID and BULKSMS_ENGLISH_API_URL)

if SMS_AVAILABLE:
    logger.info("✅ BulkSMS service is available")
else:
    logger.warning("⚠️ Warning: BulkSMS configuration missing. SMS functionality will be disabled.")

def is_valid_sms_response(response_data: str) -> bool:
    """Check if SMS response is valid"""
    if not response_data or not isinstance(response_data, str):
        return False
    
    # Check for valid message ID patterns
    if 'MessageId-' in response_data or response_data.strip().isdigit():
        return True
    
    # Check if HTML response contains MessageId
    if any(tag in response_data for tag in ['<!DOCTYPE', '<html', '<body']):
        import re
        message_id_match = re.search(r'MessageId-(\d+)', response_data)
        if message_id_match:
            return True
    
    return False

def extract_message_id(response_data: str) -> Optional[str]:
    """Extract message ID from response"""
    import re
    
    # Try to extract MessageId using regex
    message_id_match = re.search(r'MessageId-(\d+)', response_data)
    if message_id_match:
        return message_id_match.group(1)
    
    # Fallback methods
    if 'MessageId-' in response_data:
        return response_data.split('MessageId-')[1].split('\n')[0].strip()
    
    if response_data.strip().isdigit():
        return response_data.strip()
    
    return None

def send_sms_post(params: Dict, is_unicode: bool = False) -> requests.Response:
    """Send SMS using POST method with GET fallback"""
    api_url = BULKSMS_UNICODE_API_URL if is_unicode else BULKSMS_ENGLISH_API_URL
    
    logger.info(f"Using API URL for {'Unicode' if is_unicode else 'English'} SMS: {api_url}")
    
    headers = {
        'Accept': 'text/plain',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    try:
        # Try POST method first
        response = requests.post(api_url, params=params, headers=headers, timeout=30)
        return response
    except Exception as e:
        logger.warning(f"POST method failed, trying GET: {e}")
        # Fallback to GET method
        response = requests.get(api_url, params=params, headers=headers, timeout=30)
        return response

def send_test_notification_sms(phone_number: str, student_name: str, test_name: str, test_type: str, login_url: str = "crt.pydahsoft.in") -> Dict:
    """Send test notification SMS to student"""
    try:
        if not SMS_AVAILABLE:
            logger.warning(f"⚠️ SMS service disabled. Would send to {phone_number}: Test notification for {test_name}")
            return {'success': False, 'error': 'SMS service not configured'}
        
        logger.info(f"📱 Sending test notification SMS to: {phone_number}")
        
        # Replace template variables
        message = VERSANT_TEST_NOTIFICATION_TEMPLATE.replace('{#var#}', student_name, 1) \
                                                   .replace('{#var#}', test_name, 1) \
                                                   .replace('{#var#}', test_type, 1) \
                                                   .replace('{#var#}', login_url, 1)
        
        params = {
            'apikey': BULKSMS_API_KEY,
            'sender': BULKSMS_SENDER_ID,
            'number': phone_number,
            'message': message
        }
        
        logger.info(f"📱 Test notification SMS params: {params}")
        
        response = send_sms_post(params, False)  # English SMS
        
        logger.info(f"📱 Test notification SMS response: {response.text}")
        
        if is_valid_sms_response(response.text):
            message_id = extract_message_id(response.text)
            if message_id:
                logger.info(f"✅ Test notification SMS sent successfully with MessageId: {message_id}")
                return {
                    'success': True,
                    'messageId': message_id,
                    'type': 'test_notification',
                    'language': 'English'
                }
        
        raise Exception('Failed to send test notification SMS')
        
    except Exception as e:
        logger.error(f"📱 Error sending test notification SMS: {e}")
        return {'success': False, 'error': str(e)}

def send_credentials_sms(phone_number: str, username: str, password: str, login_url: str = "crt.pydahsoft.in") -> Dict:
    """Send credentials SMS to student/admin"""
    try:
        if not SMS_AVAILABLE:
            logger.warning(f"⚠️ SMS service disabled. Would send to {phone_number}: Credentials for {username}")
            return {'success': False, 'error': 'SMS service not configured'}
        
        logger.info(f"📱 Sending credentials SMS to: {phone_number}")
        
        # Replace template variables
        message = VERSANT_CREDENTIALS_TEMPLATE.replace('{#var#}', username, 1) \
                                             .replace('{#var#}', password, 1) \
                                             .replace('{#var#}', login_url, 1)
        
        params = {
            'apikey': BULKSMS_API_KEY,
            'sender': BULKSMS_SENDER_ID,
            'number': phone_number,
            'message': message
        }
        
        logger.info(f"📱 Credentials SMS params: {params}")
        
        response = send_sms_post(params, False)  # English SMS
        
        logger.info(f"📱 Credentials SMS response: {response.text}")
        
        if is_valid_sms_response(response.text):
            message_id = extract_message_id(response.text)
            if message_id:
                logger.info(f"✅ Credentials SMS sent successfully with MessageId: {message_id}")
                return {
                    'success': True,
                    'messageId': message_id,
                    'type': 'credentials',
                    'language': 'English'
                }
        
        raise Exception('Failed to send credentials SMS')
        
    except Exception as e:
        logger.error(f"📱 Error sending credentials SMS: {e}")
        return {'success': False, 'error': str(e)}

def send_result_notification_sms(phone_number: str, student_name: str, test_name: str, score: float, login_url: str = "crt.pydahsoft.in") -> Dict:
    """Send test result notification SMS to student"""
    try:
        if not SMS_AVAILABLE:
            logger.warning(f"⚠️ SMS service disabled. Would send to {phone_number}: Result for {test_name}")
            return {'success': False, 'error': 'SMS service not configured'}
        
        logger.info(f"📱 Sending result notification SMS to: {phone_number}")
        
        # Replace template variables
        message = VERSANT_RESULT_TEMPLATE.replace('{#var#}', student_name, 1) \
                                        .replace('{#var#}', test_name, 1) \
                                        .replace('{#var#}', str(score), 1) \
                                        .replace('{#var#}', login_url, 1)
        
        params = {
            'apikey': BULKSMS_API_KEY,
            'sender': BULKSMS_SENDER_ID,
            'number': phone_number,
            'message': message
        }
        
        logger.info(f"📱 Result notification SMS params: {params}")
        
        response = send_sms_post(params, False)  # English SMS
        
        logger.info(f"📱 Result notification SMS response: {response.text}")
        
        if is_valid_sms_response(response.text):
            message_id = extract_message_id(response.text)
            if message_id:
                logger.info(f"✅ Result notification SMS sent successfully with MessageId: {message_id}")
                return {
                    'success': True,
                    'messageId': message_id,
                    'type': 'result_notification',
                    'language': 'English'
                }
        
        raise Exception('Failed to send result notification SMS')
        
    except Exception as e:
        logger.error(f"📱 Error sending result notification SMS: {e}")
        return {'success': False, 'error': str(e)}

def send_custom_sms(phone_number: str, message: str, is_unicode: bool = False) -> Dict:
    """Send custom SMS message"""
    try:
        if not SMS_AVAILABLE:
            logger.warning(f"⚠️ SMS service disabled. Would send to {phone_number}: {message}")
            return {'success': False, 'error': 'SMS service not configured'}
        
        logger.info(f"📱 Sending custom SMS to: {phone_number}")
        
        params = {
            'apikey': BULKSMS_API_KEY,
            'sender': BULKSMS_SENDER_ID,
            'number': phone_number,
            'message': message
        }
        
        if is_unicode:
            params['coding'] = '3'  # Unicode parameter
        
        logger.info(f"📱 Custom SMS params: {params}")
        
        response = send_sms_post(params, is_unicode)
        
        logger.info(f"📱 Custom SMS response: {response.text}")
        
        if is_valid_sms_response(response.text):
            message_id = extract_message_id(response.text)
            if message_id:
                logger.info(f"✅ Custom SMS sent successfully with MessageId: {message_id}")
                return {
                    'success': True,
                    'messageId': message_id,
                    'type': 'custom',
                    'language': 'Unicode' if is_unicode else 'English'
                }
        
        raise Exception('Failed to send custom SMS')
        
    except Exception as e:
        logger.error(f"📱 Error sending custom SMS: {e}")
        return {'success': False, 'error': str(e)}

def check_sms_balance() -> Dict:
    """Check SMS balance"""
    try:
        if not SMS_AVAILABLE:
            return {'success': False, 'error': 'SMS service not configured'}
        
        url = f"http://www.bulksmsapps.com/api/apicheckbalancev2.aspx?apikey={BULKSMS_API_KEY}"
        response = requests.get(url, timeout=30)
        
        return {
            'success': True,
            'balance': response.text
        }
        
    except Exception as e:
        logger.error(f"Error checking SMS balance: {e}")
        return {'success': False, 'error': str(e)}

def check_delivery_status(message_id: str) -> Dict:
    """Check SMS delivery status"""
    try:
        if not SMS_AVAILABLE:
            return {'success': False, 'error': 'SMS service not configured'}
        
        url = f"http://www.bulksmsapps.com/api/apiDeliveryStatusv2.aspx?apikey={BULKSMS_API_KEY}&messageid={message_id}"
        response = requests.get(url, timeout=30)
        
        return {
            'success': True,
            'status': response.text
        }
        
    except Exception as e:
        logger.error(f"Error checking delivery status: {e}")
        return {'success': False, 'error': str(e)}

def check_sms_configuration() -> Dict:
    """Check if SMS service is properly configured"""
    return {
        'available': SMS_AVAILABLE,
        'api_key_configured': bool(BULKSMS_API_KEY),
        'sender_id_configured': bool(BULKSMS_SENDER_ID),
        'english_api_configured': bool(BULKSMS_ENGLISH_API_URL),
        'unicode_api_configured': bool(BULKSMS_UNICODE_API_URL),
        'dlt_template_configured': bool(BULKSMS_DLT_TEMPLATE_ID),
        'english_dlt_template_configured': bool(BULKSMS_ENGLISH_DLT_TEMPLATE_ID)
    }
