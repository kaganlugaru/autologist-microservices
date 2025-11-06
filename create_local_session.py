#!/usr/bin/env python3
"""
Создание второй сессии для локальной разработки
"""

import asyncio
import os
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError, FloodWaitError
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Используем те же данные, но создадим отдельную сессию
TELEGRAM_API_ID = "24596648"
TELEGRAM_API_HASH = "a7ad822cca0d197a02279dea6a2e84fc"
TELEGRAM_PHONE = "+77789197147"

async def create_local_session():
    """Создает сессию для локальной разработки"""
    
    print("💻 СОЗДАНИЕ СЕССИИ ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ")
    print("=" * 50)
    print(f"📱 Номер телефона: {TELEGRAM_PHONE}")
    print("🎯 Цель: Отдельная сессия для разработки")
    print()
    
    # Имя для локальной сессии
    session_name = "local_development_new"
    
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
                await client.send_code_request(TELEGRAM_PHONE)
                print(f"✅ SMS код отправлен на {TELEGRAM_PHONE}")
            except Exception as e:
                print(f"❌ Ошибка отправки SMS: {e}")
                return False
            
            # ИНТЕРАКТИВНЫЙ ВВОД КОДА
            print("\n" + "=" * 50)
            print("⏳ ОЖИДАНИЕ КОДА ДЛЯ ЛОКАЛЬНОЙ СЕССИИ...")
            print("📱 Проверьте SMS или Telegram-сообщения")
            print("🔑 Введите полученный код:")
            
            # Ждем ввод кода от пользователя
            while True:
                try:
                    code = input("Код для локальной разработки >>> ").strip()
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
            print(f"\n✅ УСПЕХ! Локальная сессия создана для: {user.first_name}")
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
    print("💻 ЦЕЛЬ: Создать вторую сессию для локальной разработки")
    print("🔄 Это позволит работать одновременно с Railway")
    print()
    
    input("Нажмите Enter для создания локальной сессии...")
    
    success = await create_local_session()
    
    if success:
        print("\n" + "=" * 60)
        print("🎉 ЛОКАЛЬНАЯ СЕССИЯ СОЗДАНА!")
        print("📋 ИТОГОВАЯ СИСТЕМА:")
        print("🚄 Railway: railway_production.session (28KB)")
        print("💻 Локально: local_development_new.session (28KB)")
        print("✅ Теперь можно работать одновременно без конфликтов!")
        print("=" * 60)
    else:
        print("\n❌ Не удалось создать локальную сессию")

if __name__ == "__main__":
    asyncio.run(main())