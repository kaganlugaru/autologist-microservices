// backend/server.js
// Основной Express сервер для Autologist
const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

// Импорт общего модуля для работы с БД
const DatabaseManager = require('../shared/database');
const TelegramRealAPI = require('./telegram-real-api');

const app = express();
const PORT = process.env.PORT || 3001;

// Инициализация базы данных и API
let db;
const telegramRealAPI = new TelegramRealAPI();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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
    const limit = parseInt(req.query.limit) || 50;
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
        active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить статус ключевого слова
app.put('/api/keywords/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const { data, error } = await db.supabase
      .from('keywords')
      .update({ active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: data
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

    const { error } = await db.supabase
      .from('keywords')
      .delete()
      .eq('id', id);

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

// ===== ПОЛУЧАТЕЛИ СООБЩЕНИЙ =====

// Получить всех получателей
app.get('/api/recipients', async (req, res) => {
  try {
    const { data, error } = await db.supabase
      .from('message_recipients')
      .select('*')
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

// Добавить нового получателя
app.post('/api/recipients', async (req, res) => {
  try {
    const { name, username, keyword, active } = req.body;

    // Валидация обязательных полей
    if (!name || !username || !keyword) {
      return res.status(400).json({
        success: false,
        error: 'Обязательные поля: name, username, keyword'
      });
    }

    // Убираем @ из username если есть
    const cleanUsername = username.replace('@', '').trim();

    const recipientData = {
      name: name.trim(),
      username: cleanUsername,
      keyword: keyword.trim(),
      active: active !== false // по умолчанию true
    };

    const { data, error } = await db.supabase
      .from('message_recipients')
      .insert([recipientData])
      .select();

    if (error) {
      // Проверяем на дубликат
      if (error.code === '23505' && error.constraint === 'unique_recipient_keyword') {
        return res.status(409).json({
          success: false,
          error: 'Получатель для этого ключевого слова уже существует'
        });
      }
      throw error;
    }

    res.json({
      success: true,
      message: 'Получатель добавлен',
      data: data[0]
    });
  } catch (error) {
    console.error('Ошибка добавления получателя:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Обновить статус получателя
app.patch('/api/recipients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (typeof active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Поле active должно быть boolean'
      });
    }

    const { data, error } = await db.supabase
      .from('message_recipients')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Получатель не найден'
      });
    }

    res.json({
      success: true,
      message: 'Статус получателя обновлен',
      data: data[0]
    });
  } catch (error) {
    console.error('Ошибка обновления получателя:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Удалить получателя
app.delete('/api/recipients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await db.supabase
      .from('message_recipients')
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
  try {
    // Пока возвращаем заглушку, так как нужна авторизация Telegram
    const availableChats = [
      {
        id: '-1001208543145',
        title: 'Груз Украина',
        participantsCount: 15234,
        type: 'supergroup',
        accessible: true
      },
      {
        id: '-1001254956843',
        title: 'Логистика Европа', 
        participantsCount: 8765,
        type: 'supergroup',
        accessible: true
      },
      {
        id: '-1001627973435',
        title: 'Автобазар',
        participantsCount: 23456,
        type: 'supergroup',
        accessible: true
      },
      {
        id: '-1001631736811',
        title: 'Дальнобой Форум',
        participantsCount: 12890,
        type: 'supergroup',
        accessible: true
      },
      {
        id: '-1001678459958',
        title: 'Грузоперевозки UA',
        participantsCount: 19876,
        type: 'supergroup',
        accessible: true
      },
      {
        id: '-5063354364',
        title: 'Работа Водители',
        participantsCount: 7543,
        type: 'supergroup',
        accessible: true
      }
    ];

    res.json({
      success: true,
      data: availableChats,
      message: 'Список доступных Telegram чатов'
    });
  } catch (error) {
    console.error('Ошибка получения Telegram чатов:', error);
    res.status(500).json({
      success: false,
      error: error.message
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

// Получить все реальные Telegram чаты из аккаунта (кэшированные)
app.get('/api/telegram/real-chats/cached', async (req, res) => {
  try {
    console.log('📋 Получение кэшированных реальных чатов...');
    
    const result = await telegramRealAPI.getCachedChats();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        cached: result.cached || false
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Ошибка получения кэшированных чатов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Получить все реальные Telegram чаты из аккаунта (свежие данные)
app.post('/api/telegram/real-chats/refresh', async (req, res) => {
  try {
    console.log('🔄 Обновление списка реальных чатов...');
    
    const result = await telegramRealAPI.getRealChats();
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Чаты успешно обновлены'
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error
      });
    }
  } catch (error) {
    console.error('Ошибка обновления чатов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Добавить чаты в мониторинг из реальных чатов
app.post('/api/telegram/real-chats/add-to-monitoring', async (req, res) => {
  try {
    const { chatIds } = req.body;
    
    if (!chatIds || !Array.isArray(chatIds)) {
      return res.status(400).json({
        success: false,
        message: 'Требуется массив chatIds'
      });
    }

    console.log(`📱 Добавление ${chatIds.length} чатов в мониторинг...`);

    // Получаем кэшированные данные чатов
    const cachedResult = await telegramRealAPI.getCachedChats();
    
    if (!cachedResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Данные чатов не найдены. Сначала обновите список чатов.'
      });
    }

    const allChats = cachedResult.data.chats;
    const selectedChats = allChats.filter(chat => chatIds.includes(chat.id));

    if (selectedChats.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Выбранные чаты не найдены в данных'
      });
    }

    let added = 0;
    let skipped = 0;
    const results = [];

    for (const chat of selectedChats) {
      console.log(`🔍 Обрабатываем чат: ${chat.title} (ID: ${chat.id})`);
      try {
        // Проверяем, есть ли уже такой чат
        const { data: existingChat, error: checkError } = await db.supabase
          .from('monitored_chats')
          .select('id')
          .eq('chat_id', chat.id.toString())
          .single();

        console.log(`🔎 Проверка существования чата ${chat.title}:`, { existingChat, checkError });

        if (existingChat) {
          skipped++;
          console.log(`⏭️ Чат ${chat.title} уже существует, пропускаем`);
          results.push({
            chat_id: chat.id,
            title: chat.title,
            status: 'skipped',
            reason: 'Уже существует'
          });
          continue;
        }

        // Добавляем новый чат
        const { data: newChat, error } = await db.supabase
          .from('monitored_chats')
          .insert({
            chat_id: chat.id.toString(),
            chat_name: chat.title,
            platform: 'telegram',
            active: true // По умолчанию активируем
          })
          .select()
          .single();

        console.log(`💾 Попытка добавить чат ${chat.title} (ID: ${chat.id})`);
        
        if (error) {
          console.error(`❌ Ошибка добавления чата ${chat.title}:`, error);
          results.push({
            chat_id: chat.id,
            title: chat.title,
            status: 'error',
            reason: error.message
          });
        } else {
          added++;
          console.log(`✅ Чат ${chat.title} успешно добавлен в БД`);
          results.push({
            chat_id: chat.id,
            title: chat.title,
            status: 'added',
            participants: chat.participants_count
          });
        }

      } catch (err) {
        results.push({
          chat_id: chat.id,
          title: chat.title,
          status: 'error',
          reason: err.message
        });
      }
    }

    console.log(`📊 Итоги добавления: добавлено=${added}, пропущено=${skipped}, всего обработано=${results.length}`);

    res.json({
      success: true,
      data: {
        added: added,
        skipped: skipped,
        total: chatIds.length,
        results: results
      },
      message: `Добавлено ${added} чатов, пропущено ${skipped}`
    });

  } catch (error) {
    console.error('Ошибка добавления чатов в мониторинг:', error);
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
    app.listen(PORT, () => {
      console.log('🚀 Autologist Backend запущен');
      console.log(`📡 API: http://localhost:${PORT}/api/`);
      console.log(`✅ База данных: подключена`);
      console.log(`⏰ Время запуска: ${new Date().toLocaleString()}`);
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