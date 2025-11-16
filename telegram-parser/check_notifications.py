#!/usr/bin/env python3
"""
Быстрая проверка что происходит с получателями уведомлений
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

def check_notification_settings():
    """Проверяем настройки уведомлений"""
    
    # Подключение к Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ ОШИБКА: Не найдены переменные SUPABASE_URL или SUPABASE_KEY")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Подключение к Supabase успешно")
        
        # Проверяем получателей уведомлений
        print("\n📧 ПРОВЕРКА ПОЛУЧАТЕЛЕЙ УВЕДОМЛЕНИЙ:")
        
        # Ищем таблицы связанные с уведомлениями
        try:
            recipients_response = supabase.table('notification_recipients').select('*').execute()
            print(f"📋 Таблица 'notification_recipients': {len(recipients_response.data) if recipients_response.data else 0} записей")
            if recipients_response.data:
                for recipient in recipients_response.data:
                    active_status = "🟢 АКТИВЕН" if recipient.get('active') else "🔴 НЕ АКТИВЕН"
                    print(f"  {active_status} | {recipient.get('chat_id')} | {recipient.get('name', 'Без имени')}")
            else:
                print("  ❌ НЕТ получателей уведомлений!")
        except Exception as e:
            print(f"  ⚠️ Таблица notification_recipients не найдена: {e}")
        
        # Проверяем другие возможные таблицы
        try:
            recipients_response = supabase.table('recipients').select('*').execute()
            print(f"📋 Таблица 'recipients': {len(recipients_response.data) if recipients_response.data else 0} записей")
            if recipients_response.data:
                for recipient in recipients_response.data:
                    active_status = "🟢 АКТИВЕН" if recipient.get('active') else "🔴 НЕ АКТИВЕН"
                    print(f"  {active_status} | {recipient.get('chat_id')} | {recipient.get('name', 'Без имени')}")
        except Exception as e:
            print(f"  ⚠️ Таблица recipients не найдена: {e}")
        
        # Проверяем переменные окружения для уведомлений
        print(f"\n🔧 ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ:")
        notification_vars = ['NOTIFICATION_BOT_TOKEN', 'TELEGRAM_BOT_TOKEN', 'NOTIFICATION_CHAT_ID']
        for var in notification_vars:
            value = os.getenv(var)
            if value:
                print(f"  ✅ {var}: {'*' * (len(value) - 4)}{value[-4:]}" if len(value) > 4 else f"  ✅ {var}: {value}")
            else:
                print(f"  ❌ {var}: НЕ УСТАНОВЛЕНА")
        
        # Проверяем последние сообщения с ключевыми словами
        print(f"\n📨 ПОСЛЕДНИЕ СООБЩЕНИЯ С КЛЮЧЕВЫМИ СЛОВАМИ:")
        try:
            messages_response = supabase.table('messages').select('*').not_.is_('matched_keywords', 'null').limit(3).order('created_at', desc=True).execute()
            if messages_response.data:
                for msg in messages_response.data:
                    print(f"  📍 {msg.get('chat_name')} | Ключевые слова: {msg.get('matched_keywords')} | {msg.get('created_at')[:16]}")
                    print(f"     Текст: '{msg.get('message_text', '')[:80]}...'")
            else:
                print("  ❌ НЕТ сообщений с ключевыми словами!")
        except Exception as e:
            print(f"  ❌ Ошибка получения сообщений: {e}")
            
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("📧 ПРОВЕРКА НАСТРОЕК УВЕДОМЛЕНИЙ")
    print("=" * 50)
    check_notification_settings()