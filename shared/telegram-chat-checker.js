// Telegram API интеграция для проверки доступных чатов
const { TelegramApi } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');

class TelegramChatChecker {
  constructor() {
    this.apiId = process.env.TELEGRAM_API_ID;
    this.apiHash = process.env.TELEGRAM_API_HASH;
    this.stringSession = new StringSession(''); // Пустая сессия для начала
    this.client = null;
  }

  async initialize() {
    console.log('🔄 Инициализация Telegram клиента...');
    
    this.client = new TelegramApi(this.stringSession, this.apiId, this.apiHash, {
      connectionRetries: 5,
    });

    await this.client.start({
      phoneNumber: async () => await input.text('Введите номер телефона: '),
      password: async () => await input.text('Введите пароль (если есть): '),
      phoneCode: async () => await input.text('Введите код из SMS: '),
      onError: (err) => console.log(err),
    });

    console.log('✅ Telegram клиент подключен!');
    console.log('🔑 Session string:', this.client.session.save());
  }

  async getAvailableChats() {
    try {
      console.log('🔍 Получаем список доступных чатов...');
      
      const dialogs = await this.client.getDialogs({
        limit: 100
      });

      const chats = [];
      
      for (const dialog of dialogs) {
        const entity = dialog.entity;
        
        // Фильтруем только группы и супергруппы
        if (entity.className === 'Channel' && (entity.megagroup || entity.broadcast)) {
          chats.push({
            id: entity.id.toString(),
            title: entity.title,
            username: entity.username || null,
            participantsCount: entity.participantsCount || 0,
            type: entity.megagroup ? 'supergroup' : 'channel',
            verified: entity.verified || false,
            restricted: entity.restricted || false
          });
        }
      }

      console.log(`📱 Найдено ${chats.length} доступных чатов/каналов`);
      return chats;
      
    } catch (error) {
      console.error('❌ Ошибка получения чатов:', error);
      throw error;
    }
  }

  async getChatInfo(chatId) {
    try {
      const entity = await this.client.getEntity(chatId);
      
      return {
        id: entity.id.toString(),
        title: entity.title,
        username: entity.username || null,
        participantsCount: entity.participantsCount || 0,
        type: entity.megagroup ? 'supergroup' : 'channel',
        verified: entity.verified || false,
        description: entity.about || null
      };
      
    } catch (error) {
      console.error(`❌ Ошибка получения информации о чате ${chatId}:`, error);
      return null;
    }
  }

  async checkChatAccess(chatIds) {
    console.log('🔍 Проверяем доступ к указанным чатам...');
    
    const results = [];
    
    for (const chatId of chatIds) {
      try {
        const info = await this.getChatInfo(chatId);
        
        if (info) {
          results.push({
            chatId: chatId,
            accessible: true,
            info: info
          });
          console.log(`✅ ${info.title} (${chatId}) - доступен`);
        } else {
          results.push({
            chatId: chatId,
            accessible: false,
            info: null
          });
          console.log(`❌ ${chatId} - недоступен`);
        }
        
      } catch (error) {
        results.push({
          chatId: chatId,
          accessible: false,
          error: error.message
        });
        console.log(`❌ ${chatId} - ошибка: ${error.message}`);
      }
    }
    
    return results;
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      console.log('🔌 Telegram клиент отключен');
    }
  }
}

module.exports = TelegramChatChecker;