#!/usr/bin/env python3
"""
Диагностический скрипт для проверки ключевых слов в БД
"""
import os
import sys
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    print("ОШИБКА: Нужно установить: pip install supabase")
    sys.exit(1)

def check_keywords_in_db():
    """Проверяем ключевые слова в базе данных"""
    
    # Подключение к Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ ОШИБКА: Не найдены переменные SUPABASE_URL или SUPABASE_KEY")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Подключение к Supabase успешно")
        
        # Проверяем все ключевые слова
        print("\n📋 ПРОВЕРКА ВСЕХ КЛЮЧЕВЫХ СЛОВ:")
        response_all = supabase.table('keywords').select('*').execute()
        if response_all.data:
            for keyword in response_all.data:
                status = "🟢 АКТИВНО" if keyword.get('active') else "🔴 НЕ АКТИВНО"
                print(f"  {status} | ID: {keyword.get('id')} | Слово: '{keyword.get('keyword')}'")
        else:
            print("  ❌ Ключевые слова не найдены")
        
        # Проверяем только активные ключевые слова
        print("\n🔍 АКТИВНЫЕ КЛЮЧЕВЫЕ СЛОВА:")
        response_active = supabase.table('keywords').select('keyword').eq('active', True).execute()
        if response_active.data:
            active_keywords = [item['keyword'] for item in response_active.data]
            print(f"  ✅ Найдено {len(active_keywords)} активных ключевых слов:")
            for kw in active_keywords:
                print(f"    - '{kw}'")
        else:
            print("  ❌ Активные ключевые слова НЕ НАЙДЕНЫ!")
            print("  💡 Это объясняет почему парсер не находит ключевые слова в сообщениях")
        
        # Тестируем поиск в тестовом сообщении
        test_message = "Хоргос Алматы прямой склад"
        print(f"\n🧪 ТЕСТ ПОИСКА В СООБЩЕНИИ: '{test_message}'")
        
        if response_active.data:
            found = []
            test_lower = test_message.lower()
            for item in response_active.data:
                keyword = item['keyword'].lower()
                if keyword in test_lower:
                    found.append(keyword)
            
            if found:
                print(f"  ✅ Найдены ключевые слова: {found}")
            else:
                print("  ❌ Ключевые слова НЕ найдены в тестовом сообщении")
                print("  💡 Проверьте правильность ключевых слов или добавьте нужные")
        else:
            print("  ⚠️ Нет активных ключевых слов для проверки")
            
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔍 ДИАГНОСТИКА КЛЮЧЕВЫХ СЛОВ В БД")
    print("=" * 50)
    check_keywords_in_db()