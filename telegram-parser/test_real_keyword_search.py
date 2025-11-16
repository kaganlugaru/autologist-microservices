#!/usr/bin/env python3
"""
Тест поиска ключевых слов на реальных сообщениях из БД
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

def test_real_messages_keywords():
    """Тестируем поиск ключевых слов на реальных сообщениях"""
    
    # Подключение к Supabase
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ ОШИБКА: Не найдены переменные SUPABASE_URL или SUPABASE_KEY")
        return
    
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("✅ Подключение к Supabase успешно")
        
        # Получаем активные ключевые слова
        keywords_response = supabase.table('keywords').select('keyword').eq('active', True).execute()
        if not keywords_response.data:
            print("❌ НЕТ активных ключевых слов!")
            return
        
        keywords = [item['keyword'].lower() for item in keywords_response.data]
        print(f"\n📋 АКТИВНЫЕ КЛЮЧЕВЫЕ СЛОВА ({len(keywords)}):")
        for kw in keywords:
            print(f"  - '{kw}'")
        
        # Получаем последние сообщения где есть слово "груз"
        print(f"\n🔍 ПОИСК СООБЩЕНИЙ СО СЛОВОМ 'ГРУЗ':")
        
        # Поиск сообщений содержащих "груз" в тексте
        messages_with_gruz = supabase.table('messages').select('*').ilike('message_text', '%груз%').order('created_at', desc=True).limit(5).execute()
        
        if messages_with_gruz.data:
            print(f"📊 Найдено {len(messages_with_gruz.data)} сообщений со словом 'груз':")
            
            for i, msg in enumerate(messages_with_gruz.data, 1):
                print(f"\n{i}. СООБЩЕНИЕ ID {msg.get('id')}:")
                print(f"   📝 Текст: '{msg.get('message_text', '')[:120]}...'")
                print(f"   📅 Дата: {msg.get('created_at', '')[:16]}")
                print(f"   💬 Чат: {msg.get('chat_name')}")
                print(f"   🏷️ Matched keywords в БД: {msg.get('matched_keywords')}")
                
                # Проверяем поиск ключевых слов вручную
                message_text = msg.get('message_text', '').lower()
                found_manually = []
                
                for keyword in keywords:
                    if ';' in keyword:
                        # Составное ключевое слово
                        parts = [part.strip() for part in keyword.split(';')]
                        if all(part and part in message_text for part in parts):
                            found_manually.append(keyword)
                    else:
                        # Простое ключевое слово
                        if keyword in message_text:
                            found_manually.append(keyword)
                
                print(f"   🧪 Найдено ВРУЧНУЮ: {found_manually}")
                
                if found_manually and not msg.get('matched_keywords'):
                    print(f"   ⚠️ ПРОБЛЕМА: Ключевые слова найдены вручную, но НЕ сохранены в БД!")
                elif not found_manually and msg.get('matched_keywords'):
                    print(f"   ⚠️ СТРАННО: В БД есть matched_keywords, но вручную не найдены")
                elif found_manually and msg.get('matched_keywords'):
                    print(f"   ✅ ОК: Совпадение ручной проверки и БД")
                else:
                    print(f"   ❌ НИ ОДИН способ не нашел ключевые слова")
        else:
            print("❌ НЕТ сообщений со словом 'груз' в БД")
        
        # Дополнительно проверим все сообщения с matched_keywords
        print(f"\n📨 СООБЩЕНИЯ С НАЙДЕННЫМИ КЛЮЧЕВЫМИ СЛОВАМИ В БД:")
        messages_with_keywords = supabase.table('messages').select('*').not_.is_('matched_keywords', 'null').neq('matched_keywords', '[]').order('created_at', desc=True).limit(3).execute()
        
        if messages_with_keywords.data:
            for msg in messages_with_keywords.data:
                print(f"   📍 {msg.get('chat_name')} | {msg.get('created_at', '')[:16]}")
                print(f"     🏷️ Keywords: {msg.get('matched_keywords')}")
                print(f"     📝 Текст: '{msg.get('message_text', '')[:80]}...'")
        else:
            print("❌ НЕТ сообщений с сохраненными ключевыми словами")
            
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔍 ТЕСТ ПОИСКА КЛЮЧЕВЫХ СЛОВ НА РЕАЛЬНЫХ ДАННЫХ")
    print("=" * 60)
    test_real_messages_keywords()