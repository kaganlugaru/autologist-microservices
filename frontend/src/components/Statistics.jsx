import React, { useState, useEffect } from 'react';
import axios from 'axios';
import KeywordsManagerCompact from './KeywordsManagerCompact';
import './Statistics.css';

export default function Statistics({ stats = {}, messages = [], chats = [], onUpdate, apiBase, keywords = [] }) {
  // Управление получателями (упрощенно)
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    phone: ''
  });
  const [recipientError, setRecipientError] = useState('');
  const [recipientSuccess, setRecipientSuccess] = useState('');

  useEffect(() => {
    loadRecipients();
  }, [apiBase]);

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      setRecipientError('');
      const response = await axios.get(`${apiBase}/recipient-categories`);
      setRecipients(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки получателей:', error);
      setRecipientError('Сервис получателей недоступен');
      setRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const addRecipient = async () => {
    if (!newRecipient.name.trim() || !newRecipient.phone.trim()) {
      setRecipientError('Заполните имя и телефон');
      return;
    }

    try {
      setLoadingRecipients(true);
      setRecipientError('');
      setRecipientSuccess('');

      const recipientData = {
        name: newRecipient.name.trim(),
        phone: newRecipient.phone.trim(),
        category: 'грузоперевозки' // Автоматически устанавливаем категорию
      };

      await axios.post(`${apiBase}/recipients`, recipientData);
      
      setNewRecipient({ name: '', phone: '' });
      setRecipientSuccess('Получатель добавлен успешно');
      await loadRecipients();
      
      setTimeout(() => setRecipientSuccess(''), 3000);
    } catch (error) {
      console.error('Ошибка добавления получателя:', error);
      setRecipientError(error.response?.data?.error || 'Ошибка добавления получателя');
    } finally {
      setLoadingRecipients(false);
    }
  };

  const deleteRecipient = async (id) => {
    try {
      await axios.delete(`${apiBase}/recipients/${id}`);
      await loadRecipients();
    } catch (error) {
      console.error('Ошибка удаления получателя:', error);
      setRecipientError('Ошибка удаления получателя');
    }
  };

  // Упрощенные вычисления статистики (только 4 показателя)
  const totalMessages = Array.isArray(messages) ? messages.length : 0;
  const totalDuplicates = Array.isArray(messages) ? messages.filter(msg => msg && msg.is_duplicate).length : 0;
  const newMessages = totalMessages - totalDuplicates;
  const activeChats = Array.isArray(chats) ? chats.filter(chat => chat && chat.active).length : 0;

  return (
    <div className="statistics-container">
      {/* Основная статистика - 4 карточки */}
      <div className="stats-grid">
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
            <h3>{newMessages}</h3>
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
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{activeChats}</h3>
            <p>Чатов</p>
          </div>
        </div>
      </div>

      {/* ПРИНЦИП РАБОТЫ - НА УРОВНЕ СТАТИСТИКИ */}
      <div className="principle-section">
        <h2>💡 Принцип работы</h2>
        <div className="principle-grid">
          <div className="principle-item">🎯 Мониторинг чатов в реальном времени</div>
          <div className="principle-item">🔍 Поиск по ключевым словам</div>
          <div className="principle-item">🚫 Автофильтрация дубликатов</div>
          <div className="principle-item">📨 Уведомления получателям</div>
        </div>
      </div>

      {/* Две панели рядом */}
      <div className="management-panels">
        {/* Левая панель - Ключевые слова */}
        <div className="panel keywords-panel">
          <h3>🔑 Ключевые слова ({keywords.length})</h3>
          <KeywordsManagerCompact 
            keywords={keywords}
            apiBase={apiBase}
            onUpdate={onUpdate}
          />
        </div>

        {/* Правая панель - Получатели */}
        <div className="panel recipients-panel">
          <h3>👥 Получатели</h3>
          
          {/* Форма быстрого добавления */}
          <div className="quick-add-form">
            <div className="form-title">📱 Быстрое добавление</div>
            
            {recipientError && (
              <div className="error-message">{recipientError}</div>
            )}
            {recipientSuccess && (
              <div className="success-message">{recipientSuccess}</div>
            )}

            <div className="form-row">
              <input
                type="text"
                placeholder="Имя"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                disabled={loadingRecipients}
              />
            </div>
            
            <div className="form-row">
              <input
                type="text"
                placeholder="Телефон"
                value={newRecipient.phone}
                onChange={(e) => setNewRecipient({...newRecipient, phone: e.target.value})}
                disabled={loadingRecipients}
              />
            </div>
            
            <button 
              onClick={addRecipient}
              disabled={loadingRecipients}
              className="add-recipient-btn"
            >
              {loadingRecipients ? 'Добавление...' : 'Добавить'}
            </button>
          </div>

          {/* Список получателей */}
          <div className="recipients-list">
            <div className="list-title">📋 Список получателей:</div>
            {loadingRecipients && recipients.length === 0 ? (
              <div className="loading">Загрузка...</div>
            ) : recipients.length > 0 ? (
              <div className="recipients-items">
                {recipients.slice(0, 10).map((recipient, index) => (
                  <div key={recipient.id || index} className="recipient-item">
                    <span className="recipient-info">
                      • {recipient.name} {recipient.phone}
                    </span>
                    <button 
                      onClick={() => deleteRecipient(recipient.id)}
                      className="delete-btn"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {recipients.length > 10 && (
                  <div className="more-recipients">
                    ... и ещё {recipients.length - 10} получателей
                  </div>
                )}
              </div>
            ) : (
              <div className="no-recipients">Получатели не добавлены</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}