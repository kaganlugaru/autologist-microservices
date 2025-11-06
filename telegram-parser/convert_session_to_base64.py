# Создание base64 версии сессии для Railway
import base64
import os

def session_to_base64(session_file_path):
    """Конвертирует файл сессии в base64 строку для Railway"""
    try:
        with open(session_file_path, 'rb') as f:
            session_data = f.read()
        
        base64_data = base64.b64encode(session_data).decode('utf-8')
        
        print(f"🔄 Конвертация файла: {session_file_path}")
        print(f"📏 Размер файла: {len(session_data)} байт")
        print(f"📏 Размер base64: {len(base64_data)} символов")
        print(f"\n📋 BASE64 строка для переменной окружения в Railway:")
        print("=" * 80)
        print(base64_data)
        print("=" * 80)
        
        # Сохраняем в файл для удобства
        with open('session_base64.txt', 'w') as f:
            f.write(base64_data)
        
        print(f"\n✅ Сохранено в файл: session_base64.txt")
        print(f"\n📝 Инструкция для Railway:")
        print("1. Скопируйте base64 строку выше")
        print("2. В Railway Dashboard перейдите в Variables")
        print("3. Добавьте переменную TELEGRAM_SESSION_BASE64")
        print("4. Вставьте base64 строку как значение")
        print("5. Сделайте redeploy")
        
        return base64_data
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return None

if __name__ == "__main__":
    session_file = "autologist_session_for_railway.session"
    if os.path.exists(session_file):
        session_to_base64(session_file)
    else:
        print(f"❌ Файл {session_file} не найден")