# SMS Service Setup Guide

## Quick Setup

### 1. Environment Variables
Add these environment variables to your `.env` file or set them in your system:

```bash
# BulkSMS API Configuration
BULKSMS_API_KEY=7c9c967a-4ce9-4748-9dc7-d2aaef847275
BULKSMS_SENDER_ID=PYDAHK

# BulkSMS API URLs
BULKSMS_ENGLISH_API_URL=https://www.bulksmsapps.com/api/apismsv2.aspx
BULKSMS_UNICODE_API_URL=https://www.bulksmsapps.com/api/apibulkv2.aspx

# DLT Template IDs (Optional)
BULKSMS_DLT_TEMPLATE_ID=1707175151835691501
BULKSMS_ENGLISH_DLT_TEMPLATE_ID=1707175151753778713
ADMIN_CREDENTIAL_TEMPLATE_ID=1707175393810117693
```

### 2. Test SMS Functionality

#### Option A: Quick Test
```bash
cd backend
python quick_sms_test.py
```
- Update the phone number in the script
- Run the script to test basic SMS functionality

#### Option B: Interactive Test
```bash
cd backend
python test_sms.py
```
- Follow the interactive menu
- Test different types of SMS messages
- Check SMS balance and delivery status

### 3. Test Results

You should receive SMS messages like:

**Credentials SMS:**
```
Welcome to VERSANT! Your login credentials - Username: test.student, Password: temp123. Login at: https://crt.pydahsoft.in -VERSANT
```

**Test Notification SMS:**
```
Dear John Doe, A new test 'Grammar Test 1' has been assigned to you. Test Type: MCQ Test. Login to attempt: https://crt.pydahsoft.in -VERSANT
```

### 4. Troubleshooting

#### SMS Not Received?
1. Check your phone number format (include country code: +91xxxxxxxxxx)
2. Verify BulkSMS API key and sender ID
3. Check SMS balance
4. Check spam/junk folder
5. Verify network connectivity

#### Configuration Issues?
1. Ensure all environment variables are set
2. Check API key validity
3. Verify sender ID is approved
4. Check API URL accessibility

### 5. Integration with Application

Once SMS testing is successful, the SMS functionality is automatically integrated into:

- **Test Management**: SMS notifications when tests are assigned
- **Student Management**: SMS with login credentials
- **Batch Management**: Bulk SMS for student creation
- **All Test Types**: MCQ, Writing, Technical, Audio tests

### 6. SMS Templates

The system uses these templates:

- **Test Notification**: "Dear {name}, A new test '{test_name}' has been assigned to you. Test Type: {test_type}. Login to attempt: {login_url} -VERSANT"
- **Credentials**: "Welcome to VERSANT! Your login credentials - Username: {username}, Password: {password}. Login at: {login_url} -VERSANT"
- **Results**: "Dear {name}, Your test '{test_name}' result is available. Score: {score}%. Login to view details: {login_url} -VERSANT"

### 7. API Endpoints

New endpoints available for SMS management:

- `POST /test-management/test-sms-service` - Test SMS configuration
- `GET /test-management/sms-balance` - Check SMS balance

### 8. Logs

SMS activities are logged with these prefixes:
- `📱` - SMS sending attempts
- `✅` - Successful SMS delivery
- `❌` - Failed SMS delivery
- `⚠️` - SMS service warnings

Check your application logs for detailed SMS activity.
