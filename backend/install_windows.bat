@echo off
echo Installing VERSANT Backend Dependencies for Windows...
echo.

echo Step 1: Installing pipwin for Windows-specific packages...
python -m pip install pipwin

echo.
echo Step 2: Installing PyAudio using pipwin...
pipwin install pyaudio

echo.
echo Step 3: Installing remaining requirements...
python -m pip install -r requirements.txt

echo.
echo Installation complete! If you encounter any issues with PyAudio, try:
echo 1. Install Visual C++ Build Tools
echo 2. Or use: pip install pyaudio --only-binary=all
echo.
pause 