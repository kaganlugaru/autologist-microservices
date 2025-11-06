"""
Скрипт для создания сессии Telegram
Запустите локально один раз для авторизации
"""

import asyncio
import os
from telethon import TelegramClient
from dotenv import load_dotenv

load_dotenv()

API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')
SESSION_NAME = os.getenv('TELEGRAM_SESSION_NAME', 'autologist_session')

async def create_session():
    """Создание сессии Telegram с авторизацией"""
    print("🔐 Создание сессии Telegram...")
    
    if not API_ID or not API_HASH:
        print("❌ ОШИБКА: TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть установлены")
        return
    
    client = TelegramClient(SESSION_NAME, int(API_ID), API_HASH)
    
    try:
        await client.start()
        print("✅ Сессия создана успешно!")
        print(f"📁 Файл сессии: {SESSION_NAME}.session")
        print("🚀 Теперь можно запускать парсер на Railway")
        
        # Получаем информацию о пользователе
        me = await client.get_me()
        print(f"👤 Авторизован как: {me.first_name}")
        
        await client.disconnect()
        
    except Exception as e:
        print(f"❌ Ошибка создания сессии: {e}")
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(create_session())