"""
Тестирование ключевых слов в локальном парсере
"""
import requests
import time

def test_keywords():
    """Проверяем текущие ключевые слова в БД"""
    print("🔍 Проверка ключевых слов в БД...")
    
    # URL для проверки ключевых слов
    supabase_url = "https://sfjxwagatlcyhuellwlc.supabase.co"
    
    # Проверяем ключевые слова
    response = requests.get(f"{supabase_url}/rest/v1/keywords?select=*&active=eq.True")
    if response.status_code == 200:
        keywords = response.json()
        print(f"📋 Найдено {len(keywords)} активных ключевых слов:")
        for kw in keywords:
            print(f"  - '{kw['keyword']}' (категория: {kw.get('category', 'НЕТ')})")
    else:
        print(f"❌ Ошибка получения ключевых слов: {response.status_code}")
    
    print("\n" + "="*50)
    
    # Проверяем получателей
    print("👥 Проверка получателей...")
    response = requests.get(f"{supabase_url}/rest/v1/recipient_categories?select=*&active=eq.True")
    if response.status_code == 200:
        recipients = response.json()
        print(f"📋 Найдено {len(recipients)} активных получателей:")
        for rec in recipients:
            print(f"  - {rec['name']} ({rec['phone']}) -> категория: {rec['category']}")
    else:
        print(f"❌ Ошибка получения получателей: {response.status_code}")

def check_test_messages():
    """Проверяем последние сообщения из тестового чата"""
    print("\n🔍 Последние сообщения из тестового чата...")
    
    supabase_url = "https://sfjxwagatlcyhuellwlc.supabase.co"
    
    response = requests.get(f"{supabase_url}/rest/v1/messages?select=*&chat_name=like.*Калжат*&order=created_at.desc&limit=5")
    if response.status_code == 200:
        messages = response.json()
        print(f"📋 Последние {len(messages)} сообщений:")
        for i, msg in enumerate(messages, 1):
            text = msg['message_text'][:50] + "..." if len(msg['message_text']) > 50 else msg['message_text']
            print(f"  {i}. {msg['created_at']}: {text}")
            print(f"     Ключевые слова найдены: {msg.get('keywords_found', 'НЕТ ДАННЫХ')}")
            print(f"     Отправлено: {msg.get('sent_to_recipients', 'НЕТ ДАННЫХ')}")
    else:
        print(f"❌ Ошибка получения сообщений: {response.status_code}")

if __name__ == "__main__":
    test_keywords()
    check_test_messages()
    
    print("\n" + "="*60)
    print("💡 РЕКОМЕНДАЦИИ ДЛЯ ТЕСТИРОВАНИЯ:")
    print("1. Напишите в тестовый чат: 'тандем груз москва'")
    print("2. Напишите в тестовый чат: 'тандем;140 тест'") 
    print("3. Проверьте номера телефонов получателей")
    print("4. Убедитесь что номера существуют в Telegram")