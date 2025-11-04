@echo off
chcp 65001 >nul
echo Stopping Autologist Microservices...
echo ====================================

echo.
echo Stopping Node.js processes (Backend/Frontend)...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo Node.js processes stopped
) else (
    echo No Node.js processes found
)

echo.
echo Stopping Python processes (Telegram Parser)...
taskkill /f /im python.exe >nul 2>&1
if %errorlevel% == 0 (
    echo Python processes stopped
) else (
    echo No Python processes found
)

echo.
echo Stopping NPM processes...
taskkill /f /im npm.exe >nul 2>&1

echo.
echo ====================================
echo ALL SERVICES STOPPED!
echo ====================================
echo.
echo Press any key to close this window...
pause >nul