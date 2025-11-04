@echo off
chcp 65001 >nul
echo Starting Autologist Microservices...
echo ===================================

cd /d "C:\Users\bauto\OneDrive\Документы\autologist-microservices"

echo.
echo 1. Starting Backend Server...
start "Backend Server" cmd /k "cd backend && node server.js"
timeout /t 3 /nobreak >nul

echo.
echo 2. Starting Frontend Client...
start "Frontend Client" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo 3. Starting Telegram Parser...
start "Telegram Parser" cmd /k "cd telegram-parser && python telegram_parser.py"
timeout /t 2 /nobreak >nul

echo.
echo ===================================
echo ALL SERVICES STARTED!
echo ===================================
echo Dashboard: http://localhost:5173
echo Backend API: http://localhost:3001
echo Telegram Parser: Active
echo.
echo Press any key to close this window...
pause >nul