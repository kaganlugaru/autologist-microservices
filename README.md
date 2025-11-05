# 🤖 Autologist - Система анализа сообщений автосервиса# 🚀 Autologist Microservices# 🚀 Autologist Microservices



## 📋 Описание

Комплексная система микросервисов для автоматического анализа и обработки сообщений клиентов автосервиса через Telegram и WhatsApp с интеллектуальной аналитикой.

> Автоматизированная система мониторинга и анализа Telegram сообщений с веб-интерфейсом> Автоматизированная система мониторинга и анализа Telegram сообщений с веб-интерфейсом

## 🏗️ Архитектура системы

```

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐

│   🖥️ Frontend   │    │   ⚙️ Backend    │    │  🗄️ Database   │## 📋 Описание## 📋 Описание

│   React SPA     │◄──►│   Node.js API   │◄──►│   PostgreSQL    │

│   Port: 3000    │    │   Port: 3001    │    │   (Supabase)    │

└─────────────────┘    └─────────────────┘    └─────────────────┘

         ▲                       ▲Autologist - это микросервисная система для:Autologist - это микросервисная система для:

         │                       │

         ▼                       ▼- 📱 **Мониторинга Telegram чатов** в реальном времени- 📱 **Мониторинга Telegram чатов** в реальном времени

┌─────────────────┐    ┌─────────────────┐

│ 📱 Telegram     │    │ 💬 WhatsApp     │- 🔍 **Фильтрации сообщений** по ключевым словам- 🔍 **Фильтрации сообщений** по ключевым словам

│ Parser (Python) │    │ Parser (Python) │

│ 24/7 мониторинг │    │ 24/7 мониторинг │- 📊 **Анализа и статистики** сообщений- � **Анализа и статистики** сообщений

└─────────────────┘    └─────────────────┘

```- 🌐 **Веб-интерфейса** для управления и просмотра- 🌐 **Веб-интерфейса** для управления и просмотра



## ✨ Ключевые возможности- 🔔 **Уведомлений** важных сообщений- 🔔 **Уведомлений** важных сообщений

- 🔄 **Реальное время**: Автоматическая обработка сообщений 24/7

- 📊 **Аналитика**: Детальная статистика и метрики

- 🎯 **Умная фильтрация**: Определение типов запросов и приоритетов

- 📱 **Мульти-платформа**: Поддержка Telegram и WhatsApp## 🏗️ Архитектура## 🏗️ Архитектура

- 🚀 **Автоматизация**: Рассылка уведомлений и ответов

- 🔒 **Безопасность**: Защищенное хранение данных



## 🚀 Быстрый старт``````



### Системные требования┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐

- **Node.js** 18+ 

- **Python** 3.8+│   Frontend      │    │    Backend      │    │ Telegram Parser ││   Frontend      │    │    Backend      │    │ Telegram Parser │

- **Git** для версий

- **PM2** для продакшена│   React + Vite  │◄──►│   Node.js API   │◄──►│     Python      ││   React + Vite  │◄──►│   Node.js API   │◄──►│     Python      │



### 1️⃣ Установка│   Port: 5173    │    │   Port: 3001    │    │   Background    ││   Port: 5173    │    │   Port: 3001    │    │   Background    │

```bash

# Клонируем репозиторий└─────────────────┘    └─────────────────┘    └─────────────────┘└─────────────────┘    └─────────────────┘    └─────────────────┘

git clone https://github.com/your-repo/autologist-microservices.git

cd autologist-microservices          │                       │                       │          │                       │                       │



# Устанавливаем зависимости всех сервисов          └───────────────────────┼───────────────────────┘          └───────────────────────┼───────────────────────┘

npm run install:all

```                                  ▼                                  ▼



### 2️⃣ Конфигурация                          ┌─────────────────┐                          ┌─────────────────┐

```bash

# Копируем примеры конфигураций                          │ Supabase DB     │                          │ Supabase DB     │

cp backend/.env.example backend/.env

cp telegram-parser/.env.example telegram-parser/.env                          │ Cloud Database  │                          │ Cloud Database  │



# Редактируем настройки базы данных и API ключи                          └─────────────────┘                          └─────────────────┘

# backend/.env - настройки Supabase

# telegram-parser/.env - токены Telegram``````

```



### 3️⃣ Запуск для разработки

```bash## ⚡ Быстрый старт## ⚡ Быстрый старт

# Запускаем все сервисы одновременно

npm run dev



# Или каждый сервис отдельно:### Автоматический запуск (рекомендуется):### Автоматический запуск (рекомендуется):

npm run dev:frontend   # http://localhost:3000

npm run dev:backend    # http://localhost:3001```bash```bash

npm run dev:parser     # Python скрипт

```# Запустить все сервисы# Запустить все сервисы



### 4️⃣ Запуск в продакшенеSTART.batSTART.bat

```bash

# Устанавливаем PM2 глобально

npm install -g pm2

# Проверить статус# Проверить статус

# Запускаем все сервисы через PM2

pm2 start ecosystem.config.jsSTATUS.batSTATUS.bat



# Сохраняем конфигурацию для автозапуска

pm2 save

pm2 startup# Остановить все сервисы# Остановить все сервисы

```

STOP.batSTOP.bat

## 🛠️ Управление системой

``````

### Быстрые команды (Windows)

```bash

# Мониторинг системы

monitor.bat### Ручной запуск:### Ручной запуск:



# Автоматическое обновление```bash```bash

update.bat

# Backend# Backend

# Просмотр логов

pm2 logscd backend && npm startcd backend && npm start



# Статус сервисов

pm2 status

```# Frontend  # Frontend  



### Основные URLcd frontend && npm run devcd frontend && npm run dev

- **Панель управления**: http://localhost:3000

- **API документация**: http://localhost:3001/api/status

- **Мониторинг PM2**: `pm2 monit`

# Telegram Parser# Telegram Parser

## 📁 Структура проекта

```cd telegram-parser && python telegram_parser.pycd telegram-parser && python telegram_parser.py

autologist-microservices/

├── 🖥️ frontend/          # React приложение``````

│   ├── src/components/   # Компоненты интерфейса

│   ├── src/styles/       # CSS стили

│   └── public/           # Статические файлы

├── ⚙️ backend/           # Node.js API сервер## 🌐 Доступ к системе## 🌐 Доступ к системе

│   ├── routes/           # API маршруты

│   ├── middleware/       # Промежуточное ПО

│   └── utils/            # Утилиты

├── 📱 telegram-parser/   # Python парсер TelegramПосле запуска доступно:После запуска доступно:

│   ├── parsers/          # Логика парсинга

│   ├── utils/            # Вспомогательные функции- **🖥️ Dashboard**: http://localhost:5173- **🖥️ Dashboard**: http://localhost:5173

│   └── requirements.txt  # Python зависимости

├── 💬 whatsapp-parser/   # Python парсер WhatsApp- **🔧 API**: http://localhost:3001- **🔧 API**: http://localhost:3001

├── 🗄️ shared/            # Общие компоненты

│   └── database.js       # Подключение к БД- **📱 Parser**: Работает в фоне- **📱 Parser**: Работает в фоне

├── 📋 ecosystem.config.js # Конфигурация PM2

├── 🔧 update.bat         # Скрипт обновления

├── 📊 monitor.bat        # Монитор системы

└── 📚 docs/              # Документация## 🛠️ Технологии## 🛠️ Технологии

```



## 🔧 Конфигурация

### Frontend:### Frontend:

### Backend (.env)

```env- **React 19** - UI библиотека- **React 19** - UI библиотека

# Supabase конфигурация

SUPABASE_URL=your_supabase_url- **Vite** - Сборщик и dev-сервер- **Vite** - Сборщик и dev-сервер

SUPABASE_ANON_KEY=your_anon_key

PORT=3001- **Axios** - HTTP клиент- **Axios** - HTTP клиент

NODE_ENV=production

```- **Recharts** - Графики и аналитика- **Recharts** - Графики и аналитика



### Telegram Parser (.env)

```env

# Telegram API### Backend:### Backend:

TELEGRAM_API_ID=your_api_id

TELEGRAM_API_HASH=your_api_hash- **Node.js** - Runtime- **Node.js** - Runtime

TELEGRAM_PHONE=your_phone_number

- **Express** - Web framework- **Express** - Web framework

# Database

DATABASE_URL=your_database_url- **Supabase** - Cloud база данных- **Supabase** - Cloud база данных

```

- **CORS** - Cross-origin requests- **CORS** - Cross-origin requests

## 📊 Мониторинг и логи



### PM2 мониторинг

```bash### Parser:### Parser:

# Просмотр статуса всех процессов

pm2 status- **Python 3** - Основной язык- **Python 3** - Основной язык



# Мониторинг в реальном времени- **Telethon** - Telegram клиент- **Telethon** - Telegram клиент

pm2 monit

- **Supabase Python** - Клиент БД- **Supabase Python** - Клиент БД

# Просмотр логов

pm2 logs [service_name]



# Перезапуск сервиса## 📁 Структура проекта## 📁 Структура проекта

pm2 restart [service_name]

```



### Логи системы``````

- **Backend**: `~/.pm2/logs/autologist-backend-*.log`

- **Parser**: `~/.pm2/logs/telegram-parser-*.log`autologist-microservices/autologist-microservices/

- **Errors**: `~/.pm2/logs/*-error.log`

├── 🚀 START.bat              # Автозапуск всех сервисов├── 🚀 START.bat              # Автозапуск всех сервисов

## 🚨 Устранение проблем

├── 🛑 STOP.bat               # Остановка всех сервисов  ├── 🛑 STOP.bat               # Остановка всех сервисов  

### Частые проблемы

1. **Порт 3000/3001 занят**: Проверьте `netstat -an | find "3000"`├── 📊 STATUS.bat             # Проверка статуса├── 📊 STATUS.bat             # Проверка статуса

2. **PM2 не запускается**: Переустановите `npm install -g pm2`

3. **Python ошибки**: Проверьте виртуальное окружение `venv`├── ├── 

4. **База данных недоступна**: Проверьте настройки Supabase

├── backend/                  # 🔧 Node.js API сервер├── backend/                  # 🔧 Node.js API сервер

### Диагностика

```bash│   ├── server.js│   ├── server.js

# Проверка системы

node --version│   ├── package.json│   ├── package.json

python --version

pm2 --version│   └── .env│   └── .env



# Тест подключения к БД├── ├── 

npm run test:db

├── frontend/                 # 🌐 React интерфейс├── frontend/                 # 🌐 React интерфейс

# Проверка API

curl http://localhost:3001/api/status│   ├── src/│   ├── src/

```

│   ├── package.json│   ├── package.json

## 🔄 Обновление системы

│   └── vite.config.js│   └── vite.config.js

### Автоматическое обновление

```bash├── ├── 

# Запускаем скрипт обновления

./update.bat├── telegram-parser/          # 📱 Python парсер├── telegram-parser/          # 📱 Python парсер

```

│   ├── telegram_parser.py│   ├── telegram_parser.py

### Ручное обновление

```bash│   └── .env│   └── .env

# Останавливаем сервисы

pm2 stop all└── └── 



# Получаем обновления└── shared/                   # 🔗 Общие компоненты└── shared/                   # 🔗 Общие компоненты

git pull origin main

    └── database.js    └── database.js

# Обновляем зависимости

npm install --production``````



# Запускаем сервисы

pm2 start ecosystem.config.js

```## ⚙️ Настройка## ⚙️ Настройка



## 📚 Документация

- **Техническая документация**: `TECHNICAL_DOCS.md`

- **Руководство по развертыванию**: `PRODUCTION_DEPLOYMENT_GUIDE.md`### 1. Supabase:### 1. Supabase:

- **API документация**: `backend/API_DOCS.md`

- Создайте проект на [supabase.com](https://supabase.com)- Создайте проект на [supabase.com](https://supabase.com)

## 🤝 Поддержка

Для получения помощи:- Получите URL и API ключи- Получите URL и API ключи

1. Проверьте логи: `pm2 logs`

2. Запустите диагностику: `monitor.bat`- Выполните SQL миграции из `setup_database.sql`- Выполните SQL миграции из `setup_database.sql`

3. Изучите документацию в папке `docs/`



---

🚀 **Autologist** - Автоматизация работы с клиентами автосервиса### 2. Переменные окружения:### 2. Переменные окружения:

```bash```bash

# backend/.env# backend/.env

SUPABASE_URL=your_urlSUPABASE_URL=your_url

SUPABASE_SERVICE_ROLE_KEY=your_keySUPABASE_SERVICE_ROLE_KEY=your_key

PORT=3001PORT=3001



# telegram-parser/.env  # telegram-parser/.env  

SUPABASE_URL=your_urlSUPABASE_URL=your_url

SUPABASE_SERVICE_ROLE_KEY=your_keySUPABASE_SERVICE_ROLE_KEY=your_key

TELEGRAM_API_ID=your_idTELEGRAM_API_ID=your_id

TELEGRAM_API_HASH=your_hashTELEGRAM_API_HASH=your_hash

``````



### 3. Установка зависимостей:### 3. Установка зависимостей:

```bash```bash

# Backend# Backend

cd backend && npm installcd backend && npm install



# Frontend# Frontend

cd frontend && npm installcd frontend && npm install



# Python зависимости# Python зависимости

pip install telethon supabase python-dotenvpip install telethon supabase python-dotenv

``````



## 🔧 Функции## 🔧 Функции



### ✅ Реализованные:### ✅ Реализованные:

- 📱 **Telegram мониторинг** - Отслеживание 7+ чатов- 📱 **Telegram мониторинг** - Отслеживание 7+ чатов

- 🔍 **Фильтрация** - По ключевым словам- 🔍 **Фильтрация** - По ключевым словам

- 👤 **Контакты** - Кликабельные имена, WhatsApp/Telegram кнопки- 👤 **Контакты** - Кликабельные имена, WhatsApp/Telegram кнопки

- 📊 **Статистика** - Графики и аналитика- 📊 **Статистика** - Графики и аналитика

- 🚀 **Автозапуск** - Одной командой- � **Автозапуск** - Одной командой

- 💾 **База данных** - Сохранение всех сообщений- 💾 **База данных** - Сохранение всех сообщений

- 🌐 **Веб-интерфейс** - Компактный дизайн- 🌐 **Веб-интерфейс** - Компактный дизайн

2. **Backend** ✅ - создан и готов к тестированию

### 🔄 В разработке:3. **Telegram Parser** ⏳ - следующий этап

- 🔔 Система уведомлений4. **Frontend** ⏳ - веб-интерфейс

- 📧 Email интеграция5. **WhatsApp Parser** ⏳ - парсер WhatsApp

- 📈 Расширенная аналитика6. **Announcer** ⏳ - сервис рассылки



## 🐛 Устранение проблем## 📚 Документация



### Порты заняты:- [TECHNICAL_DOCS.md](TECHNICAL_DOCS.md) - Полная техническая спецификация

```bash- [новичек.instructions.md](новичек.instructions.md) - Инструкции для новичка

STOP.bat && START.bat

```## 🛠️ Технологии



### Python ошибки:- **Backend**: Node.js + Express

```bash- **База данных**: Supabase (PostgreSQL)

pip install --upgrade telethon supabase- **Парсер Telegram**: Python + Telethon

```- **Парсер WhatsApp**: Node.js + whatsapp-web.js

- **Frontend**: React + Vite

### Node.js ошибки:- **ИИ**: DeepSeek, Hugging Face, Google Gemini, GPT-3.5

```bash

cd backend && npm install## 📊 Статус разработки

cd frontend && npm install

```- [x] Создать структуру проекта

- [x] Настроить базу данных

## 📄 Лицензия- [x] Создать Backend API

- [ ] Настроить Telegram Parser

MIT License - свободное использование для личных и коммерческих проектов.- [ ] Создать Frontend

- [ ] Настроить WhatsApp Parser

## 🤝 Вклад в проект- [ ] Создать сервис рассылки

- [ ] Интеграция и тестирование

Пул-реквесты приветствуются! Для больших изменений откройте issue для обсуждения.

---

---

*Для работы с этим проектом откройте папку `autologist-microservices` в VS Code и запустите GitHub Copilot для получения помощи.*

🎯 **Система готова к использованию!** Запустите `START.bat` и откройте http://localhost:5173- **Telegram Parser:** Python + Telethon
- **WhatsApp Parser:** Node.js + whatsapp-web.js
- **Frontend:** React + Vite + Tailwind CSS
- **Хостинг:** Railway + Vercel
- **ИИ:** DeepSeek, Hugging Face, GPT-3.5

## Быстрый старт

1. Настройте базу данных в Supabase
2. Создайте .env файлы в каждом микросервисе
3. Установите зависимости в каждой папке
4. Запустите микросервисы

Подробные инструкции смотрите в README каждого микросервиса.