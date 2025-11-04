"""
Скрипт для обновления схемы базы данных - добавление полей first_name и last_name
"""
import os
import sys
from supabase import create_client, Client

def update_database_schema():
    """Добавляет поля first_name и last_name в таблицу messages"""
    
    # Получаем переменные окружения
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ ОШИБКА: Переменные окружения SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY не найдены")
        return False
    
    try:
        # Создаем клиент Supabase
        supabase = create_client(url, key)
        print("✅ Соединение с Supabase установлено")
        
        # SQL для добавления полей
        sql_commands = [
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS first_name TEXT;",
            "ALTER TABLE messages ADD COLUMN IF NOT EXISTS last_name TEXT;",
            "CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);",
            "CREATE INDEX IF NOT EXISTS idx_messages_first_name ON messages(first_name);"
        ]
        
        print("🔄 Обновление схемы базы данных...")
        
        for sql in sql_commands:
            try:
                result = supabase.rpc('exec_sql', {'sql': sql})
                print(f"✅ Выполнено: {sql[:50]}...")
            except Exception as e:
                # Некоторые команды могут не поддерживаться через RPC
                print(f"⚠️ Команда пропущена (возможно не поддерживается): {sql[:50]}...")
                continue
        
        print("✅ Обновление схемы завершено!")
        print("\n📋 ВАЖНО: Если команды не выполнились автоматически,")
        print("выполните следующий SQL вручную в Supabase SQL Editor:")
        print("\n" + "="*60)
        print("-- Добавление полей для имен пользователей")
        print("ALTER TABLE messages ADD COLUMN IF NOT EXISTS first_name TEXT;")
        print("ALTER TABLE messages ADD COLUMN IF NOT EXISTS last_name TEXT;")
        print("CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);")
        print("CREATE INDEX IF NOT EXISTS idx_messages_first_name ON messages(first_name);")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"❌ ОШИБКА при обновлении схемы: {e}")
        return False

if __name__ == "__main__":
    # Загружаем переменные окружения из .env файла telegram-parser
    env_path = os.path.join(os.path.dirname(__file__), "telegram-parser", ".env")
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if '=' in line and not line.strip().startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value
        print(f"✅ Загружены переменные окружения из {env_path}")
    
    success = update_database_schema()
    sys.exit(0 if success else 1)