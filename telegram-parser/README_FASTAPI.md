# FastAPI API для Telegram Parser

## Запуск сервера

1. Убедитесь, что все переменные окружения (.env) настроены:
   - TELEGRAM_API_ID
   - TELEGRAM_API_HASH
   - TELEGRAM_PHONE
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
2. Установите зависимости:
   ```bash
   pip install fastapi uvicorn telethon supabase python-dotenv
   ```
3. Запустите сервер:
   ```bash
   cd telegram-parser
   python api_server.py
   ```

## Эндпоинты

### POST /api/update-chats
- Останавливает мониторинг, обновляет список чатов, записывает в Supabase, запускает мониторинг.
- Возвращает статус и список чатов.

## Автоматическое обновление
- Парсер периодически обновляет список чатов из Supabase (по умолчанию раз в минуту).

## Интеграция с backend
- Для обновления чатов отправьте POST-запрос на http://<адрес_сервера>:8000/api/update-chats

---

**Вопросы и пояснения — см. комментарии в коде или обращайтесь!**
