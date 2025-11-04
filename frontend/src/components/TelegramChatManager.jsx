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
  
  // Состояние для управления ключевыми словами (упрощено - без категорий)
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
      const response = await axios.get(`${apiBase}/telegram/real-chats/cached`);
      
      if (response.data.success) {
        setRealChats(response.data.data.chats || []);
        setLastUpdate(response.data.data.timestamp);
      }
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
      // API returns { success: true, data: [...] }
      const data = response.data?.data || [];
      const telegramChats = data.filter(chat => chat.platform === 'telegram');
      setMonitoredChats(telegramChats);
    } catch (error) {
      console.error('Ошибка загрузки отслеживаемых чатов:', error);
      setMonitoredChats([]);
    }
  };

  const refreshRealChats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Обновляем список чатов из Telegram...');
      
      const response = await axios.post(`${apiBase}/telegram/real-chats/refresh`);
      
      if (response.data.success) {
        setRealChats(response.data.data.chats || []);
        setLastUpdate(response.data.data.timestamp);
        alert(`✅ Получено ${response.data.data.total_chats} чатов! (${response.data.data.cargo_related} связанных с грузоперевозками)`);
      } else {
        alert(`❌ Ошибка: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Ошибка обновления чатов:', error);
      alert(`❌ Ошибка обновления: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addSelectedChatsToMonitoring = async () => {
    if (selectedChats.length === 0) {
      alert('Выберите чаты для добавления в мониторинг');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${apiBase}/telegram/real-chats/add-to-monitoring`, {
        chatIds: selectedChats
      });

      if (response.data.success) {
        const { added, skipped, results } = response.data.data;
        
        setSelectedChats([]);
        await loadMonitoredChats();
        onUpdate?.();
        
        let message = `✅ Добавлено: ${added} чатов\n⏭️ Пропущено: ${skipped} чатов\n\n`;
        results.forEach(result => {
          const status = result.status === 'added' ? '✅' : 
                        result.status === 'skipped' ? '⏭️' : '❌';
          message += `${status} ${result.title}\n`;
        });
        
        alert(message);
      } else {
        alert(`❌ Ошибка: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Ошибка добавления чатов:', error);
      alert(`❌ Ошибка добавления: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeFromMonitoring = async (chatId) => {
    if (!confirm('Удалить чат из мониторинга?')) return;

    try {
      await axios.delete(`${apiBase}/chats/${chatId}`);
      await loadMonitoredChats();
      onUpdate?.();
      alert('Чат удален из мониторинга');
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
      alert(`Ошибка удаления: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleChatStatus = async (chatId, currentStatus) => {
    try {
      await axios.put(`${apiBase}/chats/${chatId}`, {
        active: !currentStatus
      });
      await loadMonitoredChats();
      onUpdate?.();
    } catch (error) {
      console.error('Ошибка изменения статуса чата:', error);
    }
  };

  // Добавление нового ключевого слова (без категорий)
  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.keyword.trim()) return;

    try {
      await axios.post(`${apiBase}/keywords`, { keyword: newKeyword.keyword });
      setNewKeyword({ keyword: '' });
      onUpdate?.(); // Обновить общие данные
      alert('✅ Ключевое слово добавлено');
    } catch (error) {
      console.error('Ошибка добавления ключевого слова:', error);
      alert(`❌ Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const deleteKeyword = async (keywordId) => {
    if (!keywordId) {
      console.error('ID ключевого слова не определен');
      return;
    }
    if (!confirm('Удалить ключевое слово?')) return;
    
    try {
      await axios.delete(`${apiBase}/keywords/${keywordId}`);
      onUpdate?.();
      alert('✅ Ключевое слово удалено');
    } catch (error) {
      console.error('Ошибка удаления ключевого слова:', error);
      alert(`❌ Ошибка: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleKeywordStatus = async (keywordId, currentStatus) => {
    if (!keywordId) {
      console.error('ID ключевого слова не определен');
      return;
    }
    try {
      await axios.put(`${apiBase}/keywords/${keywordId}`, {
        active: !currentStatus
      });
      onUpdate?.();
    } catch (error) {
      console.error('Ошибка изменения статуса ключевого слова:', error);
    }
  };

  // Фильтрация и сортировка чатов
  const getFilteredAndSortedChats = () => {
    let filtered = realChats;

    // Фильтрация
    switch (filterType) {
      case 'cargo':
        filtered = realChats.filter(chat => chat.is_cargo_related);
        break;
      case 'large':
        filtered = realChats.filter(chat => chat.participants_count > 1000);
        break;
      default: // 'all'
        filtered = realChats;
    }

    // Сортировка
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'cargo':
          return (b.is_cargo_related ? 1 : 0) - (a.is_cargo_related ? 1 : 0);
        case 'participants':
        default:
          return b.participants_count - a.participants_count;
      }
    });
  };

  // Разделяем чаты на выбранные и остальные
  const filteredChats = getFilteredAndSortedChats();
  const selectedChatsList = filteredChats.filter(chat => selectedChats.includes(chat.id));
  const unselectedChatsList = filteredChats.filter(chat => !selectedChats.includes(chat.id));

  const toggleChatSelection = (chatId) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  // Упрощённый список ключевых слов (без категорий)
  const keywordList = Array.isArray(keywords) ? keywords : [];

  const cargoChats = realChats.filter(chat => chat.is_cargo_related);
  const largeChats = realChats.filter(chat => chat.participants_count > 1000);

  return (
    <div className="telegram-chat-manager">
      <div className="manager-header">
        <h2>📱 Управление Telegram Чатами</h2>
        <div className="header-actions">
          <button
            onClick={refreshRealChats}
            disabled={loading}
            className="refresh-btn"
          >
            {loading ? '🔄 Загрузка...' : '🔄 Обновить список из Telegram'}
          </button>
          {lastUpdate && (
            <span className="last-update">
              Обновлено: {new Date(lastUpdate).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Управление ключевыми словами */}
      <div className="keywords-section">
        <h3>🔍 Ключевые слова для пересылки</h3>
        <p className="description">
          Сообщения, содержащие эти ключевые слова, будут автоматически пересылаться на указанный аккаунт
        </p>
        
        {/* Добавление нового ключевого слова */}
        <form onSubmit={handleAddKeyword} className="add-keyword-form">
          <input
            type="text"
            placeholder="Введите ключевое слово..."
            value={newKeyword.keyword}
            onChange={(e) => setNewKeyword({ keyword: e.target.value })}
            className="keyword-input"
          />
          <button type="submit" className="add-keyword-btn">
            ➕ Добавить
          </button>
        </form>

        {/* Плоский список ключевых слов (без категорий) */}
        <div className="keywords-list">
          {keywordList.length === 0 && (
            <p className="no-keywords">Нет ключевых слов</p>
          )}
          {keywordList.map((keyword, idx) => (
            <div key={keyword.id || `kw-${idx}`} className={`keyword-item ${keyword.active ? 'active' : 'inactive'}`}>
              <span className="keyword-text">{keyword.keyword}</span>
              <div className="keyword-controls">
                <button
                  className={`toggle-btn ${keyword.active ? 'active' : 'inactive'}`}
                  onClick={() => toggleKeywordStatus(keyword.id, keyword.active)}
                  title={keyword.active ? 'Отключить' : 'Включить'}
                >
                  {keyword.active ? '🟢' : '🔴'}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => deleteKeyword(keyword.id)}
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Сортировка и кнопки действий (без лишних фильтров) */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Сортировка:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="participants">👥 По участникам</option>
            <option value="name">📝 По названию</option>
          </select>
        </div>

        <div className="selection-info">
          Выбрано: {selectedChats.length} чатов
          {selectedChats.length > 0 && (
            <button
              onClick={addSelectedChatsToMonitoring}
              disabled={loading}
              className="add-selected-btn"
            >
              ➕ Добавить выбранные в мониторинг
            </button>
          )}
        </div>
      </div>

      {/* Выбранные чаты (вверху) */}
      {selectedChatsList.length > 0 && (
        <div className="selected-chats-section">
          <h3>✅ Выбранные чаты ({selectedChatsList.length})</h3>
          <div className="chats-grid">
            {selectedChatsList.map(chat => (
              <div key={chat.id} className="chat-card selected">
                <div className="chat-header">
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => toggleChatSelection(chat.id)}
                    className="chat-checkbox"
                  />
                  <h4 className="chat-title">{chat.title}</h4>
                  {chat.is_cargo_related && <span className="cargo-badge">🚛</span>}
                </div>
                <div className="chat-info">
                  <span className="participants">👥 {chat.participants_count?.toLocaleString() || 0}</span>
                  <span className="chat-type">{chat.type}</span>
                  {chat.is_verified && <span className="verified">✅</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Остальные чаты (внизу) */}
      <div className="available-chats-section">
        <h3>📋 Доступные чаты ({unselectedChatsList.length})</h3>
        <div className="chats-grid">
          {unselectedChatsList.map(chat => (
            <div key={chat.id} className="chat-card">
              <div className="chat-header">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => toggleChatSelection(chat.id)}
                  className="chat-checkbox"
                />
                <h4 className="chat-title">{chat.title}</h4>
                {chat.is_cargo_related && <span className="cargo-badge">🚛</span>}
              </div>
              <div className="chat-info">
                <span className="participants">👥 {chat.participants_count?.toLocaleString() || 0}</span>
                <span className="chat-type">{chat.type}</span>
                {chat.is_verified && <span className="verified">✅</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Чаты в мониторинге */}
      <div className="monitored-chats-section">
        <h3>👀 Чаты в мониторинге ({monitoredChats.length})</h3>
        {monitoredChats.length === 0 ? (
          <p className="no-data">Нет чатов в мониторинге</p>
        ) : (
          <div className="monitored-chats-list">
            {monitoredChats.map(chat => (
              <div key={chat.id} className={`monitored-chat-item ${chat.active ? 'active' : 'inactive'}`}>
                <div className="chat-details">
                  <h4>{chat.chat_name}</h4>
                  <span className="chat-id">ID: {chat.chat_id}</span>
                </div>
                <div className="chat-controls">
                  <button
                    className={`status-toggle ${chat.active ? 'active' : 'inactive'}`}
                    onClick={() => toggleChatStatus(chat.id, chat.active)}
                    title={chat.active ? 'Отключить мониторинг' : 'Включить мониторинг'}
                  >
                    {chat.active ? '🟢' : '🔴'}
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromMonitoring(chat.id)}
                    title="Удалить из мониторинга"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}