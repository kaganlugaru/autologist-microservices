#!/usr/bin/env python3
"""
Скрипт для добавления логистических ключевых слов в БД
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

def add_logistics_keywords():
    """Добавляем ключевые слова связанные с логистикой и транспортом"""
    
    # Подключение к Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ ОШИБКА: Не найдены переменные SUPABASE_URL или SUPABASE_KEY")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Подключение к Supabase успешно")
        
        # Новые ключевые слова для логистики
        new_keywords = [
            # Города и направления
            'хоргос',
            'алматы', 
            'москва',
            'астана',
            'алашанкоу',
            'минск',
            'ташкент',
            'тяньцзинь',
            
            # Логистические термины
            'склад',
            'прямой',
            'контейнер',
            'полуприцеп',
            'тандем',
            'автовозы',
            'фура',
            'полуприцепы',
            'автопоезд',
            
            # Услуги и операции
            'отправка',
            'доставка',
            'перевозка',
            'маршрут',
            'груз',
            'тон',
            'тонн',
            'вес',
            'объем',
            
            # Специфические термины
            'ось',
            'осей',
            'растаможка',
            'погрузка',
            'выгрузка',
            'экспорт',
            'импорт',
            
            # Числовые характеристики (в сочетаниях)
            'тент',
            'рефрижератор',
            'температура',
            'срочно',
            'нужен',
            'предложите'
        ]
        
        print(f"\n📝 ДОБАВЛЕНИЕ {len(new_keywords)} НОВЫХ КЛЮЧЕВЫХ СЛОВ:")
        
        # Проверяем какие уже есть
        existing_response = supabase.table('keywords').select('keyword').execute()
        existing_keywords = {item['keyword'].lower() for item in existing_response.data}
        
        added_count = 0
        for keyword in new_keywords:
            if keyword.lower() not in existing_keywords:
                try:
                    result = supabase.table('keywords').insert({
                        'keyword': keyword,
                        'active': True
                    }).execute()
                    print(f"  ✅ Добавлено: '{keyword}'")
                    added_count += 1
                except Exception as e:
                    print(f"  ❌ Ошибка добавления '{keyword}': {e}")
            else:
                print(f"  ⚠️ Уже существует: '{keyword}'")
        
        print(f"\n📊 РЕЗУЛЬТАТ:")
        print(f"  ✅ Добавлено новых ключевых слов: {added_count}")
        print(f"  ⚠️ Уже существовало: {len(new_keywords) - added_count}")
        
        # Тестируем снова
        print(f"\n🧪 ПОВТОРНЫЙ ТЕСТ ПОИСКА:")
        test_message = "Хоргос Алматы прямой склад"
        print(f"Сообщение: '{test_message}'")
        
        # Перезагружаем активные ключевые слова
        response_active = supabase.table('keywords').select('keyword').eq('active', True).execute()
        if response_active.data:
            found = []
            test_lower = test_message.lower()
            for item in response_active.data:
                keyword = item['keyword'].lower()
                if keyword in test_lower:
                    found.append(keyword)
            
            if found:
                print(f"  ✅ НАЙДЕНЫ ключевые слова: {found}")
                print("  🎉 Теперь парсер должен корректно работать!")
            else:
                print("  ❌ Ключевые слова ВСЁ ЕЩЁ НЕ найдены")
        
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("📝 ДОБАВЛЕНИЕ ЛОГИСТИЧЕСКИХ КЛЮЧЕВЫХ СЛОВ")
    print("=" * 60)
    add_logistics_keywords()