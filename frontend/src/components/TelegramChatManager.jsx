import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TelegramChatManager.css';

export default function TelegramChatManager({ apiBase, onUpdate, keywords = [] }) {
  const [realChats, setRealChats] = useState([]);
  const [monitoredChats, setMonitoredChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [sortBy, setSortBy] = useState('participants');
  const [filterType, setFilterType] = useState('all');
  
  // Состояние для управления ключевыми словами
  const [newKeyword, setNewKeyword] = useState({
    keyword: ''
  });

  useEffect(() => {
    loadCachedChats();
    loadMonitoredChats();
  }, []);

  const loadCachedChats = async () => {
    try {
      setLoading(true);
      console.log('TelegramChatManager: API endpoint /telegram/real-chats/cached временно недоступен');
      setRealChats([]);
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.log('Кэшированные данные не найдены:', error.response?.data?.message || error.message);
      setRealChats([]);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleChatSelection = (chat) => {
    setSelectedChats(prev => {
      const isSelected = prev.some(c => c.id === chat.id);
      return isSelected 
        ? prev.filter(c => c.id !== chat.id)
        : [...prev, chat];
    });
  };

  const addSelectedChats = async () => {
    if (selectedChats.length === 0) {
      alert('Выберите чаты для добавления');
      return;
    }

    try {
      setLoading(true);
      const promises = selectedChats.map(chat => 
        axios.post(`${apiBase}/chats`, {
          chat_id: chat.id,
          chat_name: chat.title,
          platform: 'telegram',
          active: true
        })
      );

      await Promise.all(promises);
      setSelectedChats([]);
      loadMonitoredChats();
      onUpdate?.();
      alert(`Добавлено ${selectedChats.length} чатов`);
    } catch (error) {
      console.error('Ошибка добавления чатов:', error);
      alert('Ошибка при добавлении чатов');
    } finally {
      setLoading(false);
    }
  };

  const toggleMonitoredChat = async (chatId, currentActive) => {
    try {
      await axios.patch(`${apiBase}/chats/${chatId}`, {
        active: !currentActive
      });
      loadMonitoredChats();
      onUpdate?.();
    } catch (error) {
      console.error('Ошибка изменения статуса чата:', error);
      alert('Ошибка при изменении статуса чата');
    }
  };

  const deleteMonitoredChat = async (chatId) => {
    if (!window.confirm('Удалить чат из мониторинга?')) return;

    try {
      await axios.delete(`${apiBase}/chats/${chatId}`);
      loadMonitoredChats();
      onUpdate?.();
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      alert('Ошибка при удалении чата');
    }
  };

  const sortedChats = [...realChats].sort((a, b) => {
    switch (sortBy) {
      case 'participants':
        return (b.participants_count || 0) - (a.participants_count || 0);
      case 'name':
        return a.title.localeCompare(b.title);
      case 'id':
        return b.id - a.id;
      default:
        return 0;
    }
  });

  const filteredChats = sortedChats.filter(chat => {
    const isMonitored = monitoredChats.some(mc => mc.chat_id === chat.id);
    switch (filterType) {
      case 'monitored':
        return isMonitored;
      case 'not_monitored':
        return !isMonitored;
      default:
        return true;
    }
  });

  return (
    <div className="telegram-chat-manager">
      {/* ЗАГОЛОВОК И СТАТИСТИКА - КОМПАКТНО */}
      <div className="manager-header-compact">
        <div className="header-info-compact">
          <h1>📱 Управление Telegram чатами</h1>
          <div className="stats-row-compact">
            <div className="stat-item-compact">
              <span className="stat-value">{realChats.length}</span>
              <span className="stat-label">Доступных</span>
            </div>
            <div className="stat-item-compact">
              <span className="stat-value">{monitoredChats.length}</span>
              <span className="stat-label">Отслеживаемых</span>
            </div>
            <div className="stat-item-compact">
              <span className="stat-value">{monitoredChats.filter(c => c.active).length}</span>
              <span className="stat-label">Активных</span>
            </div>
            <div className="stat-item-compact">
              <span className="stat-value">{selectedChats.length}</span>
              <span className="stat-label">Выбрано</span>
            </div>
          </div>
        </div>
        
        <div className="header-actions-compact">
          <button 
            onClick={loadCachedChats} 
            disabled={loading}
            className="btn-refresh-compact"
          >
            {loading ? '⏳' : '🔄'} Обновить
          </button>
          {selectedChats.length > 0 && (
            <button 
              onClick={addSelectedChats}
              className="btn-add-compact"
              disabled={loading}
            >
              ➕ Добавить ({selectedChats.length})
            </button>
          )}
        </div>
      </div>

      {/* ОСНОВНОЙ КОНТЕНТ - КОМПАКТНЫЙ МАКЕТ */}
      <div className="manager-content-compact">
        {/* ОТСЛЕЖИВАЕМЫЕ ЧАТЫ - ГЛАВНЫЙ БЛОК */}
        <div className="monitored-chats-main">
          <div className="section-header">
            <h2>�️ Отслеживаемые чаты ({monitoredChats.length})</h2>
          </div>

          <div className="monitored-grid-compact">
            {monitoredChats.length === 0 ? (
              <div className="empty-state">
                <p>📋 Нет отслеживаемых чатов</p>
                <p>Выберите чаты из списка ниже</p>
              </div>
            ) : (
              monitoredChats.map(chat => (
                <div key={chat.id} className="monitored-item-compact">
                  <div className="monitored-content">
                    <span className={`status-dot ${chat.active ? 'active' : 'inactive'}`}>
                      {chat.active ? '🟢' : '🔴'}
                    </span>
                    <div className="chat-name-compact">
                      <strong>{chat.chat_name || chat.name || `Chat ${chat.chat_id}`}</strong>
                      <small>ID: {chat.chat_id}</small>
                    </div>
                  </div>
                  <div className="monitored-controls">
                    <button
                      onClick={() => toggleMonitoredChat(chat.id, chat.active)}
                      className={`btn-toggle-compact ${chat.active ? 'active' : 'inactive'}`}
                      title={chat.active ? 'Отключить' : 'Включить'}
                    >
                      {chat.active ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => deleteMonitoredChat(chat.id)}
                      className="btn-delete-compact"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ДОСТУПНЫЕ ЧАТЫ - КОМПАКТНЫЙ СПИСОК */}
        <div className="available-chats-compact">
          <div className="section-header">
            <h2>� Доступные чаты для добавления</h2>
            <div className="filters-compact">
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select-compact"
              >
                <option value="participants">По участникам</option>
                <option value="name">По названию</option>
              </select>
            </div>
          </div>

          <div className="available-grid-compact">
            {filteredChats.length === 0 ? (
              <div className="empty-state-compact">
                <p>📭 Чаты не найдены</p>
              </div>
            ) : (
              filteredChats.slice(0, 8).map(chat => {
                const isMonitored = monitoredChats.some(mc => mc.chat_id === chat.id);
                const isSelected = selectedChats.some(c => c.id === chat.id);
                
                return (
                  <div 
                    key={chat.id} 
                    className={`available-item-compact ${isSelected ? 'selected' : ''} ${isMonitored ? 'monitored' : ''}`}
                    onClick={() => !isMonitored && toggleChatSelection(chat)}
                  >
                    <div className="available-content">
                      {isMonitored && <span className="badge-monitored">✅</span>}
                      {isSelected && <span className="badge-selected">🔵</span>}
                      <div className="chat-info-inline">
                        <strong>{chat.title}</strong>
                        <span className="participants">👥 {chat.participants_count || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {filteredChats.length > 8 && (
            <div className="more-chats-info">
              И ещё {filteredChats.length - 8} чатов... Используйте фильтры для поиска.
            </div>
          )}
        </div>
      </div>

      {/* КОМПАКТНАЯ СЕКЦИЯ КЛЮЧЕВЫХ СЛОВ */}
      <div className="keywords-section-compact">
        <div className="keywords-row">
          <div className="keywords-info-compact">
            <h3>🔍 Ключевые слова ({keywords.length})</h3>
            <p>Система ищет эти слова в сообщениях</p>
            <div className="keywords-list-inline">
              {keywords.length === 0 ? (
                <span className="no-keywords">Не настроены</span>
              ) : (
                keywords.slice(0, 6).map((keyword, index) => (
                  <span key={index} className="keyword-chip">
                    {typeof keyword === 'string' ? keyword : keyword.keyword || ''}
                  </span>
                ))
              )}
              {keywords.length > 6 && (
                <span className="more-keywords">+{keywords.length - 6}</span>
              )}
            </div>
          </div>
          
          <div className="parser-info-compact">
            <h3>💡 Принцип работы</h3>
            <ul className="info-list-compact">
              <li>🎯 Мониторинг чатов в реальном времени</li>
              <li>🔍 Поиск по ключевым словам</li>
              <li>🚫 Автофильтрация дубликатов</li>
              <li>📨 Уведомления получателям</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}