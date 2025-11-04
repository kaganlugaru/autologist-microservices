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
        self.session_name = 'autologist_session'
        
        # ID для отправки уведомлений (убрать функцию уведомлений)
        # self.my_telegram_id = os.getenv('MY_TELEGRAM_ID', 'disabled')
        
        # Проверяем наличие обязательных переменных
        if not self.api_id or not self.api_hash:
            logger.error("ОШИБКА: TELEGRAM_API_ID и TELEGRAM_API_HASH должны быть установлены в .env файле")
            raise ValueError("Не установлены обязательные переменные окружения")
        
        # Инициализация Supabase
        try:
            supabase_url = os.getenv('SUPABASE_URL')
            # ИСПРАВЛЕНИЕ: используем SERVICE_ROLE_KEY для доступа к данным
            supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
            
            # ДИАГНОСТИКА: покажем, какие ключи загружены
            logger.info(f"ДИАГНОСТИКА: SUPABASE_URL = {supabase_url}")
            logger.info(f"ДИАГНОСТИКА: SUPABASE_SERVICE_ROLE_KEY (первые 20 символов) = {supabase_key[:20] if supabase_key else 'НЕ ЗАГРУЖЕН'}")
            
            if not supabase_url or not supabase_key:
                raise ValueError("SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть установлены")
            
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
            logger.info("ДИАГНОСТИКА: Запрос ключевых слов из БД...")
            response = self.supabase.table('keywords').select('keyword').eq('active', True).execute()
            logger.info(f"ДИАГНОСТИКА: Ответ БД - data: {response.data}, error: {getattr(response, 'error', 'НЕТ')}")
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
            logger.info("ДИАГНОСТИКА: Запрос чатов из БД...")
            # ВОЗВРАТ к правильной таблице 'monitored_chats'
            response = self.supabase.table('monitored_chats').select('*').eq('active', True).execute()
            logger.info(f"ДИАГНОСТИКА: Ответ БД - data: {response.data}, error: {getattr(response, 'error', 'НЕТ')}")
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
            # ВОЗВРАТ к правильной таблице 'monitored_chats'
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
            # Убираем поле price из данных и добавляем информацию об авторе
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
            
            # Добавляем информацию об авторе, если она есть
            if 'sender_info' in message_data:
                sender_info = message_data['sender_info']
                if sender_info.get('username'):
                    save_data['username'] = sender_info['username']
                if sender_info.get('first_name'):
                    save_data['first_name'] = sender_info['first_name']
                if sender_info.get('last_name'):
                    save_data['last_name'] = sender_info['last_name']
            
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

    async def get_sender_info(self, message):
        """Получение информации об отправителе сообщения"""
        try:
            sender_info = {
                'id': message.sender_id,
                'username': None,
                'first_name': None,
                'last_name': None,
                'display_name': None,
                'profile_link': None
            }
            
            # Получаем полную информацию об отправителе
            if message.sender:
                sender = message.sender
                
                # Username (если есть)
                if hasattr(sender, 'username') and sender.username:
                    sender_info['username'] = sender.username
                    sender_info['profile_link'] = f"https://t.me/{sender.username}"
                
                # Имя и фамилия
                if hasattr(sender, 'first_name') and sender.first_name:
                    sender_info['first_name'] = sender.first_name
                
                if hasattr(sender, 'last_name') and sender.last_name:
                    sender_info['last_name'] = sender.last_name
                
                # Формируем отображаемое имя
                display_parts = []
                if sender_info['first_name']:
                    display_parts.append(sender_info['first_name'])
                if sender_info['last_name']:
                    display_parts.append(sender_info['last_name'])
                
                sender_info['display_name'] = ' '.join(display_parts) if display_parts else f"User {sender_info['id']}"
            
            return sender_info
            
        except Exception as e:
            logger.error(f"ОШИБКА: Получение информации об отправителе: {e}")
            return {
                'id': message.sender_id if message.sender_id else 'Unknown',
                'username': None,
                'first_name': None,
                'last_name': None,
                'display_name': f"User {message.sender_id}" if message.sender_id else "Unknown User",
                'profile_link': None
            }

    def extract_phone_numbers(self, text):
        """Извлечение номеров телефонов из текста"""
        # Паттерны для различных форматов номеров
        phone_patterns = [
            r'\+7\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}',  # +7 999 999 99 99
            r'\+7\d{10}',  # +79999999999
            r'8\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}',  # 8 999 999 99 99
            r'8\d{10}',  # 89999999999
            r'\+\d{1,3}\s?\d{7,15}',  # Международные номера
            r'\d{3}[-\s]?\d{3}[-\s]?\d{4}',  # 999-999-9999 или 999 999 9999
        ]
        
        phone_numbers = []
        for pattern in phone_patterns:
            matches = re.findall(pattern, text)
            phone_numbers.extend(matches)
        
        return list(set(phone_numbers))  # Убираем дубликаты

    def format_phone_for_telegram(self, phone):
        """Форматирование номера телефона для Telegram ссылки"""
        # Убираем все символы кроме цифр и +
        clean_phone = re.sub(r'[^\d+]', '', phone)
        
        # Если номер начинается с 8, заменяем на +7
        if clean_phone.startswith('8') and len(clean_phone) == 11:
            clean_phone = '+7' + clean_phone[1:]
        
        # Если номер не начинается с +, добавляем +
        if not clean_phone.startswith('+'):
            clean_phone = '+' + clean_phone
        
        return clean_phone

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
                
                # Детальное логирование дубликатов
                logger.info(f"ДУБЛИКАТ: Обнаружено похожее сообщение")
                logger.info(f"ДУБЛИКАТ: Хеш контента: {content_hash[:12]}...")
                logger.info(f"ДУБЛИКАТ: Пользователь ID: {message_data['user_id']}")
                logger.info(f"ДУБЛИКАТ: Возраст существующего: {age_hours:.1f} часов")
                logger.info(f"ДУБЛИКАТ: Оригинальное сообщение: {existing['message_text'][:50]}...")
                logger.info(f"ДУБЛИКАТ: Новое сообщение: {message_data['message_text'][:50]}...")
                
                if age_hours > 24:
                    logger.info(f"ДУБЛИКАТ: РЕШЕНИЕ - сообщение старше 24ч, сохраняем как НОВОЕ")
                    return False
                else:
                    logger.info(f"ДУБЛИКАТ: РЕШЕНИЕ - сообщение свежее, отклоняем как ДУБЛИКАТ")
                    return True
            
            logger.info(f"ДУБЛИКАТ: Проверка завершена - сообщение УНИКАЛЬНОЕ")
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
            # Автоматический запуск без запроса кода (используется сохраненная сессия)
            await self.client.start()
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
                        logger.debug(f"ИГНОРИРУЕМ: Чат {chat_id} не в списке отслеживаемых")
                        return
                    
                    # Получаем информацию о чате
                    chat_info = next((chat for chat in self.monitored_chats if str(chat['chat_id']) == chat_id), None)
                    chat_name = chat_info['chat_name'] if chat_info else 'Unknown'
                    
                    # Обрабатываем только сообщения с текстом из отслеживаемых чатов
                    if event.message.text:
                        self.stats['messages_processed'] += 1
                        logger.info(f"НОВОЕ СООБЩЕНИЕ: Получено из чата '{chat_name}' (ID: {chat_id})")
                        logger.info(f"НОВОЕ СООБЩЕНИЕ: Текст: {event.message.text[:100]}...")
                        logger.info(f"НОВОЕ СООБЩЕНИЕ: От пользователя ID: {event.message.sender_id}")
                        
                        # Создаем хеш для дедупликации
                        message_hash = self.create_message_hash(
                            event.message.text, 
                            str(event.message.sender_id)
                        )
                        logger.info(f"НОВОЕ СООБЩЕНИЕ: Хеш для дедупликации: {message_hash[:12]}...")
                        
                        # Проверяем на дубликат
                        if await self.is_duplicate_message(message_hash):
                            self.stats['duplicates'] += 1
                            logger.info(f"ДУБЛИКАТ: Сообщение отклонено (хеш: {message_hash[:8]}...)")
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

    async def send_message_to_recipients(self, message_data, keywords_found):
        """Отправка сообщения получателям по ключевым словам"""
        try:
            # Получаем список получателей для найденных ключевых слов
            recipients = await self.get_recipients_for_keywords(keywords_found)
            
            if not recipients:
                logger.info(f"ОТПРАВКА: Нет получателей для ключевых слов: {keywords_found}")
                return
            
            # Извлекаем номера телефонов из текста сообщения
            phone_numbers = self.extract_phone_numbers(message_data['message_text'])
            
            # Формируем информацию об отправителе
            sender_info = message_data.get('sender_info', {})
            sender_display = sender_info.get('display_name', 'Неизвестный пользователь')
            sender_link = sender_info.get('profile_link', None)
            
            # Создаем кликабельную ссылку на отправителя
            if sender_link:
                sender_text = f"[{sender_display}]({sender_link})"
            else:
                sender_text = sender_display
            
            # Формируем список кликабельных номеров телефонов
            phone_links = []
            if phone_numbers:
                for phone in phone_numbers:
                    formatted_phone = self.format_phone_for_telegram(phone)
                    phone_links.append(f"[{phone}](tel:{formatted_phone})")
                phone_text = "\n📞 Номера: " + ", ".join(phone_links)
            else:
                phone_text = ""
            
            # Формируем сообщение для отправки
            notification_text = f"""🔔 **НОВОЕ СООБЩЕНИЕ ПО КЛЮЧЕВЫМ СЛОВАМ**

**Чат:** {message_data['chat_name']}
**От:** {sender_text}
**Ключевые слова:** {', '.join(keywords_found)}{phone_text}

**Текст сообщения:**
```
{message_data['message_text']}
```

---
⏰ **Время:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"""
            
            # Отправляем всем получателям
            for recipient in recipients:
                try:
                    # Отправляем по username с поддержкой Markdown
                    await self.client.send_message(
                        recipient['username'], 
                        notification_text,
                        parse_mode='markdown'
                    )
                    logger.info(f"ОТПРАВКА: Сообщение отправлено {recipient['name']} (@{recipient['username']})")
                except Exception as e:
                    logger.error(f"ОШИБКА: Не удалось отправить сообщение {recipient['name']} (@{recipient['username']}): {e}")
                    
        except Exception as e:
            logger.error(f"ОШИБКА: Отправка сообщений получателям: {e}")

    async def get_recipients_for_keywords(self, keywords_found):
        """Получение списка получателей для найденных ключевых слов"""
        try:
            # Формируем запрос для поиска получателей по ключевым словам
            recipients = []
            for keyword in keywords_found:
                # Поиск нечувствительный к регистру - проверяем как с маленькой, так и с большой буквы
                keyword_lower = keyword.lower()
                keyword_upper = keyword.capitalize()
                
                # Пробуем найти с маленькой буквы
                response = self.supabase.table('message_recipients').select('*').eq('keyword', keyword_lower).eq('active', True).execute()
                recipients.extend(response.data)
                
                # Пробуем найти с большой буквы
                response = self.supabase.table('message_recipients').select('*').eq('keyword', keyword_upper).eq('active', True).execute()
                recipients.extend(response.data)
                
                logger.info(f"ОТПРАВКА: Поиск получателей для '{keyword}' (пробуем '{keyword_lower}' и '{keyword_upper}')")
            
            # Убираем дубликаты по username
            unique_recipients = []
            seen_usernames = set()
            for recipient in recipients:
                if recipient['username'] not in seen_usernames:
                    unique_recipients.append(recipient)
                    seen_usernames.add(recipient['username'])
            
            logger.info(f"ОТПРАВКА: Найдено {len(unique_recipients)} получателей для ключевых слов: {keywords_found}")
            return unique_recipients
            
        except Exception as e:
            logger.error(f"ОШИБКА: Получение списка получателей: {e}")
            return []

    async def process_new_message(self, message, chat, message_hash):
        """Обработка нового сообщения (из старого парсера)"""
        try:
            # Проверяем что message и chat существуют
            if not message or not hasattr(message, 'text') or not message.text:
                return
            
            if not chat or not hasattr(chat, 'id'):
                return
                
            # Получаем информацию об отправителе
            sender_info = await self.get_sender_info(message)
            
            # Проверяем на ключевые слова
            keywords_found = self.check_keywords(message.text)
            has_keywords = len(keywords_found) > 0
            
            logger.info(f"ОБРАБОТКА: Проверка ключевых слов завершена")
            logger.info(f"ОБРАБОТКА: Найденные ключевые слова: {keywords_found}")
            logger.info(f"ОБРАБОТКА: Есть ключевые слова: {has_keywords}")
            
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
                'matched_keywords': keywords_found,
                'sender_info': sender_info  # Добавляем информацию об отправителе
            }
            
            # Сохраняем в базу (ВСЕ сообщения)
            saved = await self.save_message(message_data)
            if saved:
                logger.info(f"СОХРАНЕНИЕ: Сообщение сохранено в БД из чата '{message_data['chat_name']}'")
                
                # Если есть ключевые слова - отправляем получателям
                if has_keywords:
                    logger.info(f"КЛЮЧЕВЫЕ СЛОВА: Найдены {keywords_found} - запуск отправки получателям")
                    self.stats['keywords_found'] += 1
                    
                    # Отправляем сообщение получателям
                    await self.send_message_to_recipients(message_data, keywords_found)
                else:
                    logger.info(f"КЛЮЧЕВЫЕ СЛОВА: Не найдены - отправка не требуется")
                    
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