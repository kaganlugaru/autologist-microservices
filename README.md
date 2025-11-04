# 🚀 Autologist Microservices# 🚀 Autologist Microservices



> Автоматизированная система мониторинга и анализа Telegram сообщений с веб-интерфейсом> Автоматизированная система мониторинга и анализа Telegram сообщений с веб-интерфейсом



## 📋 Описание## 📋 Описание



Autologist - это микросервисная система для:Autologist - это микросервисная система для:

- 📱 **Мониторинга Telegram чатов** в реальном времени- 📱 **Мониторинга Telegram чатов** в реальном времени

- 🔍 **Фильтрации сообщений** по ключевым словам- 🔍 **Фильтрации сообщений** по ключевым словам

- 📊 **Анализа и статистики** сообщений- � **Анализа и статистики** сообщений

- 🌐 **Веб-интерфейса** для управления и просмотра- 🌐 **Веб-интерфейса** для управления и просмотра

- 🔔 **Уведомлений** важных сообщений- 🔔 **Уведомлений** важных сообщений



## 🏗️ Архитектура## 🏗️ Архитектура



``````

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐

│   Frontend      │    │    Backend      │    │ Telegram Parser ││   Frontend      │    │    Backend      │    │ Telegram Parser │

│   React + Vite  │◄──►│   Node.js API   │◄──►│     Python      ││   React + Vite  │◄──►│   Node.js API   │◄──►│     Python      │

│   Port: 5173    │    │   Port: 3001    │    │   Background    ││   Port: 5173    │    │   Port: 3001    │    │   Background    │

└─────────────────┘    └─────────────────┘    └─────────────────┘└─────────────────┘    └─────────────────┘    └─────────────────┘

          │                       │                       │          │                       │                       │

          └───────────────────────┼───────────────────────┘          └───────────────────────┼───────────────────────┘

                                  ▼                                  ▼

                          ┌─────────────────┐                          ┌─────────────────┐

                          │ Supabase DB     │                          │ Supabase DB     │

                          │ Cloud Database  │                          │ Cloud Database  │

                          └─────────────────┘                          └─────────────────┘

``````



## ⚡ Быстрый старт## ⚡ Быстрый старт



### Автоматический запуск (рекомендуется):### Автоматический запуск (рекомендуется):

```bash```bash

# Запустить все сервисы# Запустить все сервисы

START.batSTART.bat



# Проверить статус# Проверить статус

STATUS.batSTATUS.bat



# Остановить все сервисы# Остановить все сервисы

STOP.batSTOP.bat

``````



### Ручной запуск:### Ручной запуск:

```bash```bash

# Backend# Backend

cd backend && npm startcd backend && npm start



# Frontend  # Frontend  

cd frontend && npm run devcd frontend && npm run dev



# Telegram Parser# Telegram Parser

cd telegram-parser && python telegram_parser.pycd telegram-parser && python telegram_parser.py

``````



## 🌐 Доступ к системе## 🌐 Доступ к системе



После запуска доступно:После запуска доступно:

- **🖥️ Dashboard**: http://localhost:5173- **🖥️ Dashboard**: http://localhost:5173

- **🔧 API**: http://localhost:3001- **🔧 API**: http://localhost:3001

- **📱 Parser**: Работает в фоне- **📱 Parser**: Работает в фоне



## 🛠️ Технологии## 🛠️ Технологии



### Frontend:### Frontend:

- **React 19** - UI библиотека- **React 19** - UI библиотека

- **Vite** - Сборщик и dev-сервер- **Vite** - Сборщик и dev-сервер

- **Axios** - HTTP клиент- **Axios** - HTTP клиент

- **Recharts** - Графики и аналитика- **Recharts** - Графики и аналитика



### Backend:### Backend:

- **Node.js** - Runtime- **Node.js** - Runtime

- **Express** - Web framework- **Express** - Web framework

- **Supabase** - Cloud база данных- **Supabase** - Cloud база данных

- **CORS** - Cross-origin requests- **CORS** - Cross-origin requests



### Parser:### Parser:

- **Python 3** - Основной язык- **Python 3** - Основной язык

- **Telethon** - Telegram клиент- **Telethon** - Telegram клиент

- **Supabase Python** - Клиент БД- **Supabase Python** - Клиент БД



## 📁 Структура проекта## 📁 Структура проекта



``````

autologist-microservices/autologist-microservices/

├── 🚀 START.bat              # Автозапуск всех сервисов├── 🚀 START.bat              # Автозапуск всех сервисов

├── 🛑 STOP.bat               # Остановка всех сервисов  ├── 🛑 STOP.bat               # Остановка всех сервисов  

├── 📊 STATUS.bat             # Проверка статуса├── 📊 STATUS.bat             # Проверка статуса

├── ├── 

├── backend/                  # 🔧 Node.js API сервер├── backend/                  # 🔧 Node.js API сервер

│   ├── server.js│   ├── server.js

│   ├── package.json│   ├── package.json

│   └── .env│   └── .env

├── ├── 

├── frontend/                 # 🌐 React интерфейс├── frontend/                 # 🌐 React интерфейс

│   ├── src/│   ├── src/

│   ├── package.json│   ├── package.json

│   └── vite.config.js│   └── vite.config.js

├── ├── 

├── telegram-parser/          # 📱 Python парсер├── telegram-parser/          # 📱 Python парсер

│   ├── telegram_parser.py│   ├── telegram_parser.py

│   └── .env│   └── .env

└── └── 

└── shared/                   # 🔗 Общие компоненты└── shared/                   # 🔗 Общие компоненты

    └── database.js    └── database.js

``````



## ⚙️ Настройка## ⚙️ Настройка



### 1. Supabase:### 1. Supabase:

- Создайте проект на [supabase.com](https://supabase.com)- Создайте проект на [supabase.com](https://supabase.com)

- Получите URL и API ключи- Получите URL и API ключи

- Выполните SQL миграции из `setup_database.sql`- Выполните SQL миграции из `setup_database.sql`



### 2. Переменные окружения:### 2. Переменные окружения:

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