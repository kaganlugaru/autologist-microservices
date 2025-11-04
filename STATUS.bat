@echo off
chcp 65001 >nul
echo Checking Autologist Services Status...
echo ====================================

echo.
echo Checking Node.js processes (Backend/Frontend)...
tasklist /fi "imagename eq node.exe" 2>nul | find /i "node.exe" >nul
if %errorlevel% == 0 (
    echo [RUNNING] Node.js services are active
) else (
    echo [STOPPED] Node.js services not found
)

echo.
echo Checking Python processes (Telegram Parser)...
tasklist /fi "imagename eq python.exe" 2>nul | find /i "python.exe" >nul
if %errorlevel% == 0 (
    echo [RUNNING] Python services are active
) else (
    echo [STOPPED] Python services not found
)

echo.
echo Checking ports...
netstat -an | find ":5173" >nul
if %errorlevel% == 0 (
    echo [ACTIVE] Port 5173 - Frontend
) else (
    echo [INACTIVE] Port 5173 - Frontend
)

netstat -an | find ":3001" >nul
if %errorlevel% == 0 (
    echo [ACTIVE] Port 3001 - Backend
) else (
    echo [INACTIVE] Port 3001 - Backend
)

echo.
echo ====================================
echo STATUS CHECK COMPLETED
echo ====================================
echo.
pause