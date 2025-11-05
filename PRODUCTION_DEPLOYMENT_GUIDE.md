# 🚀 AUTOLOGIST - Руководство по развертыванию в продакшене

## 📋 Описание системы
Autologist - это система для автоматического мониторинга и парсинга Telegram чатов с функциями:
- 🤖 Круглосуточный парсинг Telegram чатов
- 🔍 Поиск сообщений по ключевым словам  
- 📞 Извлечение номеров телефонов
- 🚫 Автоматическая фильтрация дубликатов
- 📨 Уведомления получателям по категориям
- 📊 Веб-интерфейс для управления и аналитики

## 🏗️ Архитектура системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FRONTEND      │    │    BACKEND      │    │  TELEGRAM       │
│   (React/Vite)  │◄──►│   (Node.js)     │◄──►│   PARSER        │
│   Port: 3000    │    │   Port: 3001    │    │   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────▼───────────────────────┘
                            ┌─────────────────┐
                            │   SUPABASE      │
                            │   DATABASE      │
                            │   (PostgreSQL)  │
                            └─────────────────┘
```

## 🔧 Требования к серверу

### Минимальные требования:
- **ОС**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: 2GB (рекомендуется 4GB)
- **CPU**: 2 ядра (рекомендуется 4 ядра)
- **Диск**: 20GB свободного места
- **Сеть**: Постоянное подключение к интернету

### Необходимое ПО:
- **Node.js** 18.0+ 
- **Python** 3.9+
- **Git**
- **PM2** (для управления процессами)
- **Nginx** (для проксирования)

## 📦 Шаг 1: Подготовка сервера

### Обновление системы:
```bash
sudo apt update && sudo apt upgrade -y
```

### Установка Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### Установка Python и pip:
```bash
sudo apt install -y python3 python3-pip python3-venv
```

### Установка PM2:
```bash
sudo npm install -g pm2
```

### Установка Nginx:
```bash
sudo apt install -y nginx
```

## 📥 Шаг 2: Клонирование проекта

```bash
cd /opt
sudo git clone https://github.com/kaganlugaru/autologist-microservices.git
sudo chown -R $USER:$USER autologist-microservices
cd autologist-microservices
```

## 🔑 Шаг 3: Настройка переменных окружения

### Создайте файл `.env` в папке `backend`:
```bash
cd backend
cp .env.example .env
nano .env
```

### Заполните переменные:
```env
# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Server Settings
PORT=3001
NODE_ENV=production

# Security
JWT_SECRET=your_jwt_secret_here
```

### Создайте файл `.env` в папке `telegram-parser`:
```bash
cd ../telegram-parser
cp .env.example .env
nano .env
```

### Заполните переменные Telegram:
```env
# Telegram API (получить на https://my.telegram.org)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE=+7XXXXXXXXXX

# Supabase Database (те же что в backend)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 💾 Шаг 4: Настройка базы данных

### Выполните SQL скрипты в Supabase:
1. Откройте Supabase Dashboard → SQL Editor
2. Выполните по очереди:
   - `database_setup.sql`
   - `create_duplicates_table_fixed.sql`
   - `create_duplicates_view.sql`
   - `update_keywords.sql`

## 📦 Шаг 5: Установка зависимостей

### Backend:
```bash
cd /opt/autologist-microservices/backend
npm install --production
```

### Frontend:
```bash
cd ../frontend
npm install
npm run build
```

### Telegram Parser:
```bash
cd ../telegram-parser
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## 🚀 Шаг 6: Настройка PM2

### Создайте конфигурационный файл PM2:
```bash
cd /opt/autologist-microservices
nano ecosystem.config.js
```

### Содержимое файла:
```javascript
module.exports = {
  apps: [
    {
      name: 'autologist-backend',
      script: './backend/server.js',
      cwd: '/opt/autologist-microservices',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log'
    },
    {
      name: 'telegram-parser',
      script: './telegram-parser/venv/bin/python',
      args: './telegram-parser/telegram_parser.py',
      cwd: '/opt/autologist-microservices',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/parser-error.log',
      out_file: './logs/parser-out.log',
      log_file: './logs/parser-combined.log'
    }
  ]
}
```

### Создайте папку для логов:
```bash
mkdir -p /opt/autologist-microservices/logs
```

## 🌐 Шаг 7: Настройка Nginx

### Создайте конфигурацию сайта:
```bash
sudo nano /etc/nginx/sites-available/autologist
```

### Содержимое файла:
```nginx
server {
    listen 80;
    server_name your_domain.com;  # замените на ваш домен
    
    # Frontend (статические файлы)
    location / {
        root /opt/autologist-microservices/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Кэширование статических файлов
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

### Активируйте конфигурацию:
```bash
sudo ln -s /etc/nginx/sites-available/autologist /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 Шаг 8: SSL сертификат (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

## ▶️ Шаг 9: Запуск системы

### Запуск через PM2:
```bash
cd /opt/autologist-microservices
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Проверка статуса:
```bash
pm2 status
pm2 logs
```

## 📊 Шаг 10: Мониторинг

### Установка PM2 Monitoring:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Проверка работы:
- Frontend: `http://your_domain.com`
- Backend API: `http://your_domain.com/api/status`
- Логи: `pm2 logs`

## 🔧 Управление системой

### Основные команды PM2:
```bash
# Статус всех процессов
pm2 status

# Просмотр логов
pm2 logs

# Перезапуск
pm2 restart all

# Остановка
pm2 stop all

# Просмотр логов конкретного процесса
pm2 logs autologist-backend
pm2 logs telegram-parser

# Мониторинг в реальном времени
pm2 monit
```

### Обновление проекта:
```bash
cd /opt/autologist-microservices
git pull origin main
cd backend && npm install --production
cd ../frontend && npm run build
pm2 restart all
```

## 🔍 Отладка и решение проблем

### Проверка портов:
```bash
netstat -tulnp | grep :3001
```

### Проверка логов:
```bash
# PM2 логи
pm2 logs --lines 100

# Nginx логи
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Системные логи
journalctl -u nginx -f
```

### Права доступа:
```bash
sudo chown -R $USER:$USER /opt/autologist-microservices
chmod +x /opt/autologist-microservices/telegram-parser/telegram_parser.py
```

## 🔄 Автоматическое обновление

### Создайте скрипт обновления:
```bash
nano /opt/autologist-microservices/update.sh
```

```bash
#!/bin/bash
cd /opt/autologist-microservices
git pull origin main
cd backend && npm install --production
cd ../frontend && npm run build
pm2 restart all
echo "✅ Обновление завершено"
```

```bash
chmod +x /opt/autologist-microservices/update.sh
```

## 🛡️ Безопасность

### Firewall (UFW):
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Регулярные обновления:
```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

## 📱 Первоначальная настройка Telegram

1. **Запустите парсер**: `pm2 start telegram-parser`
2. **Авторизация**: Парсер запросит код подтверждения из Telegram
3. **Ввод кода**: Код придет в ваш Telegram, введите его в консоль
4. **Готово**: Система начнет мониторинг чатов

## ✅ Готово!

Система Autologist настроена и готова к работе в режиме 24/7!

- **Веб-интерфейс**: https://your_domain.com
- **Управление**: Вкладка "Управление" 
- **Мониторинг**: `pm2 monit`
- **Логи**: `pm2 logs`

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `pm2 logs`
2. Проверьте статус: `pm2 status`
3. Проверьте конфигурацию Nginx: `sudo nginx -t`
4. Перезапустите сервисы: `pm2 restart all`