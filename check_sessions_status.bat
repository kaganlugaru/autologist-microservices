@echo off
REM Проверка статуса Railway и локальных сессий

echo.
echo ===============================================
echo 📊 ПРОВЕРКА СТАТУСА СЕССИЙ
echo ===============================================
echo.

echo 🔍 ЛОКАЛЬНАЯ КОНФИГУРАЦИЯ:
findstr "RAILWAY_ENVIRONMENT" .env
echo.

echo 📁 ФАЙЛЫ СЕССИЙ:
if exist "local_development.session" (
    for %%F in (local_development.session) do echo [✓] local_development.session - %%~zF байт
) else (
    echo [✗] local_development.session - НЕТ
)

if exist "railway_production.session" (
    for %%F in (railway_production.session) do echo [✓] railway_production.session - %%~zF байт
) else (
    echo [✗] railway_production.session - НЕТ
)

echo.
echo 🎯 ОЖИДАЕМАЯ КОНФИГУРАЦИЯ:
echo ┌─────────────────┬─────────────────────────────┐
echo │ ОКРУЖЕНИЕ       │ ИСПОЛЬЗУЕМАЯ СЕССИЯ         │
echo ├─────────────────┼─────────────────────────────┤
echo │ Локально        │ local_development.session  │
echo │ Railway         │ railway_production.session │
echo └─────────────────┴─────────────────────────────┘
echo.

echo ⚠️ ЕСЛИ RAILWAY ЕЩЕ НЕ НАСТРОЕН:
echo 1. Добавить в Railway: RAILWAY_ENVIRONMENT=production
echo 2. Перезапустить Railway сервис
echo 3. Подождать 5-10 минут
echo.

echo 🧪 ПРОВЕРИТЬ РАБОТУ:
echo python session_manager.py     - Управление сессиями
echo cd telegram-parser ^& python telegram_parser.py - Тест парсера
echo.
pause