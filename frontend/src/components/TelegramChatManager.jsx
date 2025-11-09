import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TelegramChatManager.css';

export default function TelegramChatManager({ apiBase, onUpdate, keywords = [] }) {
  const [availableChats, setAvailableChats] = useState([]);
  const [monitoredChats, setMonitoredChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    loadMonitoredChats();
    loadAvailableChats();
  }, []);

  // Загрузить отслеживаемые чаты
  const loadMonitoredChats = async () => {
    try {
      const response = await axios.get(`${apiBase}/chats`);
      const data = response.data?.data || [];
      const telegramChats = data.filter(chat => chat.platform === 'telegram');
      setMonitoredChats(telegramChats);
    } catch (error) {
      console.error('Ошибка загрузки отслеживаемых чатов:', error);
      setMonitoredChats([]);
    }
  };

  // Загрузить доступные чаты из Telegram аккаунта
  const loadAvailableChats = async () => {
    console.log('');
    console.log('🔥 ================================');
    console.log('🔥 FRONTEND: Загрузка чатов начата');
    console.log('🔥 ================================');
    console.log('📅 Время:', new Date().toISOString());
    console.log('🔗 API Base:', apiBase);
      console.log('📍 Endpoint:', `${apiBase}/chats`);
    
    try {
      setLoadingChats(true);
      console.log('⏳ Устанавливаем loadingChats = true');
      
      console.log('🌐 Отправляем HTTP запрос...');
        const response = await axios.get(`${apiBase}/chats`);
      
      console.log('✅ Ответ получен:');
      console.log('  📊 Status:', response.status);
      console.log('  📋 Headers:', response.headers);
      console.log('  📄 Data keys:', Object.keys(response.data || {}));
      console.log('  🎯 Success:', response.data?.success);
      console.log('  📝 Message:', response.data?.message);
      console.log('  📊 Data length:', response.data?.data?.length || 0);
      
      if (response.data?.data) {
        console.log('📋 Первые 3 чата:');
        response.data.data.slice(0, 3).forEach((chat, index) => {
          console.log(`  ${index + 1}. ${chat.chat_name || `Chat ${chat.chat_id}`} (ID: ${chat.chat_id})`);
        });
      }
      const data = response.data?.data || [];
      console.log(`🎯 Устанавливаем ${data.length} чатов в state`);
      setAvailableChats(data);
      
    } catch (error) {
      console.error('');
      console.error('❌ ================================');
      console.error('❌ FRONTEND: Ошибка загрузки чатов');
      console.error('❌ ================================');
      console.error('📊 Status:', error.response?.status);
      console.error('📄 Data:', error.response?.data);
      console.error('📝 Message:', error.message);
      console.error('🔍 Full error:', error);
      
      alert(`Ошибка при загрузке чатов: ${error.response?.data?.message || error.message}`);
      setAvailableChats([]);
    } finally {
      console.log('🏁 Устанавливаем loadingChats = false');
      setLoadingChats(false);
    }
  };

  // Добавить чат в мониторинг
  const addChatToMonitoring = async (chat) => {
    try {
      setLoading(true);
      await axios.post(`${apiBase}/chats`, {
        chat_id: chat.id,
        chat_name: chat.title,
        platform: 'telegram',
        active: true
      });
      // После добавления обновляем только доступные чаты
      await loadAvailableChats();
      onUpdate?.();
    } catch (error) {
      console.error('Ошибка добавления чата:', error);
      alert('Ошибка при добавлении чата в мониторинг');
    } finally {
      setLoading(false);
    }
  };

  // Переключить статус отслеживаемого чата
  const toggleMonitoredChat = async (chatId, currentActive) => {
    try {
      console.log('Изменение статуса чата:', chatId, 'на', !currentActive);
      const response = await axios.patch(`${apiBase}/chats/${chatId}`, {
        active: !currentActive
      });
      console.log('Ответ сервера при изменении статуса:', response.data);
      loadMonitoredChats();
      onUpdate?.();
    } catch (error) {
      console.error('Ошибка изменения статуса чата:', error);
      console.error('Статус ошибки:', error.response?.status);
      console.error('Данные ошибки:', error.response?.data);
      alert(`Ошибка при изменении статуса чата: ${error.response?.data?.message || error.message}`);
    }
  };

  // Удалить чат из мониторинга
  const deleteMonitoredChat = async (chatId) => {
    if (!window.confirm('Удалить чат из мониторинга?')) return;

    try {
      console.log('Удаление чата с ID:', chatId);
      const response = await axios.delete(`${apiBase}/chats/${chatId}`);
      console.log('Ответ сервера при удалении:', response.data);
      loadMonitoredChats();
      onUpdate?.();
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      console.error('Статус ошибки:', error.response?.status);
      console.error('Данные ошибки:', error.response?.data);
      alert(`Ошибка при удалении чата: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="telegram-chat-manager">
      {/* ДВУХПАНЕЛЬНАЯ КОМПОНОВКА - КАК В STATISTICS */}
      <div className="management-panels">
        
        {/* ЛЕВАЯ ПАНЕЛЬ - ОТСЛЕЖИВАЕМЫЕ ЧАТЫ */}
        <div className="management-panel">
          <div className="panel-header">
            <h2>🎯 Отслеживаемые чаты</h2>
            <div className="panel-stats">
              <span className="stat-badge">{monitoredChats.length} всего</span>
              <span className="stat-badge active">{monitoredChats.filter(c => c.active).length} активных</span>
            </div>
          </div>

          <div className="monitored-chats-list">
            {monitoredChats.length === 0 ? (
              <div className="empty-state">
                <p>📋 Нет отслеживаемых чатов</p>
                <p>Загрузите чаты из аккаунта и добавьте в мониторинг</p>
              </div>
            ) : (
              monitoredChats.map(chat => (
                <div key={chat.id} className="monitored-chat-item">
                  <div className="chat-info">
                    <span className={`status-indicator ${chat.active ? 'active' : 'inactive'}`}>
                      {chat.active ? '🟢' : '🔴'}
                    </span>
                    <div className="chat-details">
                      <strong className="chat-name">{chat.chat_name || `Chat ${chat.chat_id}`}</strong>
                      <small className="chat-id">ID: {chat.chat_id}</small>
                    </div>
                  </div>
                  <div className="chat-controls">
                    <button
                      onClick={() => toggleMonitoredChat(chat.id, chat.active)}
                      className={`control-btn ${chat.active ? 'pause' : 'play'}`}
                      title={chat.active ? 'Приостановить мониторинг' : 'Возобновить мониторинг'}
                    >
                      {chat.active ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => deleteMonitoredChat(chat.id)}
                      className="control-btn delete"
                      title="Удалить из мониторинга"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ - ДОСТУПНЫЕ ЧАТЫ */}
        <div className="management-panel">
          <div className="panel-header">
            <h2>📋 Доступные чаты</h2>
            <button 
              onClick={loadAvailableChats}
              disabled={loadingChats}
              className="load-chats-btn"
            >
              {loadingChats ? '⏳ Загрузка...' : '📥 Загрузить чаты из аккаунта'}
            </button>
          </div>

          <div className="available-chats-list">
            {availableChats.length === 0 ? (
              <div className="empty-state">
                <p>📭 Нет загруженных чатов</p>
                <p>Нажмите кнопку выше, чтобы загрузить чаты из вашего Telegram аккаунта</p>
              </div>
            ) : (
              availableChats
                .filter(chat => !monitoredChats.some(mc => mc.chat_id === chat.chat_id))
                .map(chat => (
                  <div key={chat.chat_id} className="available-chat-item">
                    <div className="chat-info">
                      <div className="chat-details">
                        <strong className="chat-name">{chat.chat_name || `Chat ${chat.chat_id}`}</strong>
                      </div>
                    </div>
                    <div className="chat-controls">
                      <button
                        onClick={() => addChatToMonitoring(chat)}
                        disabled={loading}
                        className="control-btn monitor"
                        title="Добавить в мониторинг"
                      >
                        {loading ? '⏳' : '➕ Мониторить'}
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}