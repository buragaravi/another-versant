# Render Deployment Guide for VERSANT Backend

## Overview
This guide will help you deploy the VERSANT backend to Render and fix the MongoDB SSL/TLS connection issues.

## Prerequisites
1. A Render account
2. MongoDB Atlas cluster
3. AWS S3 bucket configured
4. Environment variables ready

## Step 1: Prepare Your MongoDB Atlas Configuration

### 1.1 Update MongoDB Atlas Network Access
1. Go to your MongoDB Atlas dashboard
2. Navigate to **Network Access**
3. Add `0.0.0.0/0` to allow connections from anywhere (or add Render's IP ranges)
4. Make sure your cluster is accessible

### 1.2 Update MongoDB Atlas Database User
1. Go to **Database Access**
2. Ensure your database user has the correct permissions
3. Make sure the password is correct and doesn't contain special characters that need URL encoding

### 1.3 Get Your Connection String
1. Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. Replace `<password>` with your actual password
5. Replace `<dbname>` with `versant_final`

## Step 2: Environment Variables for Render

Set these environment variables in your Render service:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/versant_final?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET_KEY=your_secure_jwt_secret_key_here

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name

# CORS Configuration
CORS_ORIGINS=https://your-frontend-domain.vercel.app,http://localhost:3000

# Flask Configuration
FLASK_DEBUG=False
PORT=10000
```

## Step 3: Render Service Configuration

### 3.1 Create a New Web Service
1. Go to your Render dashboard
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Select the repository containing your backend code

### 3.2 Service Settings
- **Name**: `versant-backend` (or your preferred name)
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python main.py`
- **Root Directory**: `backend` (if your backend is in a subdirectory)

### 3.3 Environment Variables
Add all the environment variables listed in Step 2 to your Render service.

## Step 4: Fix MongoDB SSL Issues

The main issue you're experiencing is SSL/TLS handshake failures. The updated code includes:

1. **Cloud-optimized database configuration** (`database_cloud.py`)
2. **Proper SSL/TLS settings** for cloud deployment
3. **Retry logic** for connection attempts
4. **Better error handling** during initialization

### 4.1 Key Changes Made
- Added `tls=true` and `ssl=true` parameters to connection string
- Increased timeout values for cloud deployment
- Added retry logic with exponential backoff
- Improved SSL context configuration
- Added connection pooling optimization

## Step 5: Test Your Deployment

### 5.1 Local Testing
Before deploying to Render, test locally:

```bash
cd backend
python test_mongodb_connection.py
```

### 5.2 Render Deployment
1. Push your changes to GitHub
2. Render will automatically redeploy
3. Check the deployment logs for any errors

### 5.3 Health Check
After deployment, test your API:

```bash
curl https://your-render-service.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "VERSANT API is running"
}
```

## Step 6: Troubleshooting

### 6.1 Common Issues

#### SSL Handshake Failed
**Symptoms**: `SSL handshake failed: [SSL: TLSV1_ALERT_INTERNAL_ERROR]`

**Solutions**:
1. Ensure your MongoDB URI includes `ssl=true&tls=true`
2. Check that your MongoDB Atlas cluster is accessible
3. Verify your database user credentials
4. Make sure your MongoDB Atlas cluster is not paused

#### Connection Timeout
**Symptoms**: `ServerSelectionTimeoutError`

**Solutions**:
1. Check your MongoDB Atlas Network Access settings
2. Verify your connection string is correct
3. Ensure your cluster is running and accessible

#### Environment Variables Not Set
**Symptoms**: `MONGODB_URI environment variable is not set`

**Solutions**:
1. Double-check all environment variables in Render
2. Ensure variable names match exactly (case-sensitive)
3. Restart your Render service after adding variables

### 6.2 Debugging Steps

1. **Check Render Logs**: Go to your service → **Logs** tab
2. **Test Connection Locally**: Use the test script provided
3. **Verify MongoDB Atlas**: Ensure cluster is running and accessible
4. **Check Environment Variables**: Verify all variables are set correctly

## Step 7: Production Considerations

### 7.1 Security
- Use strong, unique passwords for MongoDB
- Rotate JWT secrets regularly
- Use environment variables for all sensitive data
- Enable MongoDB Atlas security features

### 7.2 Performance
- Monitor your MongoDB Atlas cluster performance
- Set up proper indexes (already included in the code)
- Use connection pooling (configured in the code)
- Monitor Render service performance

### 7.3 Monitoring
- Set up MongoDB Atlas alerts
- Monitor Render service logs
- Set up health check endpoints
- Monitor API response times

## Step 8: Final Checklist

- [ ] MongoDB Atlas cluster is running and accessible
- [ ] Network Access allows connections from Render
- [ ] Database user has correct permissions
- [ ] All environment variables are set in Render
- [ ] Connection string is correct and includes SSL parameters
- [ ] Frontend CORS settings include your Render domain
- [ ] Health check endpoint returns success
- [ ] All API endpoints are working correctly

## Support

If you continue to experience issues:

1. Check the Render deployment logs
2. Test the MongoDB connection locally
3. Verify your MongoDB Atlas configuration
4. Review the error messages in detail
5. Consider checking MongoDB Atlas status page for any service issues

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [PyMongo Documentation](https://pymongo.readthedocs.io/)
- [Flask Documentation](https://flask.palletsprojects.com/) 