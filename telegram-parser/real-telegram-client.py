"""
Реальный Telegram клиент для получения списка всех чатов и каналов
Использует API credentials из старого проекта
"""

import asyncio
import os
import json
from datetime import datetime
from telethon import TelegramClient
from telethon.tl.types import Channel, Chat, User
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv('.env.telegram')

class RealTelegramClient:
    def __init__(self):
        """Инициализация клиента"""
        self.api_id = os.getenv('TELEGRAM_API_ID')
        self.api_hash = os.getenv('TELEGRAM_API_HASH')
        self.session_name = os.getenv('TELEGRAM_SESSION_NAME', 'autologist_real_session')
        
        if not self.api_id or not self.api_hash:
            print("Ошибка: API данные не найдены в .env.telegram")
            print("Создайте файл .env.telegram с данными:")
            print("TELEGRAM_API_ID=ваш_api_id")
            print("TELEGRAM_API_HASH=ваш_api_hash")
            raise ValueError("Отсутствуют API данные")
        
        self.client = TelegramClient(self.session_name, int(self.api_id), self.api_hash)
        print("Telegram клиент инициализирован")
        print(f"API ID: {self.api_id}")
        print(f"Сессия: {self.session_name}")

    async def get_user_info(self):
        """Получение информации о пользователе"""
        try:
            me = await self.client.get_me()
            return {
                'id': me.id,
                'first_name': me.first_name,
                'last_name': me.last_name or '',
                'username': me.username or '',
                'phone': me.phone or '',
                'is_verified': getattr(me, 'verified', False)
            }
        except Exception as e:
            print(f"Ошибка получения информации о пользователе: {e}")
            return None

    async def get_all_chats(self, limit=100):
        """Получение всех чатов и каналов"""
        chats = []
        cargo_keywords = [
            'груз', 'перевозка', 'доставка', 'транспорт', 'логистика', 
            'фура', 'дальнобой', 'водители', 'работа', 'евро', 'украина',
            'cargo', 'truck', 'driver', 'logistics'
        ]
        
        try:
            print(f"Получаем список диалогов...")
            dialog_count = 0
            
            async for dialog in self.client.iter_dialogs(limit=limit):
                dialog_count += 1
                
                # Определяем тип диалога
                if dialog.is_user:
                    dialog_type = 'user'
                elif dialog.is_group:
                    dialog_type = 'group'
                elif dialog.is_channel:
                    dialog_type = 'channel'
                else:
                    dialog_type = 'unknown'
                
                # Для групп и каналов получаем подробную информацию
                if dialog.is_group or dialog.is_channel:
                    # Проверяем на грузоперевозки
                    title_lower = dialog.title.lower()
                    is_cargo_related = any(keyword in title_lower for keyword in cargo_keywords)
                    
                    # Получаем количество участников
                    participants_count = 0
                    try:
                        if hasattr(dialog.entity, 'participants_count'):
                            participants_count = dialog.entity.participants_count
                    except:
                        pass
                    
                    chat_info = {
                        'id': dialog.id,
                        'title': dialog.title,
                        'type': dialog_type,
                        'participants_count': participants_count,
                        'is_cargo_related': is_cargo_related,
                        'unread_count': dialog.unread_count,
                        'is_pinned': dialog.pinned,
                        'is_muted': getattr(dialog, 'is_muted', False),
                        'last_message_date': dialog.date.isoformat() if dialog.date else None,
                        'has_username': hasattr(dialog.entity, 'username') and dialog.entity.username is not None,
                        'username': getattr(dialog.entity, 'username', None),
                        'access_hash': getattr(dialog.entity, 'access_hash', None),
                        'is_verified': getattr(dialog.entity, 'verified', False),
                        'is_broadcast': getattr(dialog.entity, 'broadcast', False)
                    }
                    
                    chats.append(chat_info)
                    
                    # Выводим прогресс
                    status = "[CARGO]" if is_cargo_related else "[CHAT]"
                    print(f"{status} {dialog.title} ({dialog_type}) - {participants_count:,} участников")
            
            print(f"Обработано диалогов: {dialog_count}")
            return chats
            
        except Exception as e:
            print(f"Ошибка получения чатов: {e}")
            return []

    async def save_chats_to_file(self, chats, filename='real_telegram_chats.json'):
        """Сохранение чатов в JSON файл"""
        try:
            data = {
                'timestamp': datetime.now().isoformat(),
                'total_chats': len(chats),
                'cargo_related': len([c for c in chats if c['is_cargo_related']]),
                'chats': chats
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"Данные сохранены в {filename}")
            return True
        except Exception as e:
            print(f"Ошибка сохранения: {e}")
            return False

    async def connect_and_get_chats(self):
        """Основная функция: подключение и получение чатов"""
        try:
            print("Подключаемся к Telegram...")
            await self.client.start()
            
            # Получаем информацию о пользователе
            user_info = await self.get_user_info()
            if user_info:
                print(f"Авторизован как: {user_info['first_name']} (@{user_info['username']})")
                print(f"Телефон: {user_info['phone']}")
            
            # Получаем все чаты
            print("\nПолучаем список всех чатов...")
            chats = await self.get_all_chats(limit=200)
            
            if not chats:
                print("Чаты не найдены")
                return None
            
            # Статистика
            total_chats = len(chats)
            cargo_chats = [c for c in chats if c['is_cargo_related']]
            groups = [c for c in chats if c['type'] == 'group']
            channels = [c for c in chats if c['type'] == 'channel']
            
            print(f"\nСтатистика:")
            print(f"   Всего чатов: {total_chats}")
            print(f"   Групп: {len(groups)}")
            print(f"   Каналов: {len(channels)}")
            print(f"   Связанных с грузоперевозками: {len(cargo_chats)}")
            
            # Топ-10 самых популярных чатов по грузоперевозкам
            if cargo_chats:
                print(f"\nТоп чатов по грузоперевозкам:")
                cargo_chats_sorted = sorted(cargo_chats, key=lambda x: x['participants_count'], reverse=True)
                for i, chat in enumerate(cargo_chats_sorted[:10], 1):
                    print(f"   {i}. {chat['title']}")
                    print(f"      Участников: {chat['participants_count']:,}")
                    print(f"      ID: {chat['id']}")
                    print(f"      Тип: {chat['type']}")
                    print()
            
            # Сохраняем в файл
            await self.save_chats_to_file(chats)
            
            return chats
            
        except Exception as e:
            print(f"Ошибка подключения: {e}")
            return None
        finally:
            await self.client.disconnect()
            print("Отключились от Telegram")

async def main():
    """Основная функция"""
    # Устанавливаем UTF-8 кодировку для Windows
    import sys
    if sys.platform.startswith('win'):
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    
    print("Real Telegram Chat Getter")
    print("=" * 50)
    
    try:
        client = RealTelegramClient()
        chats = await client.connect_and_get_chats()
        
        if chats:
            print("\nГотово! Чаты получены и сохранены")
            print(f"Проверьте файл: real_telegram_chats.json")
        else:
            print("\nНе удалось получить чаты")
            
    except Exception as e:
        print(f"Критическая ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(main())