"""
Тест Telegram парсера
Проверяет базовую функциональность без реального парсинга
"""

import asyncio
import sys
import os

# Добавляем путь к shared модулю
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from telegram_parser import TelegramParser

async def test_parser():
    """Тест инициализации парсера"""
    print("🧪 Тестирование Telegram парсера...\n")
    
    try:
        # Создаем парсер
        parser = TelegramParser()
        print("✅ Парсер создан")
        
        # Тестируем создание хеша
        test_text = "Нужен груз из Москвы в Питер 5000 рублей"
        content_hash = parser.create_content_hash(test_text)
        print(f"🔑 Хеш контента: {content_hash}")
        
        # Тестируем извлечение цены
        price = parser.extract_price(test_text)
        print(f"💰 Извлеченная цена: {price}")
        
        # Тестируем проверку ключевых слов (пока пустой список)
        keywords = parser.check_keywords(test_text)
        print(f"🔍 Найденные ключевые слова: {keywords}")
        
        print("\n🎉 Базовые функции работают!")
        print("💡 Для полного тестирования:")
        print("   1. Добавьте чаты в БД (add_test_data.sql)")
        print("   2. Запустите: python telegram_parser.py")
        
    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")

if __name__ == "__main__":
    asyncio.run(test_parser())