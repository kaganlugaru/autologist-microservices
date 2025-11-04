"""
Telegram парсер для сбора сообщений из групповых чатов
Адаптированная версия для Supabase с улучшениями из рабочего парсера
Использует Telethon для подключения к Telegram API
"""

import asyncio
import os
import hashlib
import re
import json
from datetime import datetime, timedelta
from telethon import TelegramClient, events
from telethon.errors import SessionPasswordNeededError, FloodWaitError
from dotenv import load_dotenv
import logging
from difflib import SequenceMatcher
import sys

# Прямое подключение к Supabase
try:
    from supabase import create_client, Client
except ImportError:
    print("ОШИБКА: Нужно установить: pip install supabase")
    sys.exit(1)

# Загружаем переменные окружения
load_dotenv()

# Создаем папку для логов если её нет
os.makedirs('logs', exist_ok=True)

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/telegram_parser.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TelegramParser:
    def __init__(self):
        """Инициализация парсера"""
        logger.info("ЗАПУСК: Инициализация Telegram парсера...")
        
        # Telegram API данные
        self.api_id = os.getenv('TELEGRAM_API_ID')
        self.api_hash = os.getenv('TELEGRAM_API_HASH')
        self.phone = os.getenv('TELEGRAM_PHONE')
        self.session_name = 'telegram_parser_session'
        
        # ID для отправки уведомлений (убрать функцию уведомлений)
        # self.my_telegram_id = os.getenv('MY_TELEGRAM_ID', 'disabled')
        
        # Проверяем наличие обязательных переменных
        if not self.api_id or not self.api_hash:
            logger.error("ОШИБКА: TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть установлены в .env файле")
            raise ValueError("Не установлены обязательные переменные окружения")
        
        # Инициализация Supabase
        try:
            supabase_url = os.getenv('SUPABASE_URL')
            supabase_key = os.getenv('SUPABASE_ANON_KEY')
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL и SUPABASE_ANON_KEY должны быть установлены")
            
            self.supabase = create_client(supabase_url, supabase_key)
            logger.info("УСПЕХ: База данных подключена")
        except Exception as e:
            logger.error(f"ОШИБКА: Подключение к БД: {e}")
            raise
            
        # Инициализация переменных
        self.client = None
        self.keywords = []
        self.monitored_chats = []
        self.stats = {
            'messages_processed': 0,
            'duplicates': 0,
            'errors': 0,
            'keywords_found': 0
        }
        
        try:
            # Создаем клиент Telegram
            self.client = TelegramClient(self.session_name, self.api_id, self.api_hash)
            
            # Загружаем данные
            asyncio.create_task(self.load_keywords())
            asyncio.create_task(self.load_monitored_chats())
            
            logger.info("УСПЕХ: Telegram клиент запущен")
            
            # Загружаем ключевые слова и чаты
            keywords_data = self.load_keywords_sync()
            self.keywords = [item['keyword'].lower() for item in keywords_data]
            logger.info(f"ДАННЫЕ: Загружено {len(self.keywords)} ключевых слов")
            
            chats_data = self.load_monitored_chats_sync()
            self.monitored_chats = chats_data
            logger.info(f"ДАННЫЕ: Загружено {len(self.monitored_chats)} чатов для мониторинга")
            
        except Exception as e:
            logger.error(f"ОШИБКА: Инициализация: {e}")
            if self.client:
                self.client.disconnect()
            raise
        except KeyboardInterrupt:
            logger.error(f"ОШИБКА: Инициализация прервана пользователем")
            raise

    def load_keywords_sync(self):
        """Синхронная загрузка ключевых слов"""
        try:
            response = self.supabase.table('keywords').select('keyword').eq('active', True).execute()
            return response.data
        except Exception as e:
            logger.error(f"ОШИБКА: Загрузка ключевых слов: {e}")
            return []

    async def load_keywords(self):
        """Загрузка ключевых слов из БД"""
        try:
            response = self.supabase.table('keywords').select('keyword').eq('active', True).execute()
            self.keywords = [item['keyword'].lower() for item in response.data]
        except Exception as e:
            logger.error(f"ОШИБКА: Загрузка ключевых слов: {e}")

    def load_monitored_chats_sync(self):
        """Синхронная загрузка отслеживаемых чатов"""
        try:
            response = self.supabase.table('monitored_chats').select('*').eq('active', True).execute()
            chats = response.data
            
            # Выводим список чатов для мониторинга
            logger.info("МОНИТОРИНГ: Запуск отслеживания для следующих чатов...")
            for chat in chats:
                logger.info(f"ЧАТ: {chat['chat_name']} (ID: {chat['chat_id']})")
            
            logger.info(f"УСПЕХ: Загружено {len(chats)} чатов для мониторинга")
            return chats
        except Exception as e:
            logger.error(f"ОШИБКА: Загрузка чатов: {e}")
            return []

    async def load_monitored_chats(self):
        """Загрузка отслеживаемых чатов из БД"""
        try:
            response = self.supabase.table('monitored_chats').select('*').eq('active', True).execute()
            self.monitored_chats = response.data
        except Exception as e:
            logger.error(f"ОШИБКА: Загрузка чатов: {e}")

    async def is_duplicate_message(self, message_hash):
        """Упрощенная проверка дубликата"""
        try:
            yesterday = datetime.now() - timedelta(days=1)
            response = self.supabase.table('messages').select('id').eq('content_hash', message_hash).gte('created_at', yesterday.isoformat()).limit(1).execute()
            return len(response.data) > 0
        except Exception as e:
            logger.error(f"ОШИБКА: Проверка дубликата: {e}")
            return False

    async def save_message(self, message_data):
        """Сохранение сообщения в БД без цены"""
        try:
            # Убираем поле price из данных
            save_data = {
                'message_text': message_data['message_text'],
                'chat_id': message_data['chat_id'],
                'chat_name': message_data['chat_name'],
                'user_id': message_data['user_id'],
                'message_id': message_data['message_id'],
                'content_hash': message_data['content_hash'],
                'platform': message_data['platform'],
                'contains_keywords': message_data['contains_keywords'],
                'matched_keywords': message_data['matched_keywords']
            }
            
            response = self.supabase.table('messages').insert(save_data).execute()
            return response.data
        except Exception as e:
            logger.error(f"ОШИБКА: Сохранение сообщения: {e}")
            return None

    async def check_duplicate(self, content_hash, user_id):
        """Проверка дубликата в БД (только за последние 24 часа)"""
        try:
            # Проверяем дубликаты только за последние 24 часа
            yesterday = datetime.now() - timedelta(days=1)
            
            response = self.supabase.table('messages').select('id, message_text, created_at').eq('content_hash', content_hash).eq('user_id', user_id).eq('is_duplicate', False).gte('created_at', yesterday.isoformat()).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"ОШИБКА: Проверка дубликата: {e}")
            return None

    def get_duplicate_reason(self, message_data, existing):
        """Определение причины дублирования"""
        if not existing:
            return None
            
        # Проверяем возраст сообщения
        existing_date = datetime.fromisoformat(existing['created_at'].replace('Z', '+00:00'))
        age_hours = (datetime.now(existing_date.tzinfo) - existing_date).total_seconds() / 3600
        
        if age_hours > 24:
            return "АКТУАЛИЗАЦИЯ: Сообщение старше 24 часов - считается актуализацией"
        else:
            text_similarity = SequenceMatcher(None, message_data['message_text'], existing['message_text']).ratio()
            return f"ДУБЛИКАТ: Совпадение {text_similarity:.1%} за последние {age_hours:.1f}ч"

    def create_content_hash(self, text):
        """Создание хеша контента без цифр для дедупликации"""
        # Убираем цифры, знаки препинания и лишние пробелы
        clean_text = re.sub(r'[\d\s\W]+', ' ', text.lower())
        clean_text = ' '.join(clean_text.split())
        return hashlib.md5(clean_text.encode()).hexdigest()

    def create_message_hash(self, message_text, user_id):
        """Создание хеша для дедупликации"""
        content = f"{message_text.lower().strip()}_{user_id}"
        return hashlib.md5(content.encode()).hexdigest()

    def check_keywords(self, text):
        """Проверка наличия ключевых слов в тексте"""
        found_keywords = []
        text_lower = text.lower()
        
        for keyword in self.keywords:
            if keyword in text_lower:
                found_keywords.append(keyword)
        
        return found_keywords

    async def is_duplicate(self, message_data):
        """Проверка и обработка дубликатов"""
        try:
            content_hash = self.create_content_hash(message_data['message_text'])
            existing = await self.check_duplicate(content_hash, message_data['user_id'])
            
            if existing:
                # Определяем причину дублирования
                duplicate_reason = self.get_duplicate_reason(message_data, existing)
                
                # Если сообщение старше 24 часов, обновляем
                existing_date = datetime.fromisoformat(existing['created_at'].replace('Z', '+00:00'))
                age_hours = (datetime.now(existing_date.tzinfo) - existing_date).total_seconds() / 3600
                
                if age_hours > 24:
                    logger.info(f"ОБНОВЛЕНИЕ: Сообщение старше 24ч - сохраняем как новое")
                    return False
                else:
                    return True
            
            return False
        except Exception as e:
            logger.error(f"ОШИБКА: Проверка дубликата: {e}")
            return False

    async def process_message(self, message, chat):
        """Обработка сообщения из старого парсера"""
        try:
            if not message or not message.text:
                return
                
            self.stats['messages_processed'] += 1
            duplicate_reason = ""
            
            # Извлекаем данные сообщения (БЕЗ ЦЕНЫ)
            message_data = {
                'message_id': str(message.id),
                'chat_id': str(message.chat_id),
                'chat_name': getattr(message.chat, 'title', 'Unknown'),
                'user_id': str(message.sender_id),
                'username': getattr(message.sender, 'username', None) if message.sender else None,
                'message_text': message.text,
                'platform': 'telegram',
                'content_hash': self.create_content_hash(message.text),
                'matched_keywords': self.check_keywords(message.text),
                'contains_keywords': bool(self.check_keywords(message.text))
            }
            
            # Проверка на дубликат
            if await self.is_duplicate(message_data):
                self.stats['duplicates'] += 1
                return
            
            # Логируем процесс
            duplicate_reason = await self.check_duplicate(message_data['content_hash'], message_data['user_id'])
            if duplicate_reason:
                logger.info(f"ПРОВЕРКА: {duplicate_reason}")
            
            # Сохраняем сообщение (ВСЕ сообщения сохраняются)
            saved = await self.save_message(message_data)
            if saved:
                logger.info(f"СОХРАНЕНО: {message_data['chat_name']} | Ключевые слова: {message_data['matched_keywords']}")
                
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"ОШИБКА: Обработка сообщения: {e}")

    async def start_monitoring(self):
        """Запуск мониторинга сообщений"""
        try:
            await self.client.start(phone=self.phone)
            logger.info("МОНИТОРИНГ: Подключение к Telegram успешно")
            logger.info("СТАТУС: Запуск отслеживания новых сообщений...")
            
            @self.client.on(events.NewMessage)
            async def handle_new_message(event):
                try:
                    # Проверяем, что сообщение из отслеживаемого чата
                    chat_id = str(event.chat_id)
                    monitored_chat_ids = [str(chat['chat_id']) for chat in self.monitored_chats]
                    
                    # Если чат НЕ в списке отслеживаемых - игнорируем
                    if chat_id not in monitored_chat_ids:
                        return
                    
                    # Обрабатываем только сообщения с текстом из отслеживаемых чатов
                    if event.message.text:
                        self.stats['messages_processed'] += 1
                        logger.info(f"СООБЩЕНИЕ: Обработка из чата {chat_id}")
                        
                        # Создаем хеш для дедупликации
                        message_hash = self.create_message_hash(
                            event.message.text, 
                            str(event.message.sender_id)
                        )
                        
                        # Проверяем на дубликат
                        if await self.is_duplicate_message(message_hash):
                            self.stats['duplicates'] += 1
                            logger.debug(f"ДУБЛИКАТ: {message_hash[:8]}...")
                            return
                        
                        # Обрабатываем новое сообщение
                        await self.process_new_message(event.message, event.chat, message_hash)
                        
                except Exception as e:
                    self.stats['errors'] += 1
                    logger.error(f"ОШИБКА: Обработка события: {e}")

            # Запускаем клиент
            logger.info("ГОТОВ: Ожидание новых сообщений...")
            await self.client.run_until_disconnected()

        except Exception as e:
            logger.error(f"ОШИБКА: Мониторинг: {e}")
            raise

    async def process_new_message(self, message, chat, message_hash):
        """Обработка нового сообщения (из старого парсера)"""
        try:
            # Проверяем что message и chat существуют
            if not message or not hasattr(message, 'text') or not message.text:
                return
            
            if not chat or not hasattr(chat, 'id'):
                return
                
            # Проверяем на ключевые слова
            keywords_found = self.check_keywords(message.text)
            has_keywords = len(keywords_found) > 0
            
            # Подготавливаем данные для сохранения (ВСЕ сообщения сохраняются, БЕЗ ЦЕНЫ)
            message_data = {
                'message_text': message.text,
                'chat_id': str(chat.id),
                'chat_name': getattr(chat, 'title', 'Unknown'),
                'user_id': str(message.sender_id),
                'message_id': str(message.id),
                'content_hash': message_hash,
                'platform': 'telegram',
                'contains_keywords': has_keywords,
                'matched_keywords': keywords_found
            }
            
            # Сохраняем в базу (ВСЕ сообщения)
            saved = await self.save_message(message_data)
            if saved:
                logger.info(f"НОВОЕ СООБЩЕНИЕ: Сохранено из {message_data['chat_name']}")
                
                # Если есть ключевые слова - логируем
                if has_keywords:
                    logger.info(f"КЛЮЧЕВЫЕ СЛОВА: Найдены {keywords_found} в сообщении")
                    self.stats['keywords_found'] += 1
                    
        except Exception as e:
            self.stats['errors'] += 1
            logger.error(f"ОШИБКА: Обработка нового сообщения: {e}")

    async def parse_chat_history(self, chat_id, limit=100):
        """Парсинг истории чата"""
        try:
            logger.info(f"ИСТОРИЯ: Парсинг чата {chat_id} (лимит: {limit})")
            
            messages = []
            async for message in self.client.iter_messages(int(chat_id), limit=limit):
                if message.text:
                    await self.process_message(message, message.chat)
                    messages.append({
                        'id': message.id,
                        'text': message.text[:100] + '...' if len(message.text) > 100 else message.text,
                        'date': message.date.isoformat() if message.date else None
                    })
            
            logger.info(f"ЗАВЕРШЕНО: Обработано {len(messages)} сообщений из истории")
            return messages
            
        except Exception as e:
            logger.error(f"ОШИБКА: Парсинг истории: {e}")
            return []

    def get_stats(self):
        """Получение статистики"""
        return {
            'messages_processed': self.stats['messages_processed'],
            'duplicates': self.stats['duplicates'], 
            'errors': self.stats['errors'],
            'keywords_found': self.stats['keywords_found'],
            'active_keywords': len(self.keywords),
            'monitored_chats': len(self.monitored_chats)
        }

    async def stop(self):
        """Остановка парсера"""
        try:
            if self.client and self.client.is_connected():
                await self.client.disconnect()
            logger.info("СТОП: Парсер остановлен")
        except Exception as e:
            logger.error(f"ОШИБКА: Остановка парсера: {e}")

async def main():
    """Главная функция"""
    parser = None
    try:
        parser = TelegramParser()
        await parser.start_monitoring()
    except KeyboardInterrupt:
        logger.info("ОСТАНОВКА: Получен сигнал завершения")
    except Exception as e:
        logger.error(f"ОШИБКА: Главная функция: {e}")
    finally:
        if parser:
            await parser.stop()

if __name__ == "__main__":
    asyncio.run(main())