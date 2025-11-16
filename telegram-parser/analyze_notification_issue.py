#!/usr/bin/env python3
"""
Системный анализ проблемы с рассылкой уведомлений
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

def analyze_notification_system():
    """Полный анализ системы уведомлений"""
    
    # Подключение к Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ ОШИБКА: Не найдены переменные SUPABASE_URL или SUPABASE_KEY")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Подключение к Supabase успешно")
        
        print("\n" + "="*80)
        print("🔍 СИСТЕМНЫЙ АНАЛИЗ ПРОБЛЕМЫ С РАССЫЛКОЙ")
        print("="*80)
        
        # 1. АНАЛИЗ СТРУКТУРЫ БД
        print("\n📊 1. АНАЛИЗ СТРУКТУРЫ БАЗЫ ДАННЫХ:")
        print("-" * 50)
        
        # Проверяем все возможные таблицы получателей
        recipient_tables = ['recipient_categories', 'notification_recipients', 'recipients']
        found_tables = []
        
        for table in recipient_tables:
            try:
                response = supabase.table(table).select('*').limit(1).execute()
                found_tables.append(table)
                print(f"✅ Таблица '{table}' - СУЩЕСТВУЕТ")
            except Exception as e:
                print(f"❌ Таблица '{table}' - НЕ НАЙДЕНА: {str(e)[:50]}...")
        
        # 2. АНАЛИЗ ДАННЫХ В RECIPIENT_CATEGORIES
        print(f"\n📋 2. ДАННЫЕ В 'recipient_categories':")
        print("-" * 50)
        
        try:
            cat_response = supabase.table('recipient_categories').select('*').execute()
            if cat_response.data:
                print(f"📊 Найдено записей: {len(cat_response.data)}")
                for item in cat_response.data:
                    print(f"  ID: {item.get('id')} | Имя: '{item.get('name')}' | Username: '{item.get('username')}' | Категория: '{item.get('category')}' | Активность: {item.get('active')}")
                    if item.get('phone'):
                        print(f"    📱 Телефон: {item.get('phone')}")
            else:
                print("❌ НЕТ данных в recipient_categories")
        except Exception as e:
            print(f"❌ Ошибка чтения recipient_categories: {e}")
        
        # 3. АНАЛИЗ КЛЮЧЕВЫХ СЛОВ
        print(f"\n🔑 3. АНАЛИЗ КЛЮЧЕВЫХ СЛОВ:")
        print("-" * 50)
        
        try:
            keywords_response = supabase.table('keywords').select('*').eq('active', True).execute()
            if keywords_response.data:
                print(f"📊 Активных ключевых слов: {len(keywords_response.data)}")
                categories = set()
                for kw in keywords_response.data:
                    category = kw.get('category')
                    if category:
                        categories.add(category)
                    print(f"  '{kw.get('keyword')}' → Категория: {category}")
                
                print(f"\n📂 Уникальные категории ключевых слов: {list(categories)}")
            else:
                print("❌ НЕТ активных ключевых слов")
        except Exception as e:
            print(f"❌ Ошибка анализа ключевых слов: {e}")
        
        # 4. ТЕСТ ПОЛУЧЕНИЯ ПОЛУЧАТЕЛЕЙ ДЛЯ КАТЕГОРИИ
        print(f"\n🧪 4. ТЕСТ ПОЛУЧЕНИЯ ПОЛУЧАТЕЛЕЙ:")
        print("-" * 50)
        
        test_categories = ['грузоперевозки']
        for category in test_categories:
            print(f"\n🎯 Тест для категории '{category}':")
            
            try:
                # Пробуем найти получателей в recipient_categories
                recipients = supabase.table('recipient_categories').select('*').eq('category', category).eq('active', True).execute()
                
                if recipients.data:
                    print(f"  ✅ Найдено {len(recipients.data)} получателей:")
                    for r in recipients.data:
                        contact = r.get('phone') or r.get('username') or r.get('chat_id', 'Нет контакта')
                        print(f"    📧 {r.get('name')} | {contact}")
                else:
                    print(f"  ❌ НЕТ получателей для категории '{category}'")
            except Exception as e:
                print(f"  ❌ Ошибка поиска получателей: {e}")
        
        # 5. ПРОВЕРКА ПОСЛЕДНИХ СООБЩЕНИЙ
        print(f"\n📨 5. АНАЛИЗ ПОСЛЕДНИХ СООБЩЕНИЙ:")
        print("-" * 50)
        
        try:
            recent_messages = supabase.table('messages').select('*').order('created_at', desc=True).limit(5).execute()
            if recent_messages.data:
                for msg in recent_messages.data:
                    keywords = msg.get('matched_keywords', [])
                    has_keywords = len(keywords) > 0 if keywords else False
                    status = "✅ ЕСТЬ КЛЮЧЕВЫЕ СЛОВА" if has_keywords else "❌ НЕТ КЛЮЧЕВЫХ СЛОВ"
                    
                    print(f"\n📍 {msg.get('chat_name')} | {msg.get('created_at', '')[:16]}")
                    print(f"  {status}: {keywords}")
                    print(f"  📝 Текст: '{msg.get('message_text', '')[:80]}...'")
        except Exception as e:
            print(f"❌ Ошибка анализа сообщений: {e}")
        
        # 6. РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ
        print(f"\n💡 6. РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:")
        print("-" * 50)
        
        print("🔧 Проблемы которые нужно исправить:")
        
        # Анализируем что именно сломано
        has_recipients = False
        try:
            recipients_count = len(supabase.table('recipient_categories').select('id').eq('active', True).execute().data)
            has_recipients = recipients_count > 0
        except:
            pass
        
        if not has_recipients:
            print("  ❌ НЕТ активных получателей - добавить получателей")
        else:
            print("  ✅ Получатели есть")
            print("  💡 Проблема скорее всего в коде получения получателей")
            print("     - Проверить правильность названия таблицы в коде")
            print("     - Проверить правильность полей в запросе")
            print("     - Добавить детальное логирование")
        
    except Exception as e:
        print(f"❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    analyze_notification_system()