# 🌐 Настройка Vercel для корректной работы с Render Backend

## 🚨 ПРОБЛЕМА:
Фронт на Vercel не может подключиться к бэкенду на Render из-за неправильной конфигурации URL.

## ✅ РЕШЕНИЕ:

### 1. Переменные окружения в Vercel:

Зайдите в **Vercel Dashboard** → **Project Settings** → **Environment Variables**

Добавьте переменную:
```
Name: VITE_API_BASE_URL
Value: https://autologist-microservices.onrender.com/api
Environment: Production
```

### 2. Redeploy проекта:

После добавления переменной в Vercel Dashboard:
- Перейдите в **Deployments**
- Нажмите **Redeploy** на последнем деплое
- Или сделайте новый commit в Git

### 3. Проверка работы:

После redeploy проверьте:
- Открыть DevTools → Network
- Все API запросы должны идти на `https://autologist-microservices.onrender.com/api`
- Не должно быть запросов на `https://autologist-microservices.vercel.app/api`

### 4. Альтернативная настройка:

Если Vercel Environment Variables не работают, переменная также настроена в `vercel.json`:

```json
{
  "env": {
    "VITE_API_BASE_URL": "https://autologist-microservices.onrender.com/api"
  }
}
```

## 🔍 Диагностика:

**Проверить что переменная работает:**
```javascript
// В браузере DevTools Console:
console.log('API Base:', import.meta.env.VITE_API_BASE_URL);
```

Должно быть: `https://autologist-microservices.onrender.com/api`

**Если показывает `undefined` или `localhost`** - переменная не загружается.

---

## 🛠 Исправленные проблемы:

1. ✅ **CORS:** Добавлены все Vercel домены в backend allowedOrigins
2. ✅ **API URLs:** Все fetch запросы используют переменную API_BASE
3. ✅ **Vercel Config:** Добавлена переменная окружения в vercel.json
4. ✅ **Environment Files:** Созданы .env.production файлы

После выполнения всех шагов система должна работать корректно!