#!/usr/bin/env python3
"""
Диагностический скрипт для тестирования поиска ключевых слов
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

def test_keyword_detection():
    """Тестируем поиск ключевых слов в реальных сообщениях из логов"""
    
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
        response_active = supabase.table('keywords').select('keyword').eq('active', True).execute()
        if not response_active.data:
            print("❌ НЕТ активных ключевых слов в БД!")
            return
        
        keywords = [item['keyword'].lower() for item in response_active.data]
        print(f"\n📋 АКТИВНЫЕ КЛЮЧЕВЫЕ СЛОВА ({len(keywords)}):")
        for kw in keywords:
            print(f"  - '{kw}'")
        
        # Тестовые сообщения из логов
        test_messages = [
            "Алашанькоу Брест нужны 3 тента 105ки Груз стандарт вес 22т Фрахт 6600$",
            "Алашанькоу 🇨🇳 - Москва 🇷🇺 Нужен РЭФ режим +15 Груз химикат Вес 20,5 тонна",
            "**Бахты Новосибирск ** **Фрак 2800$** **Тент надо** **Груз 20т оборудование ** **Груз готов**",
            "Хоргос Алашонкоу Москва 105 кубтар керек груз оборудования фрахт 8000$",
            "С Хоргос-в Чу нужна площадка 17м 5оська 2500$",
            "Сухой порт -Баку через курык автовоз керек",
            "Ассаламалейкум Хоргос(Стоянка)-Москва Ленинградский пост Зикр 001",
            "17 метров 7 ось предложите груз"
        ]
        
        print(f"\n🧪 ТЕСТИРОВАНИЕ НА {len(test_messages)} СООБЩЕНИЯХ:")
        print("=" * 80)
        
        for i, message in enumerate(test_messages, 1):
            print(f"\n{i}. СООБЩЕНИЕ: '{message[:60]}{'...' if len(message) > 60 else ''}'")
            message_lower = message.lower()
            
            found_keywords = []
            
            # Проверяем каждое ключевое слово
            for keyword in keywords:
                # Проверяем, содержит ли ключевое слово оператор логического И (;)
                if ';' in keyword:
                    # Разбиваем ключевое слово на части по символу ;
                    keyword_parts = [part.strip() for part in keyword.split(';')]
                    
                    # Проверяем, что ВСЕ части присутствуют в тексте
                    all_parts_found = True
                    found_parts = []
                    for part in keyword_parts:
                        if part and part in message_lower:
                            found_parts.append(part)
                        elif part:
                            all_parts_found = False
                            break
                    
                    # Если все части найдены, добавляем в результат
                    if all_parts_found and len(keyword_parts) > 1:
                        found_keywords.append(keyword)
                        print(f"   ✅ НАЙДЕНО (составное): '{keyword}' (части: {found_parts})")
                    else:
                        if found_parts:
                            print(f"   ⚠️ ЧАСТИЧНО: '{keyword}' (найдены: {found_parts}, не найдены: {[p for p in keyword_parts if p not in message_lower]})")
                else:
                    # Обычная проверка для простых ключевых слов
                    if keyword in message_lower:
                        found_keywords.append(keyword)
                        print(f"   ✅ НАЙДЕНО: '{keyword}'")
            
            if not found_keywords:
                print("   ❌ КЛЮЧЕВЫЕ СЛОВА НЕ НАЙДЕНЫ")
                # Покажем какие слова вообще есть в сообщении
                words_in_message = set(message_lower.replace(',', ' ').replace('.', ' ').replace('!', ' ').replace('*', ' ').replace('(', ' ').replace(')', ' ').replace(':', ' ').split())
                print(f"   📝 Слова в сообщении: {list(words_in_message)[:10]}...")
            else:
                print(f"   🎯 ИТОГО НАЙДЕНО: {found_keywords}")
        
        print(f"\n📊 ОБЩАЯ СТАТИСТИКА:")
        messages_with_keywords = 0
        for message in test_messages:
            message_lower = message.lower()
            has_keywords = False
            for keyword in keywords:
                if ';' in keyword:
                    keyword_parts = [part.strip() for part in keyword.split(';')]
                    all_parts_found = all(part and part in message_lower for part in keyword_parts)
                    if all_parts_found and len(keyword_parts) > 1:
                        has_keywords = True
                        break
                else:
                    if keyword in message_lower:
                        has_keywords = True
                        break
            if has_keywords:
                messages_with_keywords += 1
        
        print(f"  📨 Всего сообщений: {len(test_messages)}")
        print(f"  ✅ С ключевыми словами: {messages_with_keywords}")
        print(f"  ❌ Без ключевых слов: {len(test_messages) - messages_with_keywords}")
        
        if messages_with_keywords == 0:
            print(f"\n💡 РЕКОМЕНДАЦИЯ: Добавить ключевые слова:")
            all_words = set()
            for message in test_messages:
                words = message.lower().replace(',', ' ').replace('.', ' ').replace('!', ' ').replace('*', ' ').replace('(', ' ').replace(')', ' ').replace(':', ' ').split()
                all_words.update(words)
            
            common_words = ['хоргос', 'алашанькоу', 'груз', 'москва', 'тент', 'нужен', 'фрахт', 'куб', 'тонн', 'оборудование', 'готов']
            suggested = [w for w in common_words if w in all_words]
            print(f"  Предлагаемые ключевые слова: {suggested}")
            
    except Exception as e:
        print(f"❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🔍 ДЕТАЛЬНАЯ ДИАГНОСТИКА ПОИСКА КЛЮЧЕВЫХ СЛОВ")
    print("=" * 60)
    test_keyword_detection()