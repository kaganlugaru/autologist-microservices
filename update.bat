@echo off
REM 🚀 Скрипт автоматического обновления Autologist для Windows
REM Использование: update.bat

echo 🔄 Начинаем обновление Autologist...

REM Проверяем, что мы в правильной директории
if not exist "package.json" if not exist "backend" (
    echo ❌ Ошибка: запустите скрипт из корневой папки проекта
    pause
    exit /b 1
)

REM Останавливаем процессы
echo ⏸️ Останавливаем сервисы...
pm2 stop all

REM Получаем обновления из Git
echo 📥 Загружаем обновления из GitHub...
git pull origin main

if %errorlevel% neq 0 (
    echo ❌ Ошибка при загрузке обновлений
    echo 🔄 Запускаем сервисы обратно...
    pm2 start all
    pause
    exit /b 1
)

REM Обновляем зависимости backend
echo 📦 Обновляем зависимости backend...
cd backend
call npm install --production

if %errorlevel% neq 0 (
    echo ❌ Ошибка при установке зависимостей backend
    cd ..
    pm2 start all
    pause
    exit /b 1
)

REM Обновляем зависимости и собираем frontend
echo 🏗️ Собираем frontend...
cd ..\frontend
call npm install
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Ошибка при сборке frontend
    cd ..
    pm2 start all
    pause
    exit /b 1
)

REM Обновляем зависимости Python парсера
echo 🐍 Обновляем зависимости Python...
cd ..\telegram-parser
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo ⚠️ Предупреждение: ошибка при обновлении Python зависимостей
    )
) else (
    echo ⚠️ Виртуальное окружение Python не найдено
)

REM Возвращаемся в корневую папку
cd ..

REM Запускаем сервисы
echo ▶️ Запускаем обновленные сервисы...
pm2 start ecosystem.config.js

if %errorlevel% neq 0 (
    echo ❌ Ошибка при запуске сервисов
    pause
    exit /b 1
)

REM Сохраняем конфигурацию PM2
pm2 save

echo.
echo ✅ Обновление завершено успешно!
echo.
echo 📊 Статус сервисов:
pm2 status

echo.
echo 📝 Для просмотра логов используйте:
echo    pm2 logs
echo.
echo 🌐 Система доступна по адресу:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:3001/api/status
echo.

pause