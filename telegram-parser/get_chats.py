"""
Утилита для получения списка доступных чатов из Telegram аккаунта
Использует существующую сессию railway_production без конфликтов
"""

import asyncio
import os
import json
import sys
from datetime import datetime
from telethon import TelegramClient
from dotenv import load_dotenv
import logging

# Импорт утилиты для работы с сессией
try:
    from session_helper import setup_session_from_env
except ImportError:
    print("⚠️ session_helper не найден, будет использована локальная сессия", file=sys.stderr)
    setup_session_from_env = None

# Загружаем переменные окружения
load_dotenv()

# Настройка логирования для stderr (чтобы не мешать JSON выводу)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr  # Логи в stderr, JSON в stdout
)
logger = logging.getLogger(__name__)

async def get_telegram_chats():
    """Получение списка всех доступных чатов из Telegram аккаунта"""
    
    # Telegram API данные
    api_id = os.getenv('TELEGRAM_API_ID')
    api_hash = os.getenv('TELEGRAM_API_HASH')
    
    if not api_id or not api_hash:
        logger.error("❌ TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть установлены в .env файле")
        return []
    
    # Используем Railway production сессию
    session_name = 'railway_production'
    session_file = f"{session_name}.session"
    
    # Проверяем наличие сессии
    if not os.path.exists(session_file):
        logger.error(f"❌ Файл сессии не найден: {session_file}")
        logger.info("💡 Попробуем создать из переменной окружения...")
        
        if setup_session_from_env:
            if not setup_session_from_env():
                logger.error("❌ Не удалось создать сессию")
                return []
        else:
            logger.error("❌ session_helper недоступен")
            return []
    
    client = None
    try:
        # Создаем клиент с очень коротким timeout для минимизации конфликтов
        client = TelegramClient(session_name, int(api_id), api_hash, 
                               connection_retries=1, retry_delay=1, timeout=10)
        
        logger.info("🔌 Подключаемся к Telegram...")
        await client.start()
        
        # Проверяем авторизацию
        me = await client.get_me()
        logger.info(f"✅ Подключен как: {me.first_name} (@{me.username})")
        
        chats = []
        chat_count = 0
        
        logger.info("📋 Получаем список чатов...")
        
        # Быстро получаем все диалоги
        async for dialog in client.iter_dialogs():
            if dialog.is_group or dialog.is_channel:
                chat_info = {
                    'id': str(dialog.id),
                    'title': dialog.title,
                    'participantsCount': getattr(dialog.entity, 'participants_count', 0),
                    'type': 'channel' if dialog.is_channel else 'supergroup',
                    'accessible': True,
                    'username': getattr(dialog.entity, 'username', None)
                }
                chats.append(chat_info)
                chat_count += 1
        
        logger.info(f"✅ Найдено {chat_count} чатов/каналов")
        return chats
        
    except Exception as e:
        logger.error(f"❌ Ошибка получения чатов: {e}")
        return []
    finally:
        if client:
            try:
                await client.disconnect()
                logger.info("🔌 Отключение от Telegram завершено")
            except Exception as e:
                logger.error(f"⚠️ Ошибка при отключении: {e}")

async def main():
    """Основная функция для вызова из Node.js"""
    try:
        chats = await get_telegram_chats()
        
        # Выводим результат в JSON формате в stdout
        print(json.dumps(chats, ensure_ascii=False, indent=2))
        
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
        print("[]")  # Возвращаем пустой массив в случае ошибки

if __name__ == "__main__":
    asyncio.run(main())