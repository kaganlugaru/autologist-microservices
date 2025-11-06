"""
Создание минимальной сессии для Railway
Эта версия создает сессию прямо в Railway при первом запуске
"""

import asyncio
import os
import sys
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

async def create_session_in_railway():
    """Создает сессию в Railway интерактивно через переменные окружения"""
    
    # Получаем данные API из переменных окружения
    api_id = os.getenv('TELEGRAM_API_ID')
    api_hash = os.getenv('TELEGRAM_API_HASH')
    phone = os.getenv('TELEGRAM_PHONE')
    
    if not api_id or not api_hash:
        print("❌ ОШИБКА: TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть установлены")
        return False
    
    if not phone:
        print("❌ ОШИБКА: TELEGRAM_PHONE должен быть установлен (например +77771234567)")
        return False
        
    session_name = os.getenv('TELEGRAM_SESSION_NAME', 'autologist_session')
    
    # Проверяем, есть ли уже сессия
    if os.path.exists(f"{session_name}.session"):
        print(f"✅ Сессия уже существует: {session_name}.session")
        return True
    
    print(f"🔧 Создаем новую сессию для номера: {phone}")
    
    try:
        client = TelegramClient(session_name, api_id, api_hash)
        
        await client.connect()
        
        if not await client.is_user_authorized():
            print(f"📱 Отправляем код на номер: {phone}")
            
            # Отправляем код
            await client.send_code_request(phone)
            
            # В Railway мы не можем интерактивно вводить код
            # Поэтому проверяем переменную окружения
            code = os.getenv('TELEGRAM_CODE')
            if not code:
                print("❌ ОШИБКА: Нужно установить TELEGRAM_CODE с кодом из SMS")
                print("💡 Добавьте переменную TELEGRAM_CODE в Railway с кодом из SMS")
                await client.disconnect()
                return False
            
            print(f"🔑 Используем код: {code}")
            
            try:
                await client.sign_in(phone, code)
            except SessionPasswordNeededError:
                password = os.getenv('TELEGRAM_PASSWORD')
                if not password:
                    print("❌ ОШИБКА: Нужен пароль двухфакторной аутентификации")
                    print("💡 Добавьте переменную TELEGRAM_PASSWORD в Railway")
                    await client.disconnect()
                    return False
                
                await client.sign_in(password=password)
        
        # Проверяем авторизацию
        me = await client.get_me()
        print(f"✅ Успешно авторизован как: {me.first_name}")
        
        await client.disconnect()
        
        print(f"✅ Сессия создана: {session_name}.session")
        return True
        
    except Exception as e:
        print(f"❌ Ошибка создания сессии: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Создание сессии для Railway...")
    
    # Запускаем создание сессии
    success = asyncio.run(create_session_in_railway())
    
    if success:
        print("🎉 Сессия готова для использования!")
        sys.exit(0)
    else:
        print("❌ Не удалось создать сессию")
        sys.exit(1)