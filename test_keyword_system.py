#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Тест системы ключевых слов
Проверяет текущую конфигурацию и функциональность парсера ключевых слов
"""

import sys
import os
from supabase import create_client, Client
import json

# Настройки Supabase
SUPABASE_URL = "https://vhygajcjatjvwjnbstzu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoeWdhamNqYXRqdndqbmJzdHp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MjIyODAsImV4cCI6MjA0NjM5ODI4MH0.l7u3_4ddpvJm3lVLkcJ8hVKK6WNxXc5OIEyHlnYoH4o"

def check_keywords():
    """Проверяет логику ключевых слов из парсера"""
    
    def check_keywords_in_message(keywords, message_text):
        """Логика из telegram_parser.py"""
        if not keywords:
            return False
        
        keywords_str = str(keywords).lower()
        message_lower = message_text.lower()
        
        # Если есть оператор ;, это означает логическое И (все ключевые слова должны быть в сообщении)
        if ';' in keywords_str:
            keyword_list = [kw.strip() for kw in keywords_str.split(';')]
            print(f"Обнаружен составной ключ: {keyword_list}")
            
            # Проверяем, что все ключевые слова присутствуют в сообщении
            for keyword in keyword_list:
                if keyword and keyword not in message_lower:
                    print(f"Ключевое слово '{keyword}' НЕ найдено в сообщении")
                    return False
            
            print(f"Все ключевые слова найдены в сообщении!")
            return True
        else:
            # Обычная проверка одного ключевого слова
            result = keywords_str in message_lower
            print(f"Простое ключевое слово '{keywords_str}': {'найдено' if result else 'не найдено'}")
            return result
    
    # Тестовые случаи
    test_cases = [
        {
            "keywords": "тандем;140",
            "message": "Продаю тандем велосипед за 140 долларов",
            "expected": True
        },
        {
            "keywords": "тандем;140",
            "message": "Продаю тандем велосипед за 150 долларов",
            "expected": False
        },
        {
            "keywords": "велосипед",
            "message": "Продаю велосипед",
            "expected": True
        },
        {
            "keywords": "машина",
            "message": "Продаю велосипед",
            "expected": False
        }
    ]
    
    print("\n=== ТЕСТИРОВАНИЕ ЛОГИКИ КЛЮЧЕВЫХ СЛОВ ===")
    for i, test in enumerate(test_cases, 1):
        print(f"\nТест {i}:")
        print(f"Ключевые слова: '{test['keywords']}'")
        print(f"Сообщение: '{test['message']}'")
        print(f"Ожидаемый результат: {test['expected']}")
        
        result = check_keywords_in_message(test['keywords'], test['message'])
        status = "✅ ПРОШЕЛ" if result == test['expected'] else "❌ ПРОВАЛЕН"
        print(f"Результат: {result} - {status}")

def main():
    print("=== ДИАГНОСТИКА СИСТЕМЫ КЛЮЧЕВЫХ СЛОВ ===\n")
    
    try:
        # Подключение к Supabase
        print("1. Подключение к базе данных...")
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Подключение успешно\n")
        
        # Проверка ключевых слов
        print("2. Получение текущих ключевых слов...")
        keywords_response = supabase.table('keywords').select('*').execute()
        
        if keywords_response.data:
            print(f"✅ Найдено {len(keywords_response.data)} ключевых слов:")
            for keyword in keywords_response.data:
                print(f"   - ID: {keyword['id']}, Ключевое слово: '{keyword['keyword']}'")
        else:
            print("❌ Ключевые слова не найдены")
        
        print()
        
        # Проверка получателей
        print("3. Получение текущих получателей...")
        recipients_response = supabase.table('recipient_categories').select('*').execute()
        
        if recipients_response.data:
            print(f"✅ Найдено {len(recipients_response.data)} получателей:")
            for recipient in recipients_response.data:
                print(f"   - ID: {recipient['id']}, Имя: '{recipient['username']}', Телефон: '{recipient['phone']}'")
        else:
            print("❌ Получатели не найдены")
        
        print()
        
        # Проверка отслеживаемых чатов
        print("4. Получение отслеживаемых чатов...")
        chats_response = supabase.table('monitored_chats').select('*').execute()
        
        if chats_response.data:
            print(f"✅ Найдено {len(chats_response.data)} отслеживаемых чатов:")
            for chat in chats_response.data:
                print(f"   - ID: {chat['id']}, Название: '{chat['chat_name']}', Chat ID: {chat['chat_id']}")
        else:
            print("❌ Отслеживаемые чаты не найдены")
        
        print()
        
        # Тестирование логики ключевых слов
        check_keywords()
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n=== ДИАГНОСТИКА ЗАВЕРШЕНА ===")
    else:
        print("\n=== ДИАГНОСТИКА ПРОВАЛЕНА ===")
        sys.exit(1)