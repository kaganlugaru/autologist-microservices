import base64
import os

def convert_session_to_base64():
    session_file = "session_for_railway.session"
    
    if not os.path.exists(session_file):
        print(f"❌ Файл сессии не найден: {session_file}")
        return None
    
    try:
        with open(session_file, 'rb') as f:
            session_data = f.read()
        
        base64_data = base64.b64encode(session_data).decode('utf-8')
        
        # Сохраняем в файл для удобства
        with open('railway_session_base64.txt', 'w') as f:
            f.write(base64_data)
        
        print("✅ Base64 представление сессии создано!")
        print("📁 Сохранено в файл: railway_session_base64.txt")
        print("📋 Используйте этот файл для обновления Railway")
        print(f"📊 Размер: {len(session_data)} байт -> {len(base64_data)} символов base64")
        
        return base64_data
        
    except Exception as e:
        print(f"❌ Ошибка конвертации: {e}")
        return None

if __name__ == "__main__":
    convert_session_to_base64()