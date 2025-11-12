"""
Автоматическое восстановление session-файла из переменной окружения Railway

- Переменная окружения: TELEGRAM_SESSION_BASE64
- Восстанавливает файл railway_production.session
- Безопасно: session-файл не хранится в репозитории
"""
import os
import base64

SESSION_ENV = 'TELEGRAM_SESSION_BASE64'
SESSION_FILE = 'railway_production.session'

base64_data = os.getenv(SESSION_ENV)
if not base64_data:
    raise RuntimeError(f"Переменная окружения {SESSION_ENV} не найдена!")

with open(SESSION_FILE, 'wb') as f:
    f.write(base64.b64decode(base64_data))

print(f"Session-файл {SESSION_FILE} успешно восстановлен из переменной окружения.")
