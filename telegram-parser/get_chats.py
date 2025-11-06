"""
Утилита для получения списка доступных чатов из Telegram аккаунта
Использует существующую сессию railway_production без конфликтов
"""

import asyncio
import os
import json
import sys
import traceback
import glob
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
    
    # Ищем доступные сессии (в порядке приоритета)
    session_candidates = [
        'railway_production',  # Railway production
        '../railway_production',  # Из корня проекта
        'autologist_session',  # Старая сессия
        '../autologist_session',  # Из корня
        'local_development'    # Локальная разработка
    ]
    
    session_name = None
    session_file = None
    
    for candidate in session_candidates:
        test_file = f"{candidate}.session"
        if os.path.exists(test_file):
            session_name = candidate
            session_file = test_file
            logger.info(f"✅ Найдена сессия: {session_file}")
            break
    
    if not session_name:
        logger.error("❌ Не найдено ни одной сессии Telegram")
        logger.info("💡 Доступные варианты: railway_production.session, autologist_session.session")
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
        logger.info("🚀 ================================")
        logger.info("🚀 PYTHON: Скрипт get_chats.py запущен")
        logger.info("🚀 ================================")
        logger.info(f"📅 Время: {datetime.now()}")
        logger.info(f"📂 Рабочая папка: {os.getcwd()}")
        logger.info(f"🐍 Python версия: {sys.version}")
        
        # Проверяем переменные окружения
        api_id = os.getenv('TELEGRAM_API_ID')
        api_hash = os.getenv('TELEGRAM_API_HASH')
        logger.info(f"🔑 API ID доступен: {'ДА' if api_id else 'НЕТ'}")
        logger.info(f"🔑 API HASH доступен: {'ДА' if api_hash else 'НЕТ'}")
        
        # Ищем файлы сессий
        session_files = []
        search_patterns = ['*.session', '../*.session']
        for pattern in search_patterns:
            import glob
            found = glob.glob(pattern)
            session_files.extend(found)
        
        logger.info(f"📁 Найдено файлов сессий: {len(session_files)}")
        for session_file in session_files:
            size = os.path.getsize(session_file) if os.path.exists(session_file) else 0
            logger.info(f"  📄 {session_file} ({size} байт)")
        
        chats = await get_telegram_chats()
        
        if chats:
            logger.info(f"✅ Успешно получено {len(chats)} чатов")
            logger.info("📋 Список чатов:")
            for i, chat in enumerate(chats[:5]):  # Показываем первые 5
                logger.info(f"  {i+1}. {chat.get('title', 'N/A')} (ID: {chat.get('id', 'N/A')})")
            if len(chats) > 5:
                logger.info(f"  ... и еще {len(chats) - 5} чатов")
        else:
            logger.error("❌ Не удалось получить чаты")
        
        # Выводим результат в JSON формате в stdout
        print(json.dumps(chats, ensure_ascii=False, indent=2))
        
    except Exception as e:
        logger.error(f"❌ Критическая ошибка: {e}")
        logger.error(f"🔍 Traceback: {traceback.format_exc()}")
        print("[]")  # Возвращаем пустой массив в случае ошибки

if __name__ == "__main__":
    asyncio.run(main())