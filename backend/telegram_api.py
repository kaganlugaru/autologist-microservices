"""
Telegram API интеграция для получения списка доступных чатов
Использует Telethon для подключения к реальному аккаунту Telegram
"""

import asyncio
import os
import json
import sys
from telethon import TelegramClient
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

class TelegramChatsAPI:
    def __init__(self):
        """Инициализация Telegram API клиента"""
        self.api_id = os.getenv('TELEGRAM_API_ID')
        self.api_hash = os.getenv('TELEGRAM_API_HASH')
        self.session_name = os.getenv('TELEGRAM_SESSION_NAME', 'autologist_session')
        
        if not self.api_id or not self.api_hash:
            raise ValueError("TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть установлены в .env файле")
        
        # Путь к сессии из старого проекта
        self.session_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)), 
            '..', 
            'Autologist', 
            'parsers', 
            f'{self.session_name}.session'
        )
        
        self.client = TelegramClient(self.session_path, int(self.api_id), self.api_hash)

    async def get_available_chats(self):
        """Получение списка доступных чатов из реального Telegram аккаунта"""
        try:
            await self.client.start()
            
            # Проверяем авторизацию
            me = await self.client.get_me()
            print(f"✅ Подключен как: {me.first_name} (@{me.username})", file=sys.stderr)
            
            chats = []
            
            # Получаем все диалоги
            async for dialog in self.client.iter_dialogs():
                if dialog.is_group or dialog.is_channel:
                    chat_info = {
                        'id': str(dialog.id),
                        'title': dialog.title,
                        'participantsCount': getattr(dialog.entity, 'participants_count', 0),
                        'type': 'channel' if dialog.is_channel else 'supergroup',
                        'accessible': True
                    }
                    chats.append(chat_info)
            
            print(f"✅ Найдено {len(chats)} чатов/каналов", file=sys.stderr)
            return chats
            
        except Exception as e:
            print(f"❌ Ошибка получения чатов: {e}", file=sys.stderr)
            return []
        finally:
            await self.client.disconnect()

async def main():
    """Основная функция для вызова из Node.js"""
    try:
        api = TelegramChatsAPI()
        chats = await api.get_available_chats()
        
        # Выводим результат в JSON формате
        print(json.dumps(chats, ensure_ascii=False))
        
    except Exception as e:
        print(f"❌ Критическая ошибка: {e}", file=sys.stderr)
        print("[]")  # Возвращаем пустой массив в случае ошибки

if __name__ == "__main__":
    asyncio.run(main())