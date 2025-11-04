const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TelegramRealAPI {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../telegram-parser/real-telegram-client.py');
    this.dataFilePath = path.join(__dirname, '../telegram-parser/real_telegram_chats.json');
  }

  async getRealChats() {
    try {
      console.log('🚀 Запуск получения реальных Telegram чатов...');
      
      // Сначала проверяем, есть ли уже кэшированные данные
      const cachedData = await this.readChatsData();
      if (cachedData) {
        console.log('📋 Используем кэшированные данные чатов');
        return {
          success: true,
          data: {
            timestamp: cachedData.timestamp,
            total_chats: cachedData.total_chats,
            cargo_related: cachedData.cargo_related,
            chats: cachedData.chats.map(chat => ({
              id: chat.id,
              title: chat.title,
              type: chat.type,
              participants_count: chat.participants_count,
              is_cargo_related: chat.is_cargo_related,
              unread_count: chat.unread_count,
              is_pinned: chat.is_pinned,
              last_message_date: chat.last_message_date,
              username: chat.username,
              is_verified: chat.is_verified,
              is_broadcast: chat.is_broadcast
            }))
          },
          cached: true
        };
      }
      
      // Если кэша нет, запускаем Python скрипт
      const result = await this.runPythonScript();
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // Читаем полученные данные
      const chatsData = await this.readChatsData();
      
      if (!chatsData) {
        throw new Error('Не удалось прочитать данные чатов');
      }

      return {
        success: true,
        data: {
          timestamp: chatsData.timestamp,
          total_chats: chatsData.total_chats,
          cargo_related: chatsData.cargo_related,
          chats: chatsData.chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            type: chat.type,
            participants_count: chat.participants_count,
            is_cargo_related: chat.is_cargo_related,
            unread_count: chat.unread_count,
            is_pinned: chat.is_pinned,
            last_message_date: chat.last_message_date,
            username: chat.username,
            is_verified: chat.is_verified,
            is_broadcast: chat.is_broadcast
          }))
        },
        cached: false
      };

    } catch (error) {
      console.error('❌ Ошибка получения реальных чатов:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runPythonScript() {
    return new Promise((resolve) => {
      const python = spawn('python', [this.pythonScriptPath], {
        cwd: path.dirname(this.pythonScriptPath),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log('Python:', data.toString().trim());
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error('Python Error:', data.toString().trim());
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ 
            success: false, 
            error: `Python script failed with code ${code}: ${stderr}` 
          });
        }
      });

      python.on('error', (err) => {
        resolve({ 
          success: false, 
          error: `Failed to start Python script: ${err.message}` 
        });
      });
    });
  }

  async readChatsData() {
    try {
      if (!fs.existsSync(this.dataFilePath)) {
        throw new Error('Файл с данными чатов не найден');
      }

      const data = fs.readFileSync(this.dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Ошибка чтения данных чатов:', error);
      return null;
    }
  }

  async getCachedChats() {
    try {
      const chatsData = await this.readChatsData();
      
      if (!chatsData) {
        return {
          success: false,
          error: 'Кэшированные данные не найдены. Запустите получение чатов.'
        };
      }

      return {
        success: true,
        data: {
          timestamp: chatsData.timestamp,
          total_chats: chatsData.total_chats,
          cargo_related: chatsData.cargo_related,
          chats: chatsData.chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            type: chat.type,
            participants_count: chat.participants_count,
            is_cargo_related: chat.is_cargo_related,
            unread_count: chat.unread_count,
            is_pinned: chat.is_pinned,
            last_message_date: chat.last_message_date,
            username: chat.username,
            is_verified: chat.is_verified,
            is_broadcast: chat.is_broadcast
          }))
        },
        cached: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TelegramRealAPI;