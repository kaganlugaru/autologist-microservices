@echo off
REM Переключение на Production режим для Railway

echo =============================================
echo ПЕРЕКЛЮЧЕНИЕ НА RAILWAY PRODUCTION РЕЖИМ
echo =============================================
echo.

echo [1] Текущая настройка:
findstr "RAILWAY_ENVIRONMENT" .env
echo.

echo [2] Переключаем на production...
powershell -Command "(Get-Content .env) -replace 'RAILWAY_ENVIRONMENT=development', 'RAILWAY_ENVIRONMENT=production' | Set-Content .env"
echo.

echo [3] Новая настройка:
findstr "RAILWAY_ENVIRONMENT" .env
echo.

echo [+] ГОТОВО: Railway будет использовать railway_production.session
echo [+] Локально: продолжит использовать local_development.session
echo.
echo =============================================
echo ИНСТРУКЦИЯ:
echo 1. Скопируйте railway_production.session на Railway
echo 2. Перезапустите сервис на Railway
echo 3. Локально можете запускать без конфликтов
echo =============================================
pause