#!/bin/bash
echo "🔧 Установка зависимостей для Render..."

echo "� Устанавливаем Node.js зависимости..."
npm install

echo "🐍 Проверяем Python..."
python --version
which python

echo "🔧 Обновляем pip..."
python -m pip install --upgrade pip

echo "📦 Устанавливаем Python зависимости..."
pip install telethon==1.35.0
pip install python-dotenv==1.0.0

echo "✅ Проверяем установку..."
python -c "import telethon; print('✅ telethon установлен:', telethon.__version__)"
python -c "import dotenv; print('✅ python-dotenv установлен')"

echo "🎉 Все зависимости установлены успешно!"