# VERSANT Backend Installation Guide

## Prerequisites

- Python 3.11 or higher
- pip (Python package installer)
- MongoDB (local or cloud instance)
- AWS S3 account (for file storage)
- OpenAI API key (for audio transcription)

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd AI-VERSANT-DEPLOYMENT-FILE/backend
```

### 2. Install Dependencies

#### For Windows Users:
PyAudio requires special handling on Windows. Use one of these methods:

**Method 1: Using pre-compiled wheels (Recommended)**
```bash
python -m pip install pyaudio --only-binary=all
python -m pip install -r requirements.txt
```

**Method 2: Using pipwin**
```bash
python -m pip install pipwin
pipwin install pyaudio
python -m pip install -r requirements.txt
```

**Method 3: Using the provided scripts**
```bash
# Run the batch file
install_windows.bat

# Or run the PowerShell script
.\install_windows.ps1
```

#### For Linux/Mac Users:
```bash
# Install system dependencies first
# Ubuntu/Debian:
sudo apt-get install portaudio19-dev python3-pyaudio

# macOS:
brew install portaudio

# Then install Python packages
python -m pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/versant_db

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Server Configuration
FLASK_ENV=development
FLASK_DEBUG=True
```

### 4. Database Setup

Ensure MongoDB is running and accessible. The application will create the necessary collections automatically.

### 5. Run the Application

```bash
python main.py
```

The server will start on `http://localhost:5000`

## Troubleshooting

### PyAudio Installation Issues

**Windows:**
- If you get compilation errors, install Visual C++ Build Tools
- Try using pre-compiled wheels: `pip install pyaudio --only-binary=all`
- Alternative: Use `pipwin install pyaudio`

**Linux:**
- Install portaudio development libraries: `sudo apt-get install portaudio19-dev`
- For Ubuntu/Debian: `sudo apt-get install python3-pyaudio`

**macOS:**
- Install portaudio: `brew install portaudio`
- Then install PyAudio: `pip install pyaudio`

### Other Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check the connection string in `.env`

2. **AWS S3 Access Error:**
   - Verify AWS credentials in `.env`
   - Ensure S3 bucket exists and is accessible

3. **OpenAI API Error:**
   - Check API key in `.env`
   - Ensure sufficient API credits

## Development

### Running Tests
```bash
pytest
```

### Code Formatting
```bash
# Install black if not already installed
pip install black

# Format code
black .
```

## Production Deployment

1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server like Gunicorn:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 main:app
   ```
3. Set up proper logging and monitoring
4. Configure HTTPS with a reverse proxy (nginx/Apache)

## API Documentation

The API endpoints are documented in the individual route files under `routes/` directory.

## Support

For issues related to:
- PyAudio installation: Check the troubleshooting section above
- MongoDB: Refer to MongoDB documentation
- AWS S3: Check AWS credentials and bucket permissions
- General backend issues: Check the logs in the console output

## Audio Generation Dependencies

- The backend requires `ffmpeg` to be installed on the server for audio generation (Listening/Speaking modules) to work.
- On Ubuntu/Debian, install with:

  ```sh
  apt-get update && apt-get install -y ffmpeg
  ```
- On Render, add this line to your `build.sh` script.
- **Vercel does NOT support custom system binaries like ffmpeg for Python backends.**
  - Use a different host (Render, Railway, etc.) or a cloud TTS API instead. 