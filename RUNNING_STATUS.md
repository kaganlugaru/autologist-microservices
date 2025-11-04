# 🚀 ЗАПУСК СИСТЕМЫ В РАЗНЫХ ТЕРМИНАЛАХ

## ✅ **СИСТЕМА УСПЕШНО ЗАПУЩЕНА!**

### 🖥️ **Активные сервисы:**

#### 1️⃣ **Backend API** 
- 🟢 **Статус:** Работает
- 🌐 **Порт:** http://localhost:3000
- 📡 **API:** http://localhost:3000/api/
- 🪟 **Терминал:** Отдельное окно PowerShell

#### 2️⃣ **Frontend Dashboard**
- 🟢 **Статус:** Работает  
- 🌐 **Порт:** http://localhost:5173
- 🖥️ **Dashboard:** http://localhost:5173
- 🪟 **Терминал:** Отдельное окно PowerShell

---

## 🔄 **КАК ПЕРЕЗАПУСТИТЬ:**

### **Способ 1: Через готовые команды**
```powershell
# Terminal 1 - Backend
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\bauto\OneDrive\Документы\autologist-microservices\backend'; node server.js"

# Terminal 2 - Frontend  
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\bauto\OneDrive\Документы\autologist-microservices\frontend'; npm run dev"
```

### **Способ 2: Ручной запуск**
```powershell
# Terminal 1
cd "c:\Users\bauto\OneDrive\Документы\autologist-microservices\backend"
node server.js

# Terminal 2
cd "c:\Users\bauto\OneDrive\Документы\autologist-microservices\frontend" 
npm run dev
```

---

## 🧪 **ПРОВЕРКА РАБОТОСПОСОБНОСТИ:**

### **Backend API:**
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/status"
```
**Ожидаемый результат:** `{"status":"ok","message":"Autologist Backend работает"}`

### **Frontend:**
Откройте в браузере: **http://localhost:5173**

---

## 🎯 **ДОСТУПНЫЕ ФУНКЦИИ:**

### 📱 **Web Dashboard:** http://localhost:5173
- 📬 **Сообщения** - просмотр всех сообщений
- 💬 **Чаты** - управление мониторингом
- 📊 **Статистика** - аналитика и графики
- 🔍 **Ключевые слова** - настройка поиска
- ⚙️ **Парсер** - управление процессом

### 🔧 **API Endpoints:** http://localhost:3000/api/
- `GET /api/status` - состояние сервера
- `GET /api/stats` - общая статистика
- `GET /api/messages` - список сообщений
- `GET /api/chats` - мониторинговые чаты
- `GET /api/keywords` - ключевые слова
- `GET /api/parser/status` - статус парсера
- `POST /api/parser/start` - запуск парсера
- `POST /api/parser/stop` - остановка парсера

---

## 🛑 **ОСТАНОВКА СЕРВИСОВ:**

```powershell
# Остановить все Node.js процессы
Stop-Process -Name "node" -Force

# Остановить конкретные процессы по портам
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
```

---

## 🎉 **ГОТОВО К РАБОТЕ!**

**✅ Backend:** http://localhost:3000  
**✅ Frontend:** http://localhost:5173  
**✅ Dashboard:** Полностью функционален  
**✅ API:** Все endpoints работают  

**Система запущена в двух отдельных терминалах и готова к использованию! 🚀**