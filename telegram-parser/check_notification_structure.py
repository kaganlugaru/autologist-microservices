#!/usr/bin/env python3
"""
Проверка структуры уведомлений через категории
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

def check_notification_structure():
    """Проверяем полную структуру уведомлений"""
    
    # Подключение к Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ ОШИБКА: Не найдены переменные SUPABASE_URL или SUPABASE_KEY")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Подключение к Supabase успешно")
        
        # 1. Проверяем ключевые слова с категориями
        print("\n📋 КЛЮЧЕВЫЕ СЛОВА С КАТЕГОРИЯМИ:")
        keywords_response = supabase.table('keywords').select('*').eq('active', True).execute()
        if keywords_response.data:
            for kw in keywords_response.data:
                category = kw.get('category', 'БЕЗ КАТЕГОРИИ')
                print(f"  📝 '{kw.get('keyword')}' → Категория: {category}")
        else:
            print("  ❌ НЕТ активных ключевых слов!")
        
        # 2. Проверяем категории получателей
        print("\n👥 КАТЕГОРИИ ПОЛУЧАТЕЛЕЙ:")
        try:
            categories_response = supabase.table('recipient_categories').select('*').execute()
            if categories_response.data:
                for cat in categories_response.data:
                    active_status = "🟢 АКТИВНА" if cat.get('active') else "🔴 НЕ АКТИВНА"
                    print(f"  {active_status} | Категория: '{cat.get('category')}' | Описание: {cat.get('description', 'Нет')}")
            else:
                print("  ❌ НЕТ категорий получателей!")
        except Exception as e:
            print(f"  ❌ Ошибка получения категорий: {e}")
        
        # 3. Проверяем получателей
        print("\n📧 ПОЛУЧАТЕЛИ УВЕДОМЛЕНИЙ:")
        try:
            recipients_response = supabase.table('notification_recipients').select('*').execute()
            if recipients_response.data:
                for recipient in recipients_response.data:
                    active_status = "🟢 АКТИВЕН" if recipient.get('active') else "🔴 НЕ АКТИВЕН"
                    contact = recipient.get('phone_number') or recipient.get('telegram_username') or recipient.get('chat_id', 'Нет контакта')
                    category = recipient.get('category', 'БЕЗ КАТЕГОРИИ')
                    print(f"  {active_status} | {recipient.get('name', 'Без имени')} | {contact} | Категория: {category}")
            else:
                print("  ❌ НЕТ получателей уведомлений!")
        except Exception as e:
            print(f"  ❌ Ошибка получения получателей: {e}")
            # Попробуем альтернативную таблицу
            try:
                recipients_response = supabase.table('recipients').select('*').execute()
                if recipients_response.data:
                    for recipient in recipients_response.data:
                        active_status = "🟢 АКТИВЕН" if recipient.get('active') else "🔴 НЕ АКТИВЕН"
                        contact = recipient.get('phone_number') or recipient.get('telegram_username') or recipient.get('chat_id', 'Нет контакта')
                        category = recipient.get('category', 'БЕЗ КАТЕГОРИИ')
                        print(f"  {active_status} | {recipient.get('name', 'Без имени')} | {contact} | Категория: {category}")
                else:
                    print("  ❌ НЕТ получателей в таблице 'recipients'!")
            except Exception as e2:
                print(f"  ❌ Ошибка с альтернативной таблицей: {e2}")
        
        # 4. Тестовый запрос категорий для ключевого слова "груз"
        print(f"\n🧪 ТЕСТ ПОЛУЧЕНИЯ ПОЛУЧАТЕЛЕЙ ДЛЯ 'груз':")
        test_keyword = "груз"
        
        # Ищем категорию для ключевого слова
        keyword_response = supabase.table('keywords').select('category').eq('keyword', test_keyword).eq('active', True).execute()
        if keyword_response.data:
            for row in keyword_response.data:
                category = row.get('category')
                print(f"  📝 Ключевое слово 'груз' → Категория: {category}")
                
                if category:
                    # Ищем получателей для этой категории
                    try:
                        recipients_for_category = supabase.table('notification_recipients').select('*').eq('category', category).eq('active', True).execute()
                        if recipients_for_category.data:
                            print(f"  👥 Получатели для категории '{category}':")
                            for rec in recipients_for_category.data:
                                contact = rec.get('phone_number') or rec.get('telegram_username') or rec.get('chat_id')
                                print(f"    📧 {rec.get('name', 'Без имени')} | {contact}")
                        else:
                            print(f"  ❌ НЕТ получателей для категории '{category}'!")
                    except:
                        print(f"  ⚠️ Ошибка поиска получателей для категории '{category}'")
        else:
            print(f"  ❌ Ключевое слово 'груз' не имеет категории!")
            
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔍 ПРОВЕРКА СТРУКТУРЫ УВЕДОМЛЕНИЙ")
    print("=" * 60)
    check_notification_structure()