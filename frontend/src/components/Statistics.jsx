import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import './Statistics.css';

export default function Statistics({ stats = {}, messages = [], chats = [], onUpdate, apiBase, keywords = [] }) {
  // Отладочная информация
  console.log('Statistics component data:', {
    messagesCount: Array.isArray(messages) ? messages.length : 'not array',
    chatsCount: Array.isArray(chats) ? chats.length : 'not array',
    keywordsCount: Array.isArray(keywords) ? keywords.length : 'not array',
    apiBase
  });

  // Управление парсером
  const [parserStatus, setParserStatus] = useState({
    isRunning: false,
    lastUpdate: null,
    totalProcessed: 0,
    errors: 0
  });
  const [loadingParser, setLoadingParser] = useState(false);
  const [parserError, setParserError] = useState('');

  // Управление получателями
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    username: '',
    category: 'грузоперевозки'
  });
  const [recipientError, setRecipientError] = useState('');
  const [recipientSuccess, setRecipientSuccess] = useState('');

  useEffect(() => {
    loadRecipients();
    loadParserStatus();
    
    // Обновляем статус парсера каждые 30 секунд
    const interval = setInterval(loadParserStatus, 30000);
    return () => clearInterval(interval);
  }, [apiBase]);

  const loadParserStatus = async () => {
    try {
      setParserError('');
      const response = await axios.get(`${apiBase}/parser/status`);
      setParserStatus(response.data || {
        isRunning: false,
        lastUpdate: null,
        totalProcessed: 0,
        errors: 0
      });
    } catch (error) {
      console.error('Ошибка загрузки статуса парсера:', error);
      setParserError('Не удалось загрузить статус парсера');
      setParserStatus({
        isRunning: false,
        lastUpdate: null,
        totalProcessed: 0,
        errors: 0
      });
    }
  };

  const toggleParser = async () => {
    try {
      setLoadingParser(true);
      const action = parserStatus.isRunning ? 'stop' : 'start';
      await axios.post(`${apiBase}/parser/${action}`);
      await loadParserStatus();
      onUpdate?.(); // Обновляем данные в родительском компоненте
    } catch (error) {
      console.error('Ошибка управления парсером:', error);
      alert(`Ошибка ${parserStatus.isRunning ? 'остановки' : 'запуска'} парсера`);
    } finally {
      setLoadingParser(false);
    }
  };

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      setRecipientError('');
      const response = await axios.get(`${apiBase}/recipient-categories`);
      setRecipients(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки получателей:', error);
      setRecipientError('Сервис получателей недоступен');
      setRecipients([]); // Устанавливаем пустой массив при ошибке
    } finally {
      setLoadingRecipients(false);
    }
  };

  const addRecipient = async (e) => {
    e.preventDefault();
    if (!newRecipient.name || !newRecipient.username) {
      setRecipientError('Заполните все поля');
      return;
    }

    try {
      setLoadingRecipients(true);
      setRecipientError('');
      
      await axios.post(`${apiBase}/recipient-categories`, newRecipient);
      
      setRecipientSuccess('Получатель успешно добавлен');
      setNewRecipient({ name: '', username: '', category: 'грузоперевозки' });
      loadRecipients();
      
      setTimeout(() => setRecipientSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка добавления получателя:', error);
      setRecipientError('Ошибка добавления получателя');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const toggleRecipientActive = async (id, currentActive) => {
    try {
      await axios.patch(`${apiBase}/recipient-categories/${id}`, {
        active: !currentActive
      });
      loadRecipients();
    } catch (error) {
      console.error('Ошибка обновления получателя:', error);
      setRecipientError('Ошибка обновления получателя');
    }
  };

  const deleteRecipient = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого получателя?')) {
      return;
    }

    try {
      await axios.delete(`${apiBase}/recipient-categories/${id}`);
      loadRecipients();
      setRecipientSuccess('Получатель удален');
      setTimeout(() => setRecipientSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка удаления получателя:', error);
      setRecipientError('Ошибка удаления получателя');
    }
  };

  // Обработка ошибок загрузки - показываем только если НИЧЕГО не загрузилось
  const hasAnyData = messages.length > 0 || chats.length > 0 || recipients.length > 0;
  const hasErrors = parserError && recipientError;
  
  if (!hasAnyData && hasErrors) {
    return (
      <div className="management-container">
        <div className="error-state">
          <h2>⚠️ Проблемы с подключением</h2>
          <p>Не удалось загрузить данные с сервера</p>
          <p className="error-details">{parserError || recipientError}</p>
          <button onClick={() => { loadParserStatus(); loadRecipients(); }} className="btn-retry">
            🔄 Повторить
          </button>
        </div>
      </div>
    );
  }

  // Вычисление статистики
  const totalMessages = Array.isArray(messages) ? messages.length : 0;
  const totalDuplicates = Array.isArray(messages) ? messages.filter(msg => msg && msg.is_duplicate).length : 0;
  const totalKeywordMatches = Array.isArray(messages) ? messages.filter(msg => msg && msg.has_keywords).length : 0;
  const activeChats = Array.isArray(chats) ? chats.filter(chat => chat && chat.active).length : 0;

  // Данные для графиков
  const chartData = Array.isArray(messages) ? messages.reduce((acc, message) => {
    if (!message || !message.created_at) return acc;
    try {
      const date = new Date(message.created_at).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
    } catch (error) {
      console.warn('Ошибка обработки даты сообщения:', error);
    }
    return acc;
  }, []).slice(-7) : [];

  const duplicateData = [
    { name: 'Новые', value: totalMessages - totalDuplicates, color: '#22c55e' },
    { name: 'Дубликаты', value: totalDuplicates, color: '#ef4444' }
  ];

  const chatStats = Array.isArray(chats) ? chats.map(chat => {
    if (!chat) return { name: 'Неизвестный чат', messages: 0, duplicates: 0, active: false };
    
    const chatMessages = Array.isArray(messages) ? 
      messages.filter(msg => msg && msg.chat_id === chat.chat_id) : [];
    
    return {
      name: chat.chat_name || chat.name || `Chat ${chat.chat_id || 'Unknown'}`,
      messages: chatMessages.length,
      duplicates: chatMessages.filter(msg => msg && msg.is_duplicate).length,
      active: Boolean(chat.active)
    };
  }).sort((a, b) => b.messages - a.messages) : [];

  const topKeywords = (keywords || []).slice(0, 8).map((keyword, index) => ({
    keyword: typeof keyword === 'string' ? keyword : keyword.keyword || '',
    count: Math.floor(Math.random() * 20) + 1 // Заглушка, нужно получать реальные данные
  }));

  return (
    <div className="management-container">
      {/* УПРАВЛЕНИЕ ПАРСЕРОМ */}
      <div className="parser-control">
        <div className="control-header">
          <h2>⚙️ Управление парсером</h2>
          <div className="parser-status">
            <span className={`status-indicator ${parserStatus.isRunning ? 'running' : 'stopped'}`}>
              {parserStatus.isRunning ? '🟢 Запущен' : '🔴 Остановлен'}
            </span>
          </div>
        </div>
        
        <div className="control-content">
          <div className="parser-stats">
            <div className="parser-stat">
              <span className="stat-label">Статус:</span>
              <span className={`stat-value ${parserStatus.isRunning ? 'active' : 'inactive'}`}>
                {parserStatus.isRunning ? '▶️ Активен' : '⏸️ Неактивен'}
              </span>
            </div>
            <div className="parser-stat">
              <span className="stat-label">Последнее обновление:</span>
              <span className="stat-value">
                {parserStatus.lastUpdate 
                  ? new Date(parserStatus.lastUpdate).toLocaleString('ru-RU')
                  : 'Нет данных'
                }
              </span>
            </div>
            <div className="parser-stat">
              <span className="stat-label">Обработано сообщений:</span>
              <span className="stat-value">{parserStatus.totalProcessed || 0}</span>
            </div>
            <div className="parser-stat">
              <span className="stat-label">Ошибок:</span>
              <span className="stat-value error">{parserStatus.errors || 0}</span>
            </div>
          </div>
          
          <div className="parser-actions">
            <button
              onClick={toggleParser}
              disabled={loadingParser}
              className={`btn-parser ${parserStatus.isRunning ? 'stop' : 'start'}`}
            >
              {loadingParser ? '⏳' : (parserStatus.isRunning ? '⏹️ Остановить' : '▶️ Запустить')}
            </button>
            <button
              onClick={loadParserStatus}
              className="btn-refresh"
              title="Обновить статус"
            >
              🔄 Обновить
            </button>
          </div>
        </div>
      </div>

      {/* КОМПАКТНАЯ СТАТИСТИКА - ВСЁ В ОДНОЙ СТРОКЕ */}
      <div className="compact-stats">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon">📨</div>
            <div className="stat-content">
              <h3>{totalMessages}</h3>
              <p>Сообщений</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{totalMessages - totalDuplicates}</h3>
              <p>Новых</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h3>{totalDuplicates}</h3>
              <p>Дубликатов</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔍</div>
            <div className="stat-content">
              <h3>{totalKeywordMatches}</h3>
              <p>С ключ.словами</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>{activeChats}</h3>
              <p>Чатов</p>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🏃</div>
            <div className="stat-content">
              <h3>{parserStatus.totalProcessed || 0}</h3>
              <p>Обработано</p>
            </div>
          </div>
        </div>
      </div>

      {/* КОМПАКТНАЯ ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ */}
      <div className="info-compact">
        <div className="info-row">
          <div className="info-section">
            <h4>� Топ-3 чата</h4>
            <div className="compact-list">
              {chatStats.length > 0 ? chatStats.slice(0, 3).map((chat, index) => (
                <span key={index} className="compact-item">
                  {chat.active ? '🟢' : '🔴'} {(chat.name || 'Неизвестный').substring(0, 10)}... ({chat.messages})
                </span>
              )) : (
                <span className="compact-empty">Нет данных</span>
              )}
            </div>
          </div>
          
          <div className="info-section">
            <h4>🔍 Ключевые слова</h4>
            <div className="compact-keywords">
              {Array.isArray(keywords) && keywords.length > 0 ? (
                keywords.slice(0, 3).map((keyword, index) => (
                  <span key={index} className="keyword-tag">
                    {typeof keyword === 'string' ? keyword : keyword.keyword || ''}
                  </span>
                ))
              ) : (
                <span className="compact-empty">Не настроены</span>
              )}
            </div>
          </div>

          <div className="info-section">
            <h4>� Получатели</h4>
            <div className="compact-recipients">
              <span className="recipient-count">Всего: {recipients.length}</span>
              {recipients.length > 0 && (
                <span className="recipient-preview">
                  ({recipients.slice(0, 2).map(r => r.name).join(', ')}{recipients.length > 2 ? '...' : ''})
                </span>
              )}
            </div>
          </div>

          <div className="info-section">
            <h4>⏱️ Последнее обновление</h4>
            <div className="compact-time">
              {parserStatus.lastUpdate 
                ? new Date(parserStatus.lastUpdate).toLocaleString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                  })
                : 'Нет данных'
              }
            </div>
          </div>
        </div>
      </div>

      {/* КОМПАКТНОЕ УПРАВЛЕНИЕ ПОЛУЧАТЕЛЯМИ */}
      <div className="recipients-compact">
        <div className="recipients-header">
          <h4>👥 Быстрое добавление получателя</h4>
        </div>
        
        <form onSubmit={addRecipient} className="recipients-form-compact">
          <input
            type="text"
            placeholder="Имя"
            value={newRecipient.name}
            onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
            className="input-compact"
          />
          <input
            type="text"
            placeholder="@username"
            value={newRecipient.username}
            onChange={(e) => setNewRecipient({...newRecipient, username: e.target.value})}
            className="input-compact"
          />
          <select
            value={newRecipient.category}
            onChange={(e) => setNewRecipient({...newRecipient, category: e.target.value})}
            className="select-compact"
          >
            <option value="грузоперевозки">Грузоперевозки</option>
            <option value="авто">Авто</option>
            <option value="логистика">Логистика</option>
          </select>
          <button type="submit" className="btn-compact" disabled={loadingRecipients}>
            {loadingRecipients ? '⏳' : '➕'}
          </button>
        </form>

        {recipientError && <div className="error-compact">{recipientError}</div>}
        {recipientSuccess && <div className="success-compact">{recipientSuccess}</div>}
        
        {/* КОМПАКТНЫЙ СПИСОК ПОЛУЧАТЕЛЕЙ */}
        {recipients.length > 0 && (
          <div className="recipients-list-compact">
            <h4>📋 Получатели ({recipients.length})</h4>
            <div className="recipients-grid-compact">
              {recipients.map((recipient) => (
                <div key={recipient.id} className="recipient-item-compact">
                  <span className={`status-compact ${recipient.active ? 'active' : 'inactive'}`}>
                    {recipient.active ? '🟢' : '🔴'}
                  </span>
                  <span className="recipient-name-compact">
                    {recipient.name}
                  </span>
                  <span className="recipient-username-compact">
                    @{recipient.username}
                  </span>
                  <span className="recipient-category-compact">
                    {recipient.category}
                  </span>
                  <div className="recipient-actions-compact">
                    <button
                      onClick={() => toggleRecipientActive(recipient.id, recipient.active)}
                      className={`btn-toggle-compact ${recipient.active ? 'active' : 'inactive'}`}
                      title={recipient.active ? 'Отключить' : 'Включить'}
                    >
                      {recipient.active ? '⏸️' : '▶️'}
                    </button>
                    <button
                      onClick={() => deleteRecipient(recipient.id)}
                      className="btn-delete-compact"
                      title="Удалить получателя"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}