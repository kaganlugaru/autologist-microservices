#!/usr/bin/env python3
"""
Быстрая проверка готовности системы к тестированию в продакшн
"""

import os
import requests
import json

# Настройки Supabase из .env
SUPABASE_URL = "https://sfjxwagatlcyhuellwlc.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmanh3YWdhdGxjeWh1ZWxsd2xjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDczMTY3MiwiZXhwIjoyMDQ2MzA3NjcyfQ.Ox0vIbhO8t0U_qSGhbAhbEPQ5a1HTXv27FPj0xzJMhI"

def check_keywords():
    """Проверяет активные ключевые слова"""
    print("🔍 Проверка ключевых слов...")
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/keywords?select=*&active=eq.true",
            headers=headers
        )
        
        if response.status_code == 200:
            keywords = response.json()
            print(f"✅ Найдено {len(keywords)} активных ключевых слов:")
            for kw in keywords:
                kw_type = "🔗 СЛОЖНОЕ" if ";" in kw['keyword'] else "📝 ПРОСТОЕ"
                print(f"   {kw_type}: '{kw['keyword']}'")
            return len(keywords) > 0
        else:
            print(f"❌ Ошибка получения ключевых слов: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def check_recipients():
    """Проверяет активных получателей"""
    print("\n👥 Проверка получателей...")
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/recipient_categories?select=*&active=eq.true",
            headers=headers
        )
        
        if response.status_code == 200:
            recipients = response.json()
            print(f"✅ Найдено {len(recipients)} активных получателей:")
            
            valid_recipients = 0
            for rec in recipients:
                contact = rec.get('phone') or rec.get('username')
                if contact:
                    contact_type = "📱 Телефон" if rec.get('phone') else "👤 Username"
                    print(f"   {contact_type}: {rec['name']} ({contact}) - {rec['category']}")
                    valid_recipients += 1
                else:
                    print(f"   ⚠️ {rec['name']} - НЕТ КОНТАКТОВ")
            
            print(f"📊 Получателей с контактами: {valid_recipients}/{len(recipients)}")
            return valid_recipients > 0
        else:
            print(f"❌ Ошибка получения получателей: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def check_monitored_chats():
    """Проверяет отслеживаемые чаты"""
    print("\n💬 Проверка отслеживаемых чатов...")
    
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}"
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/monitored_chats?select=*&active=eq.true",
            headers=headers
        )
        
        if response.status_code == 200:
            chats = response.json()
            print(f"✅ Найдено {len(chats)} активных чатов:")
            for chat in chats:
                print(f"   📱 {chat['chat_name']} (ID: {chat['chat_id']})")
            return len(chats) > 0
        else:
            print(f"❌ Ошибка получения чатов: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def main():
    print("🚀 ПРОВЕРКА ГОТОВНОСТИ К ТЕСТИРОВАНИЮ В ПРОДАКШН")
    print("=" * 60)
    
    # Проверяем компоненты
    keywords_ok = check_keywords()
    recipients_ok = check_recipients()
    chats_ok = check_monitored_chats()
    
    print("\n" + "=" * 60)
    print("📊 ИТОГОВЫЙ СТАТУС:")
    
    if keywords_ok and recipients_ok and chats_ok:
        print("✅ ВСЕ КОМПОНЕНТЫ ГОТОВЫ К ТЕСТИРОВАНИЮ!")
        print("\n🎯 РЕКОМЕНДАЦИЯ ДЛЯ ТЕСТА:")
        print("Отправьте в любой отслеживаемый чат:")
        print("💬 'Нужен тандем 140 куб на завтра'")
        print("\n🔍 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ:")
        print("- Парсер обнаружит ключевые слова: тандем, 140, тандем;140")
        print("- Отправит уведомления всем активным получателям")
        print("- Сохранит сообщение в таблицу messages")
        
    else:
        print("❌ ЕСТЬ ПРОБЛЕМЫ - ИСПРАВЬТЕ ПЕРЕД ТЕСТИРОВАНИЕМ:")
        if not keywords_ok:
            print("   🔍 Добавьте активные ключевые слова")
        if not recipients_ok:
            print("   👥 Добавьте получателей с контактами")
        if not chats_ok:
            print("   💬 Добавьте отслеживаемые чаты")
    
    print("=" * 60)

if __name__ == "__main__":
    main()