#!/usr/bin/env python3
"""
Управление Telegram сессиями для Railway и локальной разработки
"""

import os
import sys
from pathlib import Path

def check_sessions():
    """Проверяет наличие сессионных файлов"""
    local_session = Path("local_development.session")
    railway_session = Path("railway_production.session")
    
    print("=" * 50)
    print("📁 СОСТОЯНИЕ СЕССИЙ")
    print("=" * 50)
    
    if local_session.exists():
        size = local_session.stat().st_size / 1024
        print(f"[✓] local_development.session - {size:.1f} KB")
    else:
        print("[✗] local_development.session - НЕТ")
    
    if railway_session.exists():
        size = railway_session.stat().st_size / 1024
        print(f"[✓] railway_production.session - {size:.1f} KB")
    else:
        print("[✗] railway_production.session - НЕТ")
    
    print()

def get_current_env():
    """Получает текущее окружение из .env файла"""
    try:
        with open('.env', 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('RAILWAY_ENVIRONMENT='):
                    return line.split('=')[1].strip()
    except FileNotFoundError:
        return "НЕ НАЙДЕН .env"
    return "НЕ ЗАДАНО"

def set_environment(env_type):
    """Устанавливает тип окружения в .env файле"""
    try:
        with open('.env', 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'RAILWAY_ENVIRONMENT=' in content:
            content = content.replace(
                f'RAILWAY_ENVIRONMENT={get_current_env()}',
                f'RAILWAY_ENVIRONMENT={env_type}'
            )
        else:
            content = f'RAILWAY_ENVIRONMENT={env_type}\n' + content
        
        with open('.env', 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        return False

def main():
    print("🔧 УПРАВЛЕНИЕ TELEGRAM СЕССИЯМИ")
    print("=" * 50)
    
    check_sessions()
    
    current_env = get_current_env()
    print(f"🌍 Текущее окружение: {current_env}")
    
    if current_env == "production":
        print("📍 Активна: railway_production.session")
    elif current_env == "development":  
        print("📍 Активна: local_development.session")
    else:
        print("⚠️ Окружение не настроено!")
    
    print("\n" + "=" * 50)
    print("ДОСТУПНЫЕ ДЕЙСТВИЯ:")
    print("1. 💻 Переключить на ЛОКАЛЬНУЮ разработку")
    print("2. 🚄 Переключить на RAILWAY продакшн")
    print("3. 📋 Показать подробную конфигурацию")
    print("4. 🚪 Выход")
    print("=" * 50)
    
    while True:
        try:
            choice = input("\n👉 Выберите действие (1-4): ").strip()
            
            if choice == "1":
                print("\n💻 ПЕРЕКЛЮЧЕНИЕ НА ЛОКАЛЬНУЮ РАЗРАБОТКУ")
                print("-" * 40)
                if set_environment("development"):
                    print("✅ Настроено на локальную разработку")
                    print("📁 Будет использоваться: local_development.session")
                break
                
            elif choice == "2":
                print("\n🚄 ПЕРЕКЛЮЧЕНИЕ НА RAILWAY ПРОДАКШН")
                print("-" * 40)
                if set_environment("production"):
                    print("✅ Настроено на Railway продакшн")
                    print("📁 Будет использоваться: railway_production.session")
                break
                
            elif choice == "3":
                print("\n📋 ПОДРОБНАЯ КОНФИГУРАЦИЯ")
                print("-" * 40)
                print(f"Окружение: {get_current_env()}")
                
                # Показываем содержимое .env
                try:
                    with open('.env', 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                    
                    print("\n📝 Релевантные настройки .env:")
                    for line in lines:
                        if any(keyword in line for keyword in ['RAILWAY_ENVIRONMENT', 'TELEGRAM_']):
                            print(f"   {line.strip()}")
                except:
                    print("❌ Не удалось прочитать .env")
                continue
                
            elif choice == "4":
                print("\n👋 До свидания!")
                break
                
            else:
                print("❌ Неверный выбор. Попробуйте ещё раз.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Прервано пользователем")
            break
        except Exception as e:
            print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main()