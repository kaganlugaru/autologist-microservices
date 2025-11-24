// shared/database.js
// Общий модуль для работы с Supabase базой данных
const { createClient } = require('@supabase/supabase-js');

class DatabaseManager {
  /**
   * Получить все доступные чаты, которые ещё не мониторятся
   */
  async getAvailableChats(platform = null) {
    try {
      // Получаем все чаты
      let query = this.supabase
        .from('all_chats')
        .select('chat_id, chat_name')
        .limit(1000);
      const { data: allChats, error: allError } = await query;
      if (allError) throw allError;

      // Получаем уже отслеживаемые чаты
      let monitoredQuery = this.supabase
        .from('monitored_chats')
        .select('chat_id');
      if (platform) {
        monitoredQuery = monitoredQuery.eq('platform', platform);
      }
      const { data: monitoredChats, error: monitoredError } = await monitoredQuery;
      if (monitoredError) throw monitoredError;

      // Создаём множество ID отслеживаемых чатов для быстрого поиска
      const monitoredChatIds = new Set(monitoredChats.map(chat => chat.chat_id));

      // Фильтруем доступные чаты, исключая уже отслеживаемые
      const availableChats = allChats.filter(chat => !monitoredChatIds.has(chat.chat_id));

      console.log(`📊 Всего чатов: ${allChats.length}, отслеживаемых: ${monitoredChats.length}, доступных: ${availableChats.length}`);

      return availableChats.map(chat => ({
        chat_id: chat.chat_id,
        chat_name: chat.chat_name ? chat.chat_name : `Chat ${chat.chat_id}`
      }));
    } catch (error) {
      console.error('Ошибка получения доступных чатов:', error);
      throw error;
    }
  }
  constructor() {
    // Инициализация подключения к Supabase
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Используем service_role для обхода RLS
    
    console.log('🔍 Debug - SUPABASE_URL:', this.supabaseUrl ? 'есть' : 'отсутствует');
    console.log('🔍 Debug - SUPABASE_SERVICE_ROLE_KEY:', this.supabaseKey ? 'есть' : 'отсутствует');
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
    }
    
    this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
  }

  // ===== РАБОТА С СООБЩЕНИЯМИ =====
  
  /**
   * Сохранить сообщение в БД с проверкой на дубликаты
   */
  async saveMessage(messageData) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert([{
          message_id: messageData.message_id,
          chat_id: messageData.chat_id,
          chat_name: messageData.chat_name,
          user_id: messageData.user_id,
          username: messageData.username,
          message_text: messageData.message_text,
          content_hash: messageData.content_hash,
          price: messageData.price,
          platform: messageData.platform,
          contains_keywords: messageData.contains_keywords || false,
          matched_keywords: messageData.matched_keywords || []
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
      throw error;
    }
  }

  /**
   * Проверить существование сообщения по content_hash и user_id
   */
  async checkDuplicate(contentHash, userId) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('id, price, message_text')
        .eq('content_hash', contentHash)
        .eq('user_id', userId)
        .eq('is_duplicate', false);

      if (error) throw error;
      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Ошибка проверки дубликата:', error);
      throw error;
    }
  }

  /**
   * Получить последние сообщения с фильтрами
   */
  async getRecentMessages(limit = 1000, since = null, keywords = null) {
    try {
      let query = this.supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      // Фильтр по дате (например, за последние 24 часа)
      if (since) {
        query = query.gte('created_at', since);
      }

      // Фильтр по ключевым словам
      if (keywords) {
        // Поиск в тексте сообщения (case-insensitive)
        query = query.ilike('message_text', `%${keywords}%`);
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Ошибка получения сообщений:', error);
      throw error;
    }
  }

  /**
   * Поиск сообщений по нескольким ключевым словам (сложный поиск)
   */
  async searchMessagesByMultipleKeywords(keywords, limit = 1000, since = null) {
    try {
      let query = this.supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      // Фильтр по дате
      if (since) {
        query = query.gte('created_at', since);
      }

      // Создаем условие для каждого ключевого слова
      // Сообщение должно содержать ВСЕ указанные ключевые слова
      if (keywords && keywords.length > 0) {
        // Для каждого ключевого слова добавляем фильтр
        keywords.forEach(keyword => {
          if (keyword && keyword.trim()) {
            query = query.ilike('message_text', `%${keyword.trim()}%`);
          }
        });
      }

      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Ошибка поиска по множественным ключевым словам:', error);
      
      // Fallback: используем простой поиск по первому ключевому слову
      if (keywords && keywords.length > 0) {
        console.log('🔄 [Database] Fallback на простой поиск по:', keywords[0]);
        return this.getRecentMessages(limit, since, keywords[0]);
      }
      
      throw error;
    }
  }

  /**
   * Получить сообщения для ИИ обработки
   */
  async getUnprocessedMessages(limit = 200) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('ai_processed', false)
        .eq('is_duplicate', false)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Ошибка получения необработанных сообщений:', error);
      throw error;
    }
  }

  /**
   * Обновить статус ИИ обработки
   */
  async updateAIProcessed(messageId, structuredData) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .update({
          ai_processed: true,
          ai_structured_data: structuredData
        })
        .eq('id', messageId)
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Ошибка обновления ИИ статуса:', error);
      throw error;
    }
  }

  // ===== РАБОТА С КЛЮЧЕВЫМИ СЛОВАМИ =====
  
  /**
   * Получить все активные ключевые слова
   */
  async getKeywords() {
    try {
      const { data, error } = await this.supabase
        .from('keywords')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Ошибка получения ключевых слов:', error);
      throw error;
    }
  }

  // ===== РАБОТА С ОТСЛЕЖИВАЕМЫМИ ЧАТАМИ =====
  
  /**
   * Получить все отслеживаемые чаты
   */
  async getMonitoredChats(platform = null) {
    try {
      let query = this.supabase
        .from('monitored_chats')
        .select('*');
        // Убираем фильтр .eq('active', true) чтобы показывать ВСЕ чаты

      if (platform) {
        query = query.eq('platform', platform);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Ошибка получения отслеживаемых чатов:', error);
      throw error;
    }
  }

  /**
   * Добавить чат в отслеживание
   */
  async addMonitoredChat(chatData) {
    try {
      const { data, error } = await this.supabase
        .from('monitored_chats')
        .insert([{
          chat_id: chatData.chat_id,
          chat_name: chatData.chat_name,
          platform: chatData.platform,
          keywords: chatData.keywords || []
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Ошибка добавления чата:', error);
      throw error;
    }
  }

  // ===== РАБОТА С ОБЪЯВЛЕНИЯМИ =====
  
  /**
   * Создать объявление
   */
  async createAnnouncement(announcementData) {
    try {
      const { data, error } = await this.supabase
        .from('announcements')
        .insert([{
          title: announcementData.title,
          content: announcementData.content,
          target_chats: announcementData.target_chats,
          status: announcementData.status || 'draft',
          scheduled_at: announcementData.scheduled_at
        }])
        .select();

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Ошибка создания объявления:', error);
      throw error;
    }
  }

  /**
   * Получить объявления
   */
  async getAnnouncements(status = null) {
    try {
      let query = this.supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Ошибка получения объявлений:', error);
      throw error;
    }
  }

  // ===== УТИЛИТЫ =====
  
  /**
   * Получить общую статистику системы
   */
  async getStats() {
    try {
      // Получаем общее количество сообщений
      const { count: totalMessages } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Получаем количество сообщений за сегодня
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayMessages } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Получаем количество дубликатов
      const { count: duplicates } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_duplicate', true);

      // Получаем количество активных чатов
      const { count: activeChats } = await this.supabase
        .from('monitored_chats')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Получаем количество ключевых слов
      const { count: totalKeywords } = await this.supabase
        .from('keywords')
        .select('*', { count: 'exact', head: true });

      // Получаем сообщения с ценами
      const { count: messagesWithPrices } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .not('price', 'is', null);

      // Получаем статистику по чатам (топ 5)
      const { data: chatStats } = await this.supabase
        .from('messages')
        .select('chat_name, chat_id')
        .not('chat_name', 'is', null)
        .limit(1000);

      // Подсчитываем сообщения по чатам
      const chatCounts = {};
      chatStats?.forEach(msg => {
        const chatKey = msg.chat_name || msg.chat_id;
        chatCounts[chatKey] = (chatCounts[chatKey] || 0) + 1;
      });

      const topChats = Object.entries(chatCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Получаем статистику по дням (последние 7 дней)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { count: dayCount } = await this.supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', date.toISOString())
          .lt('created_at', nextDate.toISOString());

        last7Days.push({
          date: date.toISOString().split('T')[0],
          count: dayCount || 0
        });
      }

      return {
        totalMessages: totalMessages || 0,
        todayMessages: todayMessages || 0,
        duplicates: duplicates || 0,
        activeChats: activeChats || 0,
        totalKeywords: totalKeywords || 0,
        messagesWithPrices: messagesWithPrices || 0,
        duplicateRate: totalMessages > 0 ? ((duplicates || 0) / totalMessages * 100).toFixed(1) : 0,
        priceRate: totalMessages > 0 ? ((messagesWithPrices || 0) / totalMessages * 100).toFixed(1) : 0,
        topChats: topChats,
        dailyStats: last7Days
      };
    } catch (error) {
      console.error('Ошибка получения статистики:', error);
      throw error;
    }
  }

  /**
   * Проверить соединение с базой
   */
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('keywords')
        .select('count', { count: 'exact' })
        .limit(1);

      if (error) throw error;
      return { success: true, message: 'Соединение с БД установлено' };
    } catch (error) {
      return { success: false, message: `Ошибка соединения: ${error.message}` };
    }
  }

  /**
   * Очистить старые сообщения (старше N дней)
   */
  async cleanOldMessages(daysOld = 14) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from('messages')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return { success: true, deletedCount: data?.length || 0 };
    } catch (error) {
      console.error('Ошибка очистки старых сообщений:', error);
      throw error;
    }
  }

  // ===== УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ =====

  /**
   * Получить пользователя по username
   */
  async getUserByUsername(username) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Пользователь не найден
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Ошибка получения пользователя:', error);
      throw error;
    }
  }

  /**
   * Создать нового пользователя
   */
  async createUser(username, passwordHash, role = 'user') {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert([{
          username,
          password_hash: passwordHash,
          role
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Ошибка создания пользователя:', error);
      throw error;
    }
  }

  /**
   * Получить всех пользователей (только для админов)
   */
  async getAllUsers() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, username, role, created_at, last_login, is_active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Ошибка получения списка пользователей:', error);
      throw error;
    }
  }

  /**
   * Обновить пользователя
   */
  async updateUser(id, updates) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Ошибка обновления пользователя:', error);
      throw error;
    }
  }

  /**
   * Удалить пользователя (деактивировать)
   */
  async deleteUser(id) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Ошибка удаления пользователя:', error);
      throw error;
    }
  }

  /**
   * Обновить время последнего входа
   */
  async updateLastLogin(userId) {
    try {
      await this.supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Ошибка обновления времени входа:', error);
    }
  }
}

module.exports = DatabaseManager;