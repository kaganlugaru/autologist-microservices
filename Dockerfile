# Multi-stage Dockerfile для Node.js + Python
FROM python:3.10-slim as python-base

# Устанавливаем Python зависимости
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Основной образ с Node.js
FROM node:18-slim

# Копируем Python из первого образа
COPY --from=python-base /usr/local /usr/local

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json
COPY package*.json ./

# Устанавливаем Node.js зависимости
RUN npm install --only=production

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 3000

# Запуск приложения
CMD ["npm", "start"]