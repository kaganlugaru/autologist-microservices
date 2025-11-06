"""
Утилита для работы с сессией Telegram в Railway
Создает файл сессии из переменной окружения или base64 строки
"""

import os
import base64
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_session_from_env():
    """Создает файл сессии из переменной окружения"""
    session_name = os.getenv('TELEGRAM_SESSION_NAME', 'autologist_session')
    session_file = f"{session_name}.session"
    
    # Если файл уже существует, ничего не делаем
    if os.path.exists(session_file):
        logger.info(f"✅ Файл сессии уже существует: {session_file}")
        return True
    
    # Проверяем переменную окружения с данными сессии
    session_data = os.getenv('TELEGRAM_SESSION_DATA')
    
    if not session_data:
        logger.warning("⚠️ Переменная TELEGRAM_SESSION_DATA не найдена")
        logger.warning("📋 Для работы в Railway добавьте переменную TELEGRAM_SESSION_DATA")
        logger.warning("💡 Содержимое: base64-кодированный файл .session")
        return False
    
    try:
        # Декодируем base64 и создаем файл
        session_bytes = base64.b64decode(session_data)
        
        with open(session_file, 'wb') as f:
            f.write(session_bytes)
        
        logger.info(f"✅ Файл сессии создан из переменной окружения: {session_file}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка создания файла сессии: {e}")
        return False

def get_session_base64():
    """Получает base64 представление файла сессии (для локального использования)"""
    session_name = os.getenv('TELEGRAM_SESSION_NAME', 'autologist_session')
    session_file = f"{session_name}.session"
    
    if not os.path.exists(session_file):
        print(f"❌ Файл сессии не найден: {session_file}")
        print("💡 Сначала создайте сессию: python create_session.py")
        return None
    
    try:
        with open(session_file, 'rb') as f:
            session_data = f.read()
        
        base64_data = base64.b64encode(session_data).decode('utf-8')
        
        print("✅ Base64 представление сессии:")
        print("📋 Добавьте в Railway переменную TELEGRAM_SESSION_DATA:")
        print("-" * 50)
        print(base64_data)
        print("-" * 50)
        
        return base64_data
        
    except Exception as e:
        print(f"❌ Ошибка чтения файла сессии: {e}")
        return None

if __name__ == "__main__":
    print("🔧 Утилита для работы с сессией Telegram")
    print("1. Создание файла сессии из переменной окружения")
    print("2. Получение base64 для добавления в Railway")
    print()
    
    # Для локального использования - показываем base64
    result = get_session_base64()
    
    # Для Railway - создаем файл из переменной
    setup_session_from_env()