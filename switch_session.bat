@echo off
REM Скрипт для переключения между локальными и Railway сессиями

echo =================================
echo УПРАВЛЕНИЕ СЕССИЯМИ TELEGRAM
echo =================================
echo.
echo Текущее состояние:
echo.

REM Проверяем какие сессии есть
if exist "local_development.session" (
    echo [+] local_development.session - ЕСТЬ
) else (
    echo [-] local_development.session - НЕТ
)

if exist "railway_production.session" (
    echo [+] railway_production.session - ЕСТЬ
) else (
    echo [-] railway_production.session - НЕТ
)

echo.
echo Доступные команды:
echo 1 - Переключить на ЛОКАЛЬНУЮ разработку
echo 2 - Переключить на RAILWAY продакшн
echo 3 - Показать текущую конфигурацию
echo 4 - Выход
echo.

set /p choice="Выберите действие (1-4): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto railway
if "%choice%"=="3" goto show_config
if "%choice%"=="4" goto end

:local
echo.
echo ==============================
echo НАСТРОЙКА ЛОКАЛЬНОЙ РАЗРАБОТКИ
echo ==============================
powershell -Command "(Get-Content .env) -replace 'RAILWAY_ENVIRONMENT=production', 'RAILWAY_ENVIRONMENT=development' | Set-Content .env"
echo [+] Переключено на локальную разработку
echo [+] Будет использоваться: local_development.session
goto end

:railway
echo.
echo =============================
echo НАСТРОЙКА RAILWAY ПРОДАКШН
echo =============================
powershell -Command "(Get-Content .env) -replace 'RAILWAY_ENVIRONMENT=development', 'RAILWAY_ENVIRONMENT=production' | Set-Content .env"
echo [+] Переключено на Railway продакшн  
echo [+] Будет использоваться: railway_production.session
goto end

:show_config
echo.
echo ===================
echo ТЕКУЩАЯ КОНФИГУРАЦИЯ
echo ===================
findstr "RAILWAY_ENVIRONMENT" .env
echo.
goto end

:end
echo.
pause