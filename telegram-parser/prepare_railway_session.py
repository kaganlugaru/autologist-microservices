"""
Скрипт для подготовки файла сессии для Railway
Конвертирует локальную рабочую сессию в формат для Railway
"""
import shutil
import os

def prepare_railway_session():
    # Рабочая сессия
    source_session = "session_for_railway.session"
    # Целевое имя для Railway
    target_session = "autologist_session.session"
    
    if not os.path.exists(source_session):
        print(f"❌ Файл {source_session} не найден!")
        return False
    
    try:
        # Создаем резервную копию текущей сессии
        if os.path.exists(target_session):
            backup_name = f"{target_session}.backup"
            shutil.copy2(target_session, backup_name)
            print(f"📦 Создана резервная копия: {backup_name}")
        
        # Копируем рабочую сессию
        shutil.copy2(source_session, target_session)
        
        # Проверяем размеры
        source_size = os.path.getsize(source_session)
        target_size = os.path.getsize(target_session)
        
        print("✅ Сессия подготовлена для Railway!")
        print(f"📊 Исходный файл: {source_session} ({source_size:,} байт)")
        print(f"📊 Целевой файл: {target_session} ({target_size:,} байт)")
        print(f"✅ Размеры совпадают: {source_size == target_size}")
        
        print("\n🚀 Что дальше:")
        print("1. Загрузите файл autologist_session.session в Railway")
        print("2. Замените им старый файл сессии")
        print("3. Сделайте redeploy")
        
        return True
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Подготовка сессии для Railway...\n")
    prepare_railway_session()