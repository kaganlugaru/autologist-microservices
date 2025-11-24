# 🔧 Настройка переменных окружения на Render.com

## 🚨 КРИТИЧНО: Обязательные переменные для работы

После исправления CORS ошибок вам необходимо настроить переменные окружения на Render:

### 📋 Список обязательных переменных:

1. **SUPABASE_URL** - URL вашей Supabase базы данных
2. **SUPABASE_SERVICE_ROLE_KEY** - Service Role ключ для обхода RLS
3. **JWT_SECRET** - Секретный ключ для JWT токенов

### 🛠 Как настроить на Render:

1. Зайдите в ваш **Render Dashboard**
2. Откройте ваш **Web Service** (autologist-microservices)
3. Перейдите в раздел **Environment**
4. Добавьте переменные:

```bash
# База данных Supabase
SUPABASE_URL=https://ваш-проект.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...ваш-service-role-ключ

# JWT секрет для аутентификации
JWT_SECRET=autologist_secret_key_production_2024

# Порт (обычно Render устанавливает автоматически)
PORT=10000
```

### 🔍 Где найти Supabase данные:

1. **Supabase URL:**
   - Зайдите в Supabase Dashboard
   - Откройте ваш проект
   - Settings → API
   - Project URL

2. **Service Role Key:**
   - Settings → API
   - Project API keys
   - service_role (secret)

### ⚠️ Важные моменты:

- **Service Role Key** должен быть именно service_role, не anon
- **JWT_SECRET** лучше сделать уникальным для production
- После добавления переменных **Redeploy** ваш сервис
- Убедитесь что все переменные сохранены и не содержат лишних пробелов

### 🔄 После настройки:

1. **Redeploy** сервис на Render
2. Проверьте логи на наличие ошибок
3. Проверьте что база данных подключается
4. Протестируйте аутентификацию

### 🚨 Диагностика проблем:

Если после настройки все еще есть ошибки, проверьте логи Render:
- Dashboard → Logs
- Ищите сообщения о SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY
- Должно быть "База данных: подключена"

---

**🎯 После выполнения этих шагов CORS и база данных должны работать корректно!**