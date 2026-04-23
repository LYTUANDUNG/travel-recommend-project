@echo off
title Travel Project Control Center
color 0A

echo ======================================================
echo       DUNG LY TRAVEL PROJECT - AUTO STARTUP
echo ======================================================

:: 1. Start Docker containers in background
echo [+] Starting Database (MySQL 3307) and Redis (6379)...
docker-compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Docker desktop is not running. Please start Docker first!
    pause
    exit /b
)

:: 2. Start Python AI Service in a separate window
echo [+] Starting AI Service on port 8000...
start "AI Service (Python)" cmd /k "cd python_ai_service && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: 3. Start Frontend in a separate window
echo [+] Starting Frontend Development Server...
start "Frontend (React)" cmd /k "cd frontend && npm run dev"

echo.
echo ======================================================
echo   SYSTEMS ARE LAUNCHING...
echo ======================================================
echo   1. Docker (MySQL/Redis): Running in background
echo   2. AI Service: Running in new window (Port 8000)
echo   3. Frontend: Running in new window
echo.
echo   [!] REMINDER: Please start IntelliJ IDEA for the Java Backend.
echo   [!] TIPS: Run 'python python_ai_service/scripts/enrich_images.py'
echo       ONLY when you want to update images for new locations.
echo ======================================================
echo.
pause
