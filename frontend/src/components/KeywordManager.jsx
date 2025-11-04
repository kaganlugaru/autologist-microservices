import React, { useState } from 'react';
import axios from 'axios';

export default function KeywordManager({ keywords = [], onUpdate, apiBase }) {
  const [newKeyword, setNewKeyword] = useState({ keyword: '' });
  const [loading, setLoading] = useState(false);

  // Упрощённый менеджер ключевых слов: без категорий

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${apiBase}/keywords`, { keyword: newKeyword.keyword });
      setNewKeyword({ keyword: '' });
      onUpdate();
    } catch (error) {
      console.error('Ошибка добавления ключевого слова:', error);
      alert('Ошибка добавления ключевого слова');
    } finally {
      setLoading(false);
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
      onUpdate();
    } catch (error) {
      console.error('Ошибка изменения статуса ключевого слова:', error);
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
      onUpdate();
    } catch (error) {
      console.error('Ошибка удаления ключевого слова:', error);
    }
  };

  const keywordList = Array.isArray(keywords) ? keywords : [];

  return (
    <div className="keyword-manager">
      <div className="add-keyword-form">
        <h3>➕ Добавить ключевое слово</h3>
        <form onSubmit={handleAddKeyword}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Ключевое слово"
              value={newKeyword.keyword}
              onChange={(e) => setNewKeyword({ keyword: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? '⏳ Добавляем...' : '➕ Добавить'}
            </button>
          </div>
        </form>
      </div>

      <div className="keyword-stats">
        <div className="stats-row">
          <span className="stat">
            📊 Всего: {keywords.length}
          </span>
          <span className="stat">
            🟢 Активных: {keywords.filter(k => k.active).length}
          </span>
          <span className="stat">
            🔴 Неактивных: {keywords.filter(k => !k.active).length}
          </span>
        </div>
      </div>

      <div className="keyword-list">
        {keywordList.length === 0 && (
          <div className="empty-state">
            <p>📭 Нет ключевых слов</p>
            <p>Добавьте ключевые слова для пересылки</p>
          </div>
        )}
        {keywordList.map((keyword, index) => (
          <div key={keyword.id || `keyword-${index}`} className={`keyword-item ${keyword.active ? 'active' : 'inactive'}`}>
            <span className="keyword-text">{keyword.keyword}</span>
            <div className="keyword-controls">
              <button
                className={`toggle-btn ${keyword.active ? 'active' : 'inactive'}`}
                onClick={() => toggleKeywordStatus(keyword.id, keyword.active)}
              >
                {keyword.active ? '🟢' : '🔴'}
              </button>
              <button
                className="delete-btn"
                onClick={() => deleteKeyword(keyword.id)}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {keywords.length === 0 && (
        <div className="empty-state">
          <p>📭 Нет ключевых слов</p>
          <p>Добавьте ключевые слова для фильтрации сообщений</p>
        </div>
      )}
    </div>
  );
}