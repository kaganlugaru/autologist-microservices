import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function KeywordsManager({ apiBase, onUpdate, keywords: initialKeywords = [] }) {
  const [keywords, setKeywords] = useState(initialKeywords);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Загрузка ключевых слов
  const loadKeywords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiBase}/keywords`);
      const keywordData = response.data.data || [];
      
      // Преобразуем в массив строк
      const keywordStrings = keywordData.map(kw => 
        typeof kw === 'string' ? kw : kw.keyword || ''
      ).filter(kw => kw.length > 0);
      
      setKeywords(keywordStrings);
    } catch (error) {
      console.error('Ошибка загрузки ключевых слов:', error);
      setError('Не удалось загрузить ключевые слова');
    } finally {
      setLoading(false);
    }
  };

  // Добавление нового ключевого слова
  const addKeyword = async () => {
    if (!newKeyword.trim()) {
      setError('Введите ключевое слово');
      return;
    }

    if (keywords.includes(newKeyword.trim().toLowerCase())) {
      setError('Такое ключевое слово уже существует');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(`${apiBase}/keywords`, {
        keyword: newKeyword.trim().toLowerCase(),
        active: true
      });

      if (response.data.success) {
        await loadKeywords(); // Перезагружаем список
        setNewKeyword('');
        setSuccess('Ключевое слово добавлено');
        if (onUpdate) onUpdate();
        
        // Убираем сообщение об успехе через 3 секунды
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Ошибка добавления:', error);
      setError('Не удалось добавить ключевое слово');
    } finally {
      setLoading(false);
    }
  };

  // Удаление ключевого слова
  const removeKeyword = async (keywordToRemove) => {
    if (!confirm(`Удалить ключевое слово "${keywordToRemove}"?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Поскольку в API используется ID, нужно найти ID по keyword
      // Для простоты будем использовать keyword как параметр
      const response = await axios.delete(`${apiBase}/keywords/${encodeURIComponent(keywordToRemove)}`);

      if (response.data.success) {
        await loadKeywords(); // Перезагружаем список
        setSuccess('Ключевое слово удалено');
        if (onUpdate) onUpdate();
        
        // Убираем сообщение об успехе через 3 секунды
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
      setError('Не удалось удалить ключевое слово');
    } finally {
      setLoading(false);
    }
  };

  // Загружаем при первом рендере
  useEffect(() => {
    loadKeywords();
  }, []);

  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    if (initialKeywords && initialKeywords.length > 0) {
      setKeywords(initialKeywords);
    }
  }, [initialKeywords]);

  return (
    <div className="keywords-manager">
      <div className="keywords-header">
        <h2>🔍 Управление ключевыми словами</h2>
        <p className="keywords-description">
          Добавляйте ключевые слова для автоматического поиска в чатах
        </p>
      </div>

      {/* Форма добавления */}
      <div className="keywords-add-form">
        <div className="form-group">
          <div className="input-group">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Введите ключевое слово..."
              className="keyword-input"
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              disabled={loading}
            />
            <button 
              onClick={addKeyword} 
              disabled={loading || !newKeyword.trim()}
              className="btn btn-primary"
            >
              {loading ? '...' : '➕ Добавить'}
            </button>
          </div>
        </div>
      </div>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <div className="alert alert-error">
          ❌ {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          ✅ {success}
          <button onClick={() => setSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      {/* Список ключевых слов */}
      <div className="keywords-list">
        <h3>Активные ключевые слова ({keywords.length})</h3>
        
        {loading && keywords.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            Загрузка ключевых слов...
          </div>
        )}

        {!loading && keywords.length === 0 && (
          <div className="empty-state">
            <p>Ключевые слова не настроены</p>
            <p className="muted">Добавьте первое ключевое слово для начала мониторинга</p>
          </div>
        )}

        {keywords.length > 0 && (
          <div className="keywords-grid">
            {keywords.map((keyword, index) => (
              <div key={index} className="keyword-item">
                <span className="keyword-text">{keyword}</span>
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="keyword-remove"
                  title="Удалить ключевое слово"
                  disabled={loading}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Статистика */}
      {keywords.length > 0 && (
        <div className="keywords-stats">
          <div className="stat-item">
            <span className="stat-label">Всего ключевых слов:</span>
            <span className="stat-value">{keywords.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Статус:</span>
            <span className="stat-value">✅ Активный мониторинг</span>
          </div>
        </div>
      )}
    </div>
  );
}