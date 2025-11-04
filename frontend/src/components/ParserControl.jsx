import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ParserControl({ onUpdate, apiBase, keywords }) {
  const [parserStatus, setParserStatus] = useState('unknown');
  const [loading, setLoading] = useState(false);
  
  // Состояние для управления получателями
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [newRecipient, setNewRecipient] = useState({
    name: '',
    username: '',
    keyword: ''
  });
  const [recipientError, setRecipientError] = useState('');
  const [recipientSuccess, setRecipientSuccess] = useState('');

  useEffect(() => {
    checkParserStatus();
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const response = await axios.get(`${apiBase}/recipients`);
      if (response.data.success) {
        setRecipients(response.data.data || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки получателей:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const addRecipient = async (e) => {
    e.preventDefault();
    setRecipientError('');
    setRecipientSuccess('');

    if (!newRecipient.name || !newRecipient.username) {
      setRecipientError('Заполните имя и username');
      return;
    }

    try {
      setLoadingRecipients(true);
      
      // Добавляем получателя для всех активных ключевых слов
      const addPromises = keywords.map(async (keyword) => {
        const recipientData = {
          name: newRecipient.name,
          username: newRecipient.username,
          keyword: keyword.keyword
        };
        
        try {
          await axios.post(`${apiBase}/recipients`, recipientData);
        } catch (error) {
          // Игнорируем ошибки дубликатов
          if (error.response?.status !== 409) {
            throw error;
          }
        }
      });

      await Promise.all(addPromises);
      
      setRecipientSuccess(`Получатель ${newRecipient.name} добавлен для всех ключевых слов`);
      setNewRecipient({ name: '', username: '', keyword: '' });
      loadRecipients();
      setTimeout(() => setRecipientSuccess(''), 3000);
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Ошибка добавления получателя';
      setRecipientError(errorMsg);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const deleteRecipient = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этого получателя?')) {
      return;
    }

    try {
      await axios.delete(`${apiBase}/recipients/${id}`);
      setRecipientSuccess('Получатель удален');
      loadRecipients();
      setTimeout(() => setRecipientSuccess(''), 2000);
    } catch (error) {
      setRecipientError('Ошибка удаления получателя');
    }
  };

  const toggleRecipientActive = async (id, currentStatus) => {
    try {
      await axios.patch(`${apiBase}/recipients/${id}`, { active: !currentStatus });
      setRecipientSuccess('Статус обновлен');
      loadRecipients();
      setTimeout(() => setRecipientSuccess(''), 2000);
    } catch (error) {
      setRecipientError('Ошибка обновления статуса');
    }
  };

  // Группируем получателей по пользователям
  const groupedRecipients = recipients.reduce((acc, recipient) => {
    const key = `${recipient.name}_${recipient.username}`;
    if (!acc[key]) {
      acc[key] = {
        name: recipient.name,
        username: recipient.username,
        keywords: []
      };
    }
    acc[key].keywords.push({
      id: recipient.id,
      keyword: recipient.keyword,
      active: recipient.active
    });
    return acc;
  }, {});

  const checkParserStatus = async () => {
    try {
      const response = await axios.get(`${apiBase}/parser/status`);
      // API возвращает { success: true, status: { running: true/false, ... } }
      const isRunning = response.data.status?.running === true;
      setParserStatus(isRunning ? 'running' : 'stopped');
    } catch (error) {
      setParserStatus('offline');
    }
  };

  const startParser = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiBase}/parser/start`);
      setParserStatus('running');
      onUpdate();
      alert('Парсер успешно запущен!');
    } catch (error) {
      console.error('Ошибка запуска парсера:', error);
      if (error.response?.status === 400) {
        // Парсер уже запущен - проверим статус
        await checkParserStatus();
        alert('Парсер уже запущен');
      } else {
        alert('Ошибка запуска парсера: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const stopParser = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${apiBase}/parser/stop`);
      setParserStatus('stopped');
      onUpdate();
      alert('Парсер остановлен!');
    } catch (error) {
      console.error('Ошибка остановки парсера:', error);
      if (error.response?.status === 400) {
        // Парсер уже остановлен - проверим статус
        await checkParserStatus();
        alert('Парсер уже остановлен');
      } else {
        alert('Ошибка остановки парсера: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const runOnceParser = async () => {
    setLoading(true);
    try {
      await axios.post(`${apiBase}/parser/run-once`);
      onUpdate();
      alert('Однократный парсинг запущен');
    } catch (error) {
      console.error('Ошибка запуска однократного парсинга:', error);
      alert('Ошибка запуска парсинга');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkParserStatus();
    const interval = setInterval(checkParserStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (parserStatus) {
      case 'running': return '🟢';
      case 'stopped': return '🔴';
      case 'offline': return '⚫';
      default: return '🟡';
    }
  };

  const getStatusText = () => {
    switch (parserStatus) {
      case 'running': return 'Работает';
      case 'stopped': return 'Остановлен';
      case 'offline': return 'Не доступен';
      default: return 'Неизвестно';
    }
  };

  return (
    <div className="parser-control">
      <div className="status-section">
        <h3>⚙️ Управление парсером</h3>
        <div className="parser-status">
          <div className="status-indicator">
            <span className="status-icon">{getStatusIcon()}</span>
            <span className="status-text">Статус: {getStatusText()}</span>
          </div>
          <button onClick={checkParserStatus} className="refresh-status">
            🔄 Обновить статус
          </button>
        </div>
      </div>

      <div className="control-buttons">
        <button
          onClick={startParser}
          disabled={loading || parserStatus === 'running'}
          className="start-btn"
        >
          {loading ? '⏳ Запуск...' : '▶️ Запустить мониторинг'}
        </button>

        <button
          onClick={stopParser}
          disabled={loading || parserStatus !== 'running'}
          className="stop-btn"
        >
          {loading ? '⏳ Остановка...' : '⏹️ Остановить мониторинг'}
        </button>

        <button
          onClick={runOnceParser}
          disabled={loading}
          className="run-once-btn"
        >
          {loading ? '⏳ Парсинг...' : '🔄 Разовый парсинг'}
        </button>
      </div>

      <div className="parser-info">
        <h4>ℹ️ Информация</h4>
        <div className="info-grid">
          <div className="info-item">
            <strong>Режимы работы:</strong>
            <ul>
              <li><strong>Мониторинг:</strong> Постоянное отслеживание новых сообщений</li>
              <li><strong>Разовый парсинг:</strong> Однократная обработка истории чатов</li>
            </ul>
          </div>
          
          <div className="info-item">
            <strong>Правила дедупликации:</strong>
            <ul>
              <li>Дубликаты считаются только за последние 24 часа</li>
              <li>Если сообщение старше 24 часов - это актуализация</li>
              <li>Изменение цены делает сообщение новым</li>
              <li>Совпадение текста ≥95% считается дубликатом</li>
            </ul>
          </div>

          <div className="info-item">
            <strong>Фильтрация:</strong>
            <ul>
              <li>Все сообщения анализируются на ключевые слова</li>
              <li>При совпадении отправляется уведомление</li>
              <li>Автоматическое извлечение цен из текста</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="parser-logs">
        <h4>📋 Логи парсера</h4>
        <div className="logs-info">
          <p>Подробные логи доступны в файле:</p>
          <code>telegram-parser/logs/telegram_parser.log</code>
          <p>Для просмотра логов в реальном времени используйте:</p>
          <code>tail -f telegram-parser/logs/telegram_parser.log</code>
        </div>
      </div>

      {/* Секция управления получателями */}
      <div className="recipients-management">
        <h4>📤 Управление получателями уведомлений</h4>
        
        {recipientError && <div className="error-message">{recipientError}</div>}
        {recipientSuccess && <div className="success-message">{recipientSuccess}</div>}

        {/* Форма добавления получателя */}
        <div className="add-recipient-section">
          <h5>Добавить получателя для всех ключевых слов</h5>
          <form onSubmit={addRecipient} className="recipient-form">
            <div className="form-row">
              <input
                type="text"
                placeholder="Имя (например: KGN)"
                value={newRecipient.name}
                onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Username (например: Rinat575kz)"
                value={newRecipient.username}
                onChange={(e) => setNewRecipient({...newRecipient, username: e.target.value})}
                required
              />
              <button type="submit" disabled={loadingRecipients}>
                {loadingRecipients ? 'Добавление...' : 'Добавить для всех ключевых слов'}
              </button>
            </div>
            <small style={{color: '#666', marginTop: '5px', display: 'block'}}>
              Получатель будет добавлен для всех активных ключевых слов: {keywords?.map(k => k.keyword).join(', ')}
            </small>
          </form>
        </div>

        {/* Список получателей */}
        <div className="recipients-list">
          <h5>Текущие получатели ({Object.keys(groupedRecipients).length})</h5>
          
          {loadingRecipients && <div className="loading">Загрузка...</div>}
          
          {Object.values(groupedRecipients).map((user, index) => (
            <div key={index} className="recipient-card">
              <div className="recipient-header">
                <strong>{user.name}</strong>
                <span>@{user.username}</span>
              </div>
              <div className="recipient-keywords">
                {user.keywords.map((kw) => (
                  <div key={kw.id} className="keyword-tag">
                    <span className={`keyword ${kw.active ? 'active' : 'inactive'}`}>
                      {kw.keyword}
                    </span>
                    <button
                      onClick={() => toggleRecipientActive(kw.id, kw.active)}
                      className={kw.active ? 'deactivate-btn' : 'activate-btn'}
                      title={kw.active ? 'Отключить' : 'Включить'}
                    >
                      {kw.active ? '🔴' : '🟢'}
                    </button>
                    <button
                      onClick={() => deleteRecipient(kw.id)}
                      className="delete-btn"
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {!loadingRecipients && Object.keys(groupedRecipients).length === 0 && (
            <div className="no-recipients">
              Получатели не настроены. Добавьте первого получателя выше.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}