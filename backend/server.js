// backend/server.js
// Основной Express сервер для Autologist
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Импорт общего модуля для работы с БД
const DatabaseManager = require('./shared/database');

const app = express();
const PORT = process.env.PORT || 3001;

// JWT секретный ключ (в продакшене должен быть в переменных окружения)
const JWT_SECRET = process.env.JWT_SECRET || 'autologist_secret_key_2024';

// Инициализация базы данных
let db;

// Middleware
// Настройка CORS: разрешаем и production, и локальную разработку
const allowedOrigins = [
  'https://autologist-microservices.vercel.app', // Production Vercel
  'https://autologist-microservices.onrender.com', // Production Render
  'https://autologist-microservices-kaganlugaru.vercel.app', // Альтернативный Vercel URL
  'http://localhost:5173',                       // Vite dev server
  'http://localhost:3000',                       // React dev server (альтернатива)
  'http://127.0.0.1:5173'                       // Localhost альтернатива
];

app.use(cors({
  origin: function (origin, callback) {
    // Разрешаем запросы без origin (например, мобильные приложения)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS заблокировал origin: ${origin}`);
      console.log(`Разрешенные origins: ${allowedOrigins.join(', ')}`);
      callback(new Error(`CORS: Origin ${origin} не разрешен`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// ===== HEALTH CHECK =====

// Health check endpoint для мониторинга
app.get('/api/health', async (req, res) => {
  try {
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      version: '2.0.0',
      service: 'autologist-backend',
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasJwtSecret: !!process.env.JWT_SECRET,
        port: process.env.PORT || 'default'
      }
    };

    // Проверка подключения к БД (если db инициализирована)
    if (db) {
      try {
        const dbHealth = await db.testConnection();
        healthData.database = dbHealth;
      } catch (dbError) {
        healthData.database = { success: false, message: dbError.message };
        healthData.status = 'warning';
      }
    } else {
      healthData.database = { success: false, message: 'Database not initialized' };
      healthData.status = 'warning';
    }

    const statusCode = healthData.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🤖 Autologist Backend API',
    version: '1.0.0',
    health: '/api/health',
    docs: '/api/',
    timestamp: new Date().toISOString()
  });
});

// ===== MIDDLEWARE АУТЕНТИФИКАЦИИ =====

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Токен доступа отсутствует' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Требуются права администратора' });
  }
  next();
};

// ===== API АУТЕНТИФИКАЦИИ =====

// Вход в систему
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    // Находим пользователя
    const user = await db.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }

    // Обновляем время последнего входа
    await db.updateLastLogin(user.id);

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Устанавливаем cookie с токеном
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 часа
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Выход из системы
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Выход выполнен успешно' });
});

// Проверка текущего пользователя
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.userId,
      username: req.user.username,
      role: req.user.role
    }
  });
});

// ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ (только для админов) =====

// Получить всех пользователей
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// Создать пользователя
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role = 'user' } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Логин должен содержать минимум 3 символа' });
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 4 символа' });
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const newUser = await db.createUser(username, passwordHash, role);

    res.json({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
      created_at: newUser.created_at
    });
  } catch (error) {
    console.error('Ошибка создания пользователя:', error);
    if (error.code === '23505') {
      res.status(409).json({ error: 'Пользователь с таким логином уже существует' });
    } else {
      res.status(500).json({ error: 'Ошибка создания пользователя' });
    }
  }
});

// Обновить пользователя
app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, is_active } = req.body;
    
    const updates = {};
    if (username) updates.username = username;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);
    if (role) updates.role = role;
    if (typeof is_active === 'boolean') updates.is_active = is_active;

    const updatedUser = await db.updateUser(parseInt(id), updates);

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      is_active: updatedUser.is_active,
      updated_at: updatedUser.updated_at
    });
  } catch (error) {
    console.error('Ошибка обновления пользователя:', error);
    res.status(500).json({ error: 'Ошибка обновления пользователя' });
  }
});

// Удалить пользователя
app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Не позволяем удалить самого себя
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: 'Нельзя удалить самого себя' });
    }

    await db.deleteUser(parseInt(id));
    res.json({ success: true, message: 'Пользователь удален из базы' });
  } catch (error) {
    console.error('Ошибка удаления пользователя:', error);
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
  }
});

// ===== API ENDPOINTS =====

// Проверка статуса сервера
app.get('/api/status', async (req, res) => {
  try {
    const dbStatus = await db.testConnection();
    res.json({
      status: 'ok',
      message: 'Autologist Backend работает',
      timestamp: new Date().toISOString(),
      database: dbStatus
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Ошибка сервера',
      error: error.message
    });
  }
});

// ===== СООБЩЕНИЯ =====

// Получить последние сообщения (без поиска - для начального просмотра)
app.get('/api/messages', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const since = req.query.since; // ISO строка даты для фильтра за период
    
    const messages = await db.getRecentMessages(limit, since, null); // Без поиска по ключевым словам
    
    res.json({
      success: true,
      data: messages,
      count: messages.length,
      filters: {
        limit,
        since: since || null,
        type: 'recent'
      }
    });
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Функция для вычисления даты начала по диапазону
function getDateByRange(range) {
  const now = new Date();
  switch(range) {
    case '1h': now.setHours(now.getHours() - 1); break;
    case '6h': now.setHours(now.getHours() - 6); break;
    case '24h': now.setHours(now.getHours() - 24); break;
    case '3d': now.setDate(now.getDate() - 3); break;
    case '7d': now.setDate(now.getDate() - 7); break;
    case '30d': now.setDate(now.getDate() - 30); break;
    case 'all': return null; // Все время
    default: now.setHours(now.getHours() - 24); break; // По умолчанию 24 часа
  }
  return now.toISOString();
}

// Функция для получения времени 24 часа назад
function get24HoursAgo() {
  const now = new Date();
  now.setHours(now.getHours() - 24);
  return now.toISOString();
}

// Серверный поиск сообщений по всей БД
app.get('/api/search', authenticateToken, async (req, res) => {
  try {
    const query = req.query.q; // Простой поиск
    const complexQuery = req.query.complex; // Сложный поиск через ;
    const limit = parseInt(req.query.limit) || 5000; // Больше лимит для поиска
    const range = req.query.range || '24h'; // Диапазон поиска
    const since = getDateByRange(range); // Вычисляем дату начала
    
    // Определяем тип поиска
    const searchQuery = complexQuery || query;
    const isComplexSearch = !!complexQuery;
    
    console.log('🔍 [Backend] Поиск:', { 
      query: searchQuery, 
      range, 
      since, 
      limit,
      isComplex: isComplexSearch,
      keywords: isComplexSearch ? searchQuery.split(';') : [searchQuery]
    });
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        error: 'Поисковый запрос не указан'
      });
    }
    
    let messages;
    if (isComplexSearch) {
      // Сложный поиск по нескольким ключевым словам
      const keywords = searchQuery.split(';').map(k => k.trim()).filter(k => k);
      messages = await db.searchMessagesByMultipleKeywords(keywords, limit, since);
      console.log('🔗 [Backend] Найдено сообщений по ключам:', keywords, '→', messages?.length || 0);
    } else {
      // Обычный поиск по одному запросу
      messages = await db.getRecentMessages(limit, since, searchQuery);
      console.log('🔍 [Backend] Найдено сообщений:', messages?.length || 0);
    }
    
    res.json({
      success: true,
      data: messages,
      count: messages.length,
      filters: {
        query: searchQuery,
        limit,
        since,
        range,
        type: isComplexSearch ? 'complex_search' : 'simple_search',
        keywords: isComplexSearch ? searchQuery.split(';') : [searchQuery]
      }
    });
  } catch (error) {
    console.error('Ошибка поиска сообщений:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить сообщения для ИИ обработки
app.get('/api/messages/unprocessed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 200;
    const messages = await db.getUnprocessedMessages(limit);
    
    res.json({
      success: true,
      data: messages,
      count: messages.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить статус ИИ обработки
app.post('/api/messages/:id/ai-processed', async (req, res) => {
  try {
    const messageId = req.params.id;
    const { structured_data } = req.body;
    
    const result = await db.updateAIProcessed(messageId, structured_data);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== КЛЮЧЕВЫЕ СЛОВА =====

// Получить все ключевые слова
app.get('/api/keywords', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔑 [Backend] Запрос keywords от пользователя:', req.user.username);
    const keywords = await db.getKeywords();
    console.log('🔑 [Backend] Найдено keywords:', keywords?.length || 0);
    
    res.json({
      success: true,
      data: keywords
    });
  } catch (error) {
    console.error('🔑 [Backend] Ошибка keywords:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Добавить ключевое слово
app.post('/api/keywords', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Ключевое слово обязательно'
      });
    }

    const { data, error } = await db.supabase
      .from('keywords')
      .insert({
        keyword: keyword.trim(),
        category: 'грузоперевозки', // Автоматически присваиваем категорию
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      message: `Ключевое слово "${keyword}" добавлено в категорию "грузоперевозки"`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить ключевое слово
app.put('/api/keywords/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { active, category } = req.body;

    const updateData = {};
    if (typeof active !== 'undefined') updateData.active = active;
    if (typeof category !== 'undefined') updateData.category = category;

    const { data, error } = await db.supabase
      .from('keywords')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      message: 'Ключевое слово обновлено'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Удалить ключевое слово
app.delete('/api/keywords/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ [Backend] Удаляем ключевое слово:', id);
    
    // Проверяем, является ли id числом (ID) или строкой (keyword)
    const isNumericId = !isNaN(parseInt(id));
    console.log('🔍 [Backend] Тип ID:', isNumericId ? 'числовой' : 'текстовый');
    
    let query = db.supabase.from('keywords').delete();
    
    if (isNumericId) {
      // Удаляем по ID
      console.log('📊 [Backend] Удаление по числовому ID:', parseInt(id));
      query = query.eq('id', parseInt(id));
    } else {
      // Удаляем по тексту ключевого слова
      const decodedKeyword = decodeURIComponent(id);
      console.log('📝 [Backend] Удаление по тексту:', decodedKeyword);
      query = query.eq('keyword', decodedKeyword);
    }

    const { data, error } = await query;
    console.log('📋 [Backend] Результат удаления:', { data, error });

    if (error) throw error;

    console.log('✅ [Backend] Ключевое слово успешно удалено');
    res.json({
      success: true,
      message: 'Ключевое слово удалено'
    });
  } catch (error) {
    console.error('❌ [Backend] Ошибка удаления ключевого слова:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ПОЛУЧАТЕЛИ СООБЩЕНИЙ (РЕДИРЕКТ НА НОВУЮ СИСТЕМУ) =====

// Получить всех получателей - редирект на новую систему категорий
app.get('/api/recipients', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await db.supabase
      .from('recipient_categories')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Ошибка получения получателей:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// ===== ПОЛУЧАТЕЛИ ПО КАТЕГОРИЯМ (НОВАЯ СИСТЕМА) =====

// Получить всех получателей по категориям
app.get('/api/recipient-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await db.supabase
      .from('recipient_categories')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Ошибка получения получателей по категориям:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      data: []
    });
  }
});

// Добавить нового получателя по категории
app.post('/api/recipient-categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, username, phone, category, active } = req.body;

    // Валидация обязательных полей (phone или username)
    if (!name || (!phone && !username) || !category) {
      return res.status(400).json({
        success: false,
        error: 'Обязательные поля: name, phone (или username), category'
      });
    }

    // Валидация номера телефона если он предоставлен
    if (phone) {
      const phoneRegex = /^\+\d{10,15}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          error: 'Номер телефона должен начинаться с + и содержать 10-15 цифр'
        });
      }
    }

    // Убираем @ из username если есть
    const cleanUsername = username ? username.replace('@', '').trim() : null;

    // Если username не предоставлен, но есть phone, создаем username на основе phone
    let finalUsername = cleanUsername;
    if (!finalUsername && phone) {
      // Создаем username из номера телефона (убираем + и берем последние 9 цифр)
      finalUsername = 'phone_' + phone.replace('+', '').slice(-9);
    }
    
    // Если все еще нет username, используем пустую строку
    if (!finalUsername) {
      finalUsername = '';
    }

    const recipientData = {
      name: name.trim(),
      username: finalUsername,
      phone: phone ? phone.trim() : null,
      category: category.trim(),
      active: active !== false // по умолчанию true
    };

    const { data, error } = await db.supabase
      .from('recipient_categories')
      .insert([recipientData])
      .select();

    if (error) {
      // Проверяем на дубликат
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: 'Получатель для этой категории уже существует'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Получатель добавлен в категорию',
      data: data[0]
    });
  } catch (error) {
    console.error('Ошибка добавления получателя по категории:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить статус получателя по категории
app.patch('/api/recipient-categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const { data, error } = await db.supabase
      .from('recipient_categories')
      .update({ active })
      .eq('id', id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Статус получателя обновлен',
      data: data[0]
    });
  } catch (error) {
    console.error('Ошибка обновления получателя по категории:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Удалить получателя по категории
app.delete('/api/recipient-categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await db.supabase
      .from('recipient_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Получатель удален из категории'
    });
  } catch (error) {
    console.error('Ошибка удаления получателя по категории:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// СОВМЕСТИМОСТЬ: Удалить получателя (старый роут)
app.delete('/api/recipients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await db.supabase
      .from('recipient_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Получатель удален'
    });
  } catch (error) {
    console.error('Ошибка удаления получателя:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Миграция: добавление поля phone
app.post('/api/migrate-phone-field', async (req, res) => {
  try {
    // Проверяем, существует ли уже поле phone
    const { error: testError } = await db.supabase
      .from('recipient_categories')
      .select('phone')
      .limit(1);
      
    if (testError && testError.message.includes('column "phone" does not exist')) {
      return res.json({
        success: false,
        error: 'Добавьте поле "phone" (VARCHAR) в таблицу recipient_categories через Supabase Dashboard',
        needsManualMigration: true,
        instructions: [
          '1. Откройте Supabase Dashboard',
          '2. Перейдите в Table Editor → recipient_categories',
          '3. Нажмите "Add Column"',
          '4. Name: phone, Type: varchar, можно nullable'
        ]
      });
    }

    res.json({
      success: true,
      message: 'Поле phone уже существует или миграция не требуется'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ОТСЛЕЖИВАЕМЫЕ ЧАТЫ =====

// Получить отслеживаемые чаты
// Получить доступные чаты (не мониторящиеся)
app.get('/api/chats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const platform = req.query.platform;
    const chats = await db.getAvailableChats(platform);
    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить отслеживаемые чаты
app.get('/api/monitored-chats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const platform = req.query.platform;
    const chats = await db.getMonitoredChats(platform);
    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Добавить чат в отслеживание
app.post('/api/chats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const chatData = req.body;
    const result = await db.addMonitoredChat(chatData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить чат (изменить статус активности)
app.patch('/api/chats/:id', async (req, res) => {
  try {
    const chatId = req.params.id;
    const updateData = req.body;
    
    const { data, error } = await db.supabase
      .from('monitored_chats')
      .update(updateData)
      .eq('id', chatId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Ошибка обновления чата:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Удалить чат из отслеживания
app.delete('/api/chats/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const chatId = req.params.id;
    
    const { error } = await db.supabase
      .from('monitored_chats')
      .delete()
      .eq('id', chatId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Чат удален из мониторинга'
    });
  } catch (error) {
    console.error('Ошибка удаления чата:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ОБЪЯВЛЕНИЯ =====

// Получить объявления
app.get('/api/announcements', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status;
    const announcements = await db.getAnnouncements(status);
    
    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Создать объявление
app.post('/api/announcements', async (req, res) => {
  try {
    const announcementData = req.body;
    const result = await db.createAnnouncement(announcementData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== УТИЛИТЫ =====

// Очистить старые сообщения
app.delete('/api/messages/cleanup', async (req, res) => {
  try {
    const daysOld = parseInt(req.query.days) || 14;
    const result = await db.cleanOldMessages(daysOld);
    
    res.json({
      success: true,
      message: `Удалено ${result.deletedCount} старых сообщений`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== СТАТИСТИКА =====

// Получить общую статистику
app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    // Получаем статистику из базы данных
    const stats = await db.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== TELEGRAM ЧАТЫ =====
// Удалён устаревший endpoint /api/telegram/chats, теперь используйте /api/chats для получения чатов напрямую из базы Supabase

// Проверить доступ к конкретным чатам
app.post('/api/telegram/check-chats', async (req, res) => {
  try {
    const { chatIds } = req.body;
    
    if (!chatIds || !Array.isArray(chatIds)) {
      return res.status(400).json({
        success: false,
        message: 'Требуется массив chatIds'
      });
    }

    // Проверяем какие чаты уже есть в базе
    const { data: existingChats } = await db.supabase
      .from('monitored_chats')
      .select('chat_id')
      .in('chat_id', chatIds);

    const existingChatIds = existingChats?.map(c => c.chat_id) || [];

    const results = chatIds.map(chatId => ({
      chatId: chatId,
      accessible: true, // В реальности здесь была бы проверка через Telegram API
      inDatabase: existingChatIds.includes(chatId),
      title: `Чат ${chatId}` // В реальности получали бы из API
    }));

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Ошибка проверки чатов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== УПРАВЛЕНИЕ ПАРСЕРОМ =====

// Глобальная переменная для хранения состояния парсера
let parserStatus = {
  running: false,
  startTime: null,
  messagesProcessed: 0,
  lastActivity: null,
  pid: null
};

// Переменная для хранения процесса парсера
let parserProcess = null;

// Получить статус парсера
app.get('/api/parser/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Проверяем внешние Python процессы
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    let externalParserRunning = false;
    let externalPid = null;
    
    try {
      // Проверяем процессы Python, которые запускают telegram_parser.py
      const { stdout } = await execAsync('tasklist /fi "imagename eq python.exe" /fo csv');
      const lines = stdout.split('\n');
      
      for (const line of lines) {
        if (line.includes('python.exe')) {
          // Дополнительная проверка: смотрим командную строку процесса
          try {
            const pidMatch = line.match(/"(\d+)"/g);
            if (pidMatch && pidMatch.length >= 2) {
              const pid = pidMatch[1].replace(/"/g, '');
              const { stdout: cmdline } = await execAsync(`wmic process where "ProcessId=${pid}" get CommandLine /format:csv`);
              if (cmdline.includes('telegram_parser.py')) {
                externalParserRunning = true;
                externalPid = parseInt(pid);
                break;
              }
            }
          } catch (e) {
            // Игнорируем ошибки проверки отдельных процессов
          }
        }
      }
    } catch (error) {
      console.log('Ошибка проверки внешних процессов:', error.message);
    }
    
    // Если внешний парсер запущен, обновляем статус
    if (externalParserRunning && !parserStatus.running) {
      parserStatus.running = true;
      parserStatus.pid = externalPid;
      parserStatus.startTime = new Date().toISOString();
      parserStatus.lastActivity = new Date().toISOString();
    } else if (!externalParserRunning && parserStatus.running && !parserProcess) {
      // Внешний процесс остановился
      parserStatus.running = false;
      parserStatus.pid = null;
    }
    
    res.json({
      success: true,
      status: {
        ...parserStatus,
        external: externalParserRunning,
        externalPid: externalPid
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка получения статуса парсера',
      error: error.message
    });
  }
});

// Запустить парсер
app.post('/api/parser/start', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (parserStatus.running) {
      return res.status(400).json({
        success: false,
        message: 'Парсер уже запущен'
      });
    }

    console.log('🚀 Запуск Python парсера...');
    
    // Путь к нашему улучшенному Python парсеру
    const parserPath = path.join(__dirname, '..', 'telegram-parser', 'telegram_parser.py');
    console.log(`📁 Путь к парсеру: ${parserPath}`);
    
    // Запускаем Python скрипт с флагом для мониторинга
    parserProcess = spawn('python', [parserPath, '--monitor'], {
      cwd: path.join(__dirname, '..', 'telegram-parser'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    console.log(`🆔 Parser PID: ${parserProcess.pid}`);

    // Обработка вывода парсера
    parserProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      console.log(`📊 Parser: ${output}`);
      
      // Обновляем активность парсера
      parserStatus.lastActivity = new Date().toISOString();
      
      // Пытаемся извлечь количество обработанных сообщений из логов
      const processedMatch = output.match(/Обработано сообщений: (\d+)/);
      if (processedMatch) {
        parserStatus.messagesProcessed = parseInt(processedMatch[1]);
      }
    });

    parserProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      
      // Проверяем, является ли это ошибкой или просто логом
      if (output.includes('ERROR') || output.includes('CRITICAL') || output.includes('Exception')) {
        console.error(`❌ Parser Error: ${output}`);
      } else {
        console.log(`📊 Parser Log: ${output}`);
      }
      
      // Обновляем активность парсера
      parserStatus.lastActivity = new Date().toISOString();
    });

    parserProcess.on('close', (code) => {
      console.log(`🔚 Parser process closed with code ${code}`);
      parserStatus.running = false;
      parserStatus.pid = null;
      parserProcess = null;
    });

    parserProcess.on('error', (error) => {
      console.error(`❌ Parser process error: ${error.message}`);
      parserStatus.running = false;
      parserStatus.pid = null;
      parserProcess = null;
    });

    // Обновляем статус
    parserStatus = {
      running: true,
      startTime: new Date().toISOString(),
      messagesProcessed: 0,
      lastActivity: new Date().toISOString(),
      pid: parserProcess.pid
    };

    res.json({
      success: true,
      message: 'Парсер запущен',
      status: parserStatus
    });

  } catch (error) {
    console.error('❌ Ошибка запуска парсера:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка запуска парсера',
      error: error.message
    });
  }
});

// Остановить парсер
app.post('/api/parser/stop', authenticateToken, requireAdmin, (req, res) => {
  try {
    if (!parserStatus.running) {
      return res.status(400).json({
        success: false,
        message: 'Парсер не запущен'
      });
    }

    console.log('⏹️ Остановка Python парсера...');
    
    // Завершаем процесс парсера если он запущен
    if (parserProcess) {
      console.log(`🔥 Завершаем процесс с PID: ${parserProcess.pid}`);
      parserProcess.kill('SIGTERM');
      parserProcess = null;
    }

    parserStatus.running = false;
    parserStatus.pid = null;

    res.json({
      success: true,
      message: 'Парсер остановлен',
      status: parserStatus
    });

  } catch (error) {
    console.error('❌ Ошибка остановки парсера:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка остановки парсера',
      error: error.message
    });
  }
});

// Разовый парсинг
app.post('/api/parser/run-once', async (req, res) => {
  try {
    console.log('🔄 Запуск разового парсинга...');
    
    // Путь к нашему улучшенному Python парсеру
    const parserPath = path.join(__dirname, '..', 'telegram-parser', 'telegram_parser.py');
    
    // Запускаем Python скрипт без флага --monitor (разовое выполнение)
    const runOnceProcess = spawn('python', [parserPath], {
      cwd: path.join(__dirname, '..', 'telegram-parser'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    // Собираем вывод
    runOnceProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`📊 RunOnce: ${text.trim()}`);
    });

    runOnceProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      console.error(`❌ RunOnce Error: ${text.trim()}`);
    });

    // Ждем завершения
    runOnceProcess.on('close', (code) => {
      if (code === 0) {
        // Успешное завершение
        const processedMatch = output.match(/Обработано сообщений: (\d+)/);
        const savedMatch = output.match(/Сохранено новых: (\d+)/);
        
        res.json({
          success: true,
          message: 'Разовый парсинг завершен',
          result: {
            messagesProcessed: processedMatch ? parseInt(processedMatch[1]) : 0,
            messagesSaved: savedMatch ? parseInt(savedMatch[1]) : 0,
            exitCode: code,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        // Ошибка
        res.status(500).json({
          success: false,
          message: 'Ошибка разового парсинга',
          error: errorOutput || `Процесс завершился с кодом ${code}`
        });
      }
    });

    runOnceProcess.on('error', (error) => {
      console.error('❌ Ошибка процесса разового парсинга:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка запуска разового парсинга',
        error: error.message
      });
    });

  } catch (error) {
    console.error('❌ Ошибка разового парсинга:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка разового парсинга',
      error: error.message
    });
  }
});

// ===== API ДЛЯ ДУБЛИКАТОВ =====

// Получить информацию о дубликатах для конкретного сообщения
app.get('/api/messages/:id/duplicates', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await db.supabase
      .from('message_duplicates')
      .select(`
        *,
        original_message:messages(id, message_text, chat_name, username, created_at)
      `)
      .eq('original_message_id', id)
      .order('detected_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      total: data ? data.length : 0
    });
  } catch (error) {
    console.error('Ошибка получения дубликатов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить статистику дубликатов
app.get('/api/duplicates/stats', async (req, res) => {
  try {
    // Общее количество дубликатов
    const { data: totalDuplicates, error: duplicatesError } = await db.supabase
      .from('message_duplicates')
      .select('id', { count: 'exact' });

    if (duplicatesError) throw duplicatesError;

    // Количество уникальных сообщений с дубликатами
    const { data: uniqueMessages, error: uniqueError } = await db.supabase
      .from('message_duplicates')
      .select('original_message_id');

    if (uniqueError) throw uniqueError;

    // Подсчитаем уникальные original_message_id
    const uniqueCount = uniqueMessages ? 
      new Set(uniqueMessages.map(item => item.original_message_id)).size : 0;

    // Топ чатов по количеству дубликатов
    const { data: topChats, error: chatsError } = await db.supabase
      .from('message_duplicates')
      .select('duplicate_chat_name')
      .limit(10);

    if (chatsError) throw chatsError;

    // Группируем чаты
    const chatStats = {};
    if (topChats) {
      topChats.forEach(item => {
        chatStats[item.duplicate_chat_name] = (chatStats[item.duplicate_chat_name] || 0) + 1;
      });
    }

    const topChatsList = Object.entries(chatStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ chat_name: name, duplicates_count: count }));

    res.json({
      success: true,
      data: {
        total_duplicates: totalDuplicates?.length || 0,
        unique_messages_with_duplicates: uniqueCount,
        top_duplicate_chats: topChatsList
      }
    });
  } catch (error) {
    console.error('Ошибка получения статистики дубликатов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить детальную информацию о дубликатах с пагинацией
app.get('/api/duplicates/detailed', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { data, error } = await db.supabase
      .from('message_duplicates')
      .select(`
        id,
        original_message_id,
        duplicate_chat_id,
        duplicate_chat_name,
        duplicate_user_id,
        duplicate_username,
        duplicate_user_first_name,
        duplicate_user_last_name,
        detected_at,
        messages!inner(
          id,
          message_text,
          created_at,
          chat_name,
          username
        )
      `)
      .order('detected_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        has_more: data && data.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения детальной информации о дубликатах:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ОБРАБОТЧИКИ ОШИБОК =====

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint не найден'
  });
});

// Обработка ошибок
app.use((error, req, res, next) => {
  console.error('Ошибка сервера:', error);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ===== ЗАПУСК СЕРВЕРА =====

// Запуск сервера
async function startServer() {
  try {
    // Инициализация базы данных
    db = new DatabaseManager();
    
    // Проверка соединения
    const dbTest = await db.testConnection();
    if (!dbTest.success) {
      throw new Error(`Не удалось подключиться к БД: ${dbTest.message}`);
    }
    
    // Запуск сервера
    // Запуск сервера на всех интерфейсах для Render.com
    app.listen(PORT, '0.0.0.0', () => {
      console.log('🚀 Autologist Backend запущен');
      console.log(`📡 API: http://localhost:${PORT}/api/`);
      console.log(`🌍 External: http://0.0.0.0:${PORT}/api/`);
      console.log(`✅ База данных: подключена`);
      console.log(`⏰ Время запуска: ${new Date().toLocaleString()}`);
      console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error.message);
    process.exit(1);
  }
}

// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('\n🛑 Получен сигнал SIGINT. Завершение работы...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Получен сигнал SIGTERM. Завершение работы...');
  process.exit(0);
});

// ===== ЗАПРОС СПИСКА ЧАТОВ ЧЕРЕЗ ПАРСЕР =====
const FLAG_PATH = path.join(__dirname, '../request_chats.flag');

app.post('/api/request-chats', (req, res) => {
  try {
    fs.writeFileSync(FLAG_PATH, 'request');
    res.json({ status: 'ok', message: 'Файл-флаг создан, парсер получит команду.' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Не удалось создать файл-флаг.' });
  }
});

// Запуск
startServer();