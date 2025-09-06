Write-Host "Installing VERSANT Backend Dependencies for Windows..." -ForegroundColor Green
Write-Host ""

Write-Host "Step 1: Installing pipwin for Windows-specific packages..." -ForegroundColor Yellow
python -m pip install pipwin

Write-Host ""
Write-Host "Step 2: Installing PyAudio using pipwin..." -ForegroundColor Yellow
pipwin install pyaudio

Write-Host ""
Write-Host "Step 3: Installing remaining requirements..." -ForegroundColor Yellow
python -m pip install -r requirements.txt

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "If you encounter any issues with PyAudio, try:" -ForegroundColor Cyan
Write-Host "1. Install Visual C++ Build Tools" -ForegroundColor White
Write-Host "2. Or use: pip install pyaudio --only-binary=all" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue" 