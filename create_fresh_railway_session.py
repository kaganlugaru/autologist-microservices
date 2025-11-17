#!/usr/bin/env python3
"""
Интерактивное создание Telegram сессии для Railway
Создает свежую сессию с живым вводом кода
"""

import asyncio
import os
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, FloodWaitError
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Конфигурация из .env
TELEGRAM_API_ID = "24596648"
TELEGRAM_API_HASH = "a7ad822cca0d197a02279dea6a2e84fc"
TELEGRAM_PHONE = "+77789197147"

async def create_fresh_session():
    """Создает новую свежую сессию интерактивно"""
    
    print("🚀 СОЗДАНИЕ СВЕЖЕЙ TELEGRAM СЕССИИ")
    print("=" * 50)
    print(f"📱 Номер телефона: {TELEGRAM_PHONE}")
    print(f"🔑 API ID: {TELEGRAM_API_ID}")
    print()
    
    # Имя для новой сессии
    session_name = "railway_production_fresh"
    
    # Удаляем старую сессию если есть
    session_file = f"{session_name}.session"
    if os.path.exists(session_file):
        os.remove(session_file)
        print(f"🗑️ Удалена старая сессия: {session_file}")
    
    try:
        # Создаем клиент
        client = TelegramClient(session_name, TELEGRAM_API_ID, TELEGRAM_API_HASH)
        
        print("🔗 Подключение к Telegram...")
        await client.connect()
        
        # Проверяем авторизацию
        if not await client.is_user_authorized():
            print("📱 Отправляем код авторизации...")
            
            # Отправляем код
            try:
                # Пробуем обычный SMS
                await client.send_code_request(TELEGRAM_PHONE)
                print(f"✅ SMS код отправлен на {TELEGRAM_PHONE}")
            except Exception as e:
                print(f"❌ Ошибка отправки SMS: {e}")
                return False
            
            # ИНТЕРАКТИВНЫЙ ВВОД КОДА
            print("\n" + "=" * 50)
            print("⏳ ОЖИДАНИЕ КОДА...")
            print("📱 Проверьте SMS или Telegram-сообщения")
            print("🔑 Введите полученный код:")
            
            # Ждем ввод кода от пользователя
            while True:
                try:
                    code = input("Код >>> ").strip()
                    if not code:
                        print("❌ Код не может быть пустым. Попробуйте еще раз:")
                        continue
                    
                    print(f"🔄 Проверяем код: {code}")
                    await client.sign_in(TELEGRAM_PHONE, code)
                    break
                    
                except Exception as e:
                    print(f"❌ Неверный код: {e}")
                    print("🔑 Введите код еще раз (или Ctrl+C для выхода):")
                    continue
        
        # Проверяем успешность
        if await client.is_user_authorized():
            user = await client.get_me()
            print(f"\n✅ УСПЕХ! Сессия создана для: {user.first_name}")
            print(f"📁 Файл сессии: {session_file}")
            
            # Показываем размер файла
            if os.path.exists(session_file):
                size = os.path.getsize(session_file)
                print(f"📊 Размер файла: {size} байт")
            
            return True
        else:
            print("❌ Не удалось авторизоваться")
            return False
            
    except Exception as e:
        print(f"❌ Ошибка создания сессии: {e}")
        return False
    finally:
        await client.disconnect()

async def main():
    print("🎯 ЦЕЛЬ: Создать свежую рабочую сессию для Railway")
    print("📱 Номер телефона уже настроен из .env файла")
    print("🔑 Код будет запрошен интерактивно")
    print()
    
    input("Нажмите Enter для начала создания сессии...")
    
    success = await create_fresh_session()
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 СЕССИЯ УСПЕШНО СОЗДАНА!")
        print("📋 СЛЕДУЮЩИЕ ШАГИ:")
        print("1. Переименовать файл в railway_production.session")
        print("2. Отправить в GitHub для Railway")
        print("3. Создать вторую сессию для локальной разработки")
        print("=" * 60)
    else:
        print("\n❌ Не удалось создать сессию")

if __name__ == "__main__":
    asyncio.run(main())