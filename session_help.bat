@echo off
REM Краткая справка по управлению сессиями

echo.
echo ===============================================
echo 🔧 TELEGRAM СЕССИИ - КРАТКАЯ СПРАВКА
echo ===============================================
echo.
echo 📊 ТЕКУЩЕЕ СОСТОЯНИЕ:
findstr "RAILWAY_ENVIRONMENT" .env
echo.

if exist "local_development.session" (
    echo [✓] local_development.session - ЕСТЬ
) else (
    echo [✗] local_development.session - НЕТ
)

if exist "railway_production.session" (
    echo [✓] railway_production.session - ЕСТЬ  
) else (
    echo [✗] railway_production.session - НЕТ
)

echo.
echo 🛠️ ДОСТУПНЫЕ КОМАНДЫ:
echo.
echo python session_manager.py          - Полный менеджер сессий
echo switch_session.bat                 - Быстрое переключение
echo set_railway_production.bat         - Настройка Railway
echo.
echo 📖 ДОКУМЕНТАЦИЯ:
echo SESSION_MANAGEMENT.md              - Полная документация
echo.
echo ⚠️ ВАЖНО: После изменения настроек Railway
echo нужно подождать 10-15 минут для применения
echo.
pause