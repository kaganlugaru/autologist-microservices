// backend/server.js
// Основной Express сервер для Autologist
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

// Импорт общего модуля для работы с БД
const DatabaseManager = require('./shared/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Инициализация базы данных
let db;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ===== HEALTH CHECK =====

// Health check endpoint для мониторинга
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    version: '1.0.0',
    service: 'autologist-backend'
  });
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

// Получить последние сообщения
app.get('/api/messages', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const messages = await db.getRecentMessages(limit);
    
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
app.get('/api/keywords', async (req, res) => {
  try {
    const keywords = await db.getKeywords();
    
    res.json({
      success: true,
      data: keywords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Добавить ключевое слово
app.post('/api/keywords', async (req, res) => {
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
app.put('/api/keywords/:id', async (req, res) => {
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
app.delete('/api/keywords/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Проверяем, является ли id числом (ID) или строкой (keyword)
    const isNumericId = !isNaN(parseInt(id));
    
    let query = db.supabase.from('keywords').delete();
    
    if (isNumericId) {
      // Удаляем по ID
      query = query.eq('id', parseInt(id));
    } else {
      // Удаляем по тексту ключевого слова
      query = query.eq('keyword', decodeURIComponent(id));
    }

    const { error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      message: 'Ключевое слово удалено'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== ПОЛУЧАТЕЛИ СООБЩЕНИЙ (РЕДИРЕКТ НА НОВУЮ СИСТЕМУ) =====

// Получить всех получателей - редирект на новую систему категорий
app.get('/api/recipients', async (req, res) => {
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
app.get('/api/recipient-categories', async (req, res) => {
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
app.post('/api/recipient-categories', async (req, res) => {
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
app.delete('/api/recipient-categories/:id', async (req, res) => {
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
app.get('/api/chats', async (req, res) => {
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
app.post('/api/chats', async (req, res) => {
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
app.delete('/api/chats/:id', async (req, res) => {
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
app.get('/api/announcements', async (req, res) => {
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
app.get('/api/stats', async (req, res) => {
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

// Получить доступные чаты из Telegram
app.get('/api/telegram/chats', async (req, res) => {
  console.log('');
  console.log('🔥 ================================');
  console.log('🔥 ЗАПРОС TELEGRAM CHATS ПОЛУЧЕН');
  console.log('🔥 ================================');
  console.log('📅 Время:', new Date().toISOString());
  console.log('🌐 User-Agent:', req.headers['user-agent']);
  console.log('🔗 Origin:', req.headers.origin);
  console.log('📍 IP:', req.ip || req.connection.remoteAddress);
  
  try {
    console.log('🔍 Запрос реальных чатов из Telegram аккаунта...');
    
    // Запускаем Python скрипт для получения чатов из Railway сессии
    const { spawn } = require('child_process');
    const path = require('path');
    
    const pythonScript = path.join(__dirname, '..', 'telegram-parser', 'get_chats.py');
    
    console.log('🐍 Конфигурация Python:');
    console.log('  📁 Script path:', pythonScript);
    console.log('  📂 Working dir:', path.join(__dirname, '..', 'telegram-parser'));
    console.log('  🔑 Env vars present:', {
      TELEGRAM_API_ID: !!process.env.TELEGRAM_API_ID,
      TELEGRAM_API_HASH: !!process.env.TELEGRAM_API_HASH,
      NODE_ENV: process.env.NODE_ENV,
      RENDER: !!process.env.RENDER
    });
    
    // Проверяем существование скрипта
    const fs = require('fs');
    if (!fs.existsSync(pythonScript)) {
      console.error('❌ Python скрипт не найден:', pythonScript);
      
      // ВРЕМЕННЫЙ FALLBACK: демо-данные если скрипт не найден
      console.log('🔄 Fallback: возвращаем демо-данные из-за отсутствия скрипта');
      const fallbackChats = [
        {
          id: '-1002222222222',
          title: '⚠️ Скрипт не найден - демо чат',
          participantsCount: 200,
          type: 'supergroup',
          accessible: true
        }
      ];
      
      return res.json({
        success: true,
        data: fallbackChats,
        message: '⚠️ Python скрипт не найден - показаны демо-данные',
        error: 'Python script not found',
        scriptPath: pythonScript,
        suggestion: 'Проверьте что файл telegram-parser/get_chats.py существует'
      });
    }
    console.log('✅ Python скрипт найден');
    
    console.log('🚀 Запуск Python процесса...');
    
    const pythonProcess = spawn('python', [pythonScript], {
      cwd: path.join(__dirname, '..', 'telegram-parser'),
      env: { ...process.env }
    });
    
    let output = '';
    let errorOutput = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      console.log('📤 Python stdout:', chunk.trim());
    });
    
    pythonProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      errorOutput += chunk;
      console.log('� Python stderr:', chunk.trim());
    });
    
    pythonProcess.on('close', (code) => {
      console.log('');
      console.log('🏁 Python процесс завершен');
      console.log('  📊 Exit code:', code);
      console.log('  📝 Output length:', output.length);
      console.log('  ❌ Error length:', errorOutput.length);
      
      if (code === 0) {
        try {
          console.log('🔍 Парсинг JSON вывода...');
          console.log('📄 Raw output:', output.substring(0, 500) + (output.length > 500 ? '...' : ''));
          
          const chats = JSON.parse(output);
          console.log(`✅ Получено ${chats.length} чатов из Telegram`);
          console.log('📋 Первые 3 чата:', chats.slice(0, 3).map(c => ({ id: c.id, title: c.title })));
          
          res.json({
            success: true,
            data: chats,
            message: `Загружено ${chats.length} чатов из вашего Telegram аккаунта`,
            debug: {
              pythonExitCode: code,
              outputLength: output.length,
              errorLength: errorOutput.length
            }
          });
        } catch (parseError) {
          console.error('❌ Ошибка парсинга JSON:', parseError.message);
          console.error('📄 Raw output was:', output);
          
          res.status(500).json({
            success: false,
            error: 'Ошибка обработки данных от Telegram API',
            details: parseError.message,
            rawOutput: output,
            errorOutput: errorOutput
          });
        }
      } else {
        console.error('❌ Python скрипт завершился с ошибкой');
        console.error('📄 Error output:', errorOutput);
        
        // Специальная обработка ошибки отсутствующих зависимостей
        if (errorOutput.includes('No module named') || errorOutput.includes('ModuleNotFoundError')) {
          console.log('🔄 Обнаружена ошибка отсутствующих Python модулей');
          const missingModule = errorOutput.match(/No module named '([^']+)'/)?.[1] || 'неизвестный модуль';
          
          res.json({
            success: true,
            data: [{
              id: '-1003333333333',
              title: `⚠️ Отсутствует Python модуль: ${missingModule}`,
              participantsCount: 0,
              type: 'supergroup',
              accessible: false
            }],
            message: `⚠️ Необходимо установить Python зависимости`,
            error: 'Missing Python dependencies',
            missingModule: missingModule,
            solution: [
              '1. Добавить requirements.txt в корень проекта',
              '2. Настроить Python buildpack в Render',
              '3. Или использовать только Node.js без Python'
            ]
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Ошибка получения чатов из Telegram',
            details: errorOutput,
            pythonCode: code,
            rawOutput: output
          });
        }
      }
    });
    
    pythonProcess.on('error', (error) => {
      console.error('❌ Ошибка запуска Python процесса:', error.message);
      console.error('🔍 Возможные причины:');
      console.error('  - Python не установлен');
      console.error('  - Неправильный PATH');
      console.error('  - Отсутствуют зависимости');
      
      // ВРЕМЕННЫЙ FALLBACK: демо-данные только при ошибке Python
      console.log('🔄 Fallback: возвращаем демо-данные из-за ошибки Python');
      const fallbackChats = [
        {
          id: '-1001111111111',
          title: '⚠️ Python недоступен - демо чат',
          participantsCount: 100,
          type: 'supergroup',
          accessible: true
        }
      ];
      
      res.json({
        success: true,
        data: fallbackChats,
        message: '⚠️ Python недоступен - показаны демо-данные',
        error: 'Python environment not available',
        suggestions: [
          'Установите Python на сервере',
          'Добавьте Python buildpack в Render',
          'Проверьте зависимости: pip install telethon python-dotenv'
        ]
      });
    });
    
    // Таймаут для предотвращения зависания
    setTimeout(() => {
      console.log('⏰ Достигнут таймаут 30 секунд');
      pythonProcess.kill();
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Превышено время ожидания ответа от Telegram API (30 секунд)',
          timeout: true,
          partialOutput: output,
          partialError: errorOutput
        });
      }
    }, 30000); // 30 секунд таймаут
    
  } catch (error) {
    console.error('❌ Критическая ошибка в обработчике:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

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
app.get('/api/parser/status', async (req, res) => {
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
app.post('/api/parser/start', async (req, res) => {
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
    
    // Запускаем Python скрипт с флагом для мониторинга
    parserProcess = spawn('python', [parserPath, '--monitor'], {
      cwd: path.join(__dirname, '..', 'telegram-parser'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

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
app.post('/api/parser/stop', (req, res) => {
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

// Запуск
startServer();