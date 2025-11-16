#!/usr/bin/env python3
"""
Принудительный тест системы с текущими настройками
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

def force_test_current_system():
    """Принудительно тестируем текущее состояние системы"""
    
    # Подключение к Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ ОШИБКА: Не найдены переменные SUPABASE_URL или SUPABASE_KEY")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Подключение к Supabase успешно")
        
        print("\n🧪 ПРИНУДИТЕЛЬНЫЙ ТЕСТ ПОЛНОЙ СИСТЕМЫ")
        print("="*60)
        
        # 1. Загружаем ключевые слова как в парсере
        print("\n1️⃣ ЗАГРУЗКА КЛЮЧЕВЫХ СЛОВ КАК В ПАРСЕРЕ:")
        keywords_response = supabase.table('keywords').select('keyword').eq('active', True).execute()
        keywords = [item['keyword'].lower() for item in keywords_response.data]
        print(f"   📋 Загружено: {len(keywords)} ключевых слов")
        print(f"   📝 Список: {keywords}")
        
        # 2. Тестовое сообщение
        test_message = "Алашонкоу - Москва\nТребуется тентовки 92-96-105\nГруз готов 20 тонн\nФрахт 6500$"
        print(f"\n2️⃣ ТЕСТОВОЕ СООБЩЕНИЕ:")
        print(f"   📨 '{test_message}'")
        
        # 3. Имитируем функцию check_keywords
        print(f"\n3️⃣ ИМИТАЦИЯ check_keywords:")
        found_keywords = []
        text_lower = test_message.lower()
        print(f"   🔤 Текст в нижнем регистре: '{text_lower}'")
        
        for keyword in keywords:
            print(f"\n   🔍 Проверяем ключевое слово: '{keyword}'")
            if ';' in keyword:
                keyword_parts = [part.strip() for part in keyword.split(';')]
                print(f"      📚 Составное слово, части: {keyword_parts}")
                
                all_parts_found = True
                found_parts = []
                for part in keyword_parts:
                    if part and part in text_lower:
                        found_parts.append(part)
                        print(f"      ✅ Часть '{part}' найдена")
                    elif part:
                        all_parts_found = False
                        print(f"      ❌ Часть '{part}' НЕ найдена")
                        break
                
                if all_parts_found and len(keyword_parts) > 1:
                    found_keywords.append(keyword)
                    print(f"      🎯 СОСТАВНОЕ СЛОВО НАЙДЕНО: '{keyword}'")
            else:
                print(f"      📝 Простое слово")
                if keyword in text_lower:
                    found_keywords.append(keyword)
                    print(f"      🎯 ПРОСТОЕ СЛОВО НАЙДЕНО: '{keyword}'")
                else:
                    print(f"      ❌ Простое слово НЕ найдено")
        
        print(f"\n📊 ИТОГОВЫЙ РЕЗУЛЬТАТ:")
        print(f"   🎯 Найденные ключевые слова: {found_keywords}")
        print(f"   📈 Количество: {len(found_keywords)}")
        
        # 4. Поиск получателей для найденных ключевых слов
        if found_keywords:
            print(f"\n4️⃣ ПОИСК ПОЛУЧАТЕЛЕЙ:")
            categories = set()
            
            for keyword in found_keywords:
                keyword_variants = [keyword.lower(), keyword.upper(), keyword.capitalize()]
                for variant in keyword_variants:
                    response = supabase.table('keywords').select('category').eq('keyword', variant).eq('active', True).execute()
                    for row in response.data:
                        if row.get('category'):
                            categories.add(row['category'])
                            print(f"   📂 Ключевое слово '{keyword}' → Категория: '{row['category']}'")
            
            print(f"\n   📋 Уникальные категории: {list(categories)}")
            
            # Поиск получателей
            recipients = []
            for category in categories:
                response = supabase.table('recipient_categories').select('*').eq('category', category).eq('active', True).execute()
                recipients.extend(response.data)
                print(f"   👥 Для категории '{category}': {len(response.data)} получателей")
            
            print(f"\n   📧 ИТОГО ПОЛУЧАТЕЛЕЙ: {len(recipients)}")
            for r in recipients:
                contact = r.get('phone') or r.get('username') or 'Нет контакта'
                print(f"     📱 {r.get('name')} | {contact}")
            
            if recipients:
                print(f"\n🎉 ВСЁ РАБОТАЕТ! Система должна отправить уведомления!")
            else:
                print(f"\n❌ НЕТ ПОЛУЧАТЕЛЕЙ для отправки")
        else:
            print(f"\n❌ НЕТ КЛЮЧЕВЫХ СЛОВ - уведомления не будут отправлены")
            
        # 5. Проверяем что происходит в production
        print(f"\n5️⃣ АНАЛИЗ PRODUCTION ПРОБЛЕМЫ:")
        print("   💡 Если этот тест показывает что всё работает, но в production не работает:")
        print("   - Парсер может не перезагружать ключевые слова")
        print("   - Может быть проблема с кодировкой текста")
        print("   - Может быть проблема с обработкой None значений")
        print("   - Нужно перезапустить парсер для применения изменений в коде")
            
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    force_test_current_system()