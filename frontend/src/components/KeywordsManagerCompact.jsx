import React, { useState } from 'react';
import axios from 'axios';
import './KeywordsManagerCompact.css';

export default function KeywordsManagerCompact({ apiBase, onUpdate, keywords = [] }) {
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Добавление нового ключевого слова
  const addKeyword = async () => {
    if (!newKeyword.trim()) return;

    if (keywords.includes(newKeyword.trim().toLowerCase())) {
      setMessage({ type: 'error', text: 'Ключевое слово уже существует' });
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${apiBase}/keywords`, {
        keyword: newKeyword.trim().toLowerCase(),
        active: true
      });

      if (response.data.success) {
        setNewKeyword('');
        setMessage({ type: 'success', text: 'Добавлено' });
        if (onUpdate) onUpdate();
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ошибка добавления' });
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  // Удаление ключевого слова
  const removeKeyword = async (keywordObj) => {
    const keywordText = keywordObj.keyword || keywordObj;
    const keywordId = keywordObj.id;
    
    console.log('🗑️ [Keywords] Удаляем ключевое слово:', keywordText);
    console.log('🗑️ [Keywords] ID ключевого слова:', keywordId);
    
    try {
      setLoading(true);
      // Используем ID если есть, иначе текст ключевого слова
      const identifier = keywordId ? keywordId : encodeURIComponent(keywordText);
      const url = `${apiBase}/keywords/${identifier}`;
      console.log('🌐 [Keywords] DELETE URL:', url);
      
      const response = await axios.delete(url);
      console.log('📋 [Keywords] Ответ сервера:', response.data);

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Удалено' });
        console.log('✅ [Keywords] Вызываем onUpdate');
        if (onUpdate) onUpdate();
        setTimeout(() => setMessage(null), 2000);
      } else {
        console.log('❌ [Keywords] Сервер вернул ошибку:', response.data);
        setMessage({ type: 'error', text: 'Ошибка удаления' });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      console.error('❌ [Keywords] Ошибка при удалении:', error);
      setMessage({ type: 'error', text: 'Ошибка удаления' });
      setTimeout(() => setMessage(null), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="keywords-manager-compact">
      {message && (
        <div className={`message ${message.type}`} style={{
          padding: '10px',
          marginBottom: '15px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Пояснение по использованию сложных ключевых слов */}
      <div className="keywords-help">
        <div className="help-title">💡 Как использовать:</div>
        <div className="help-content">
          <div className="help-example">
            <strong>Простые:</strong> <code>тандем</code> - найдет слово "тандем"
          </div>
          <div className="help-example">
            <strong>Сложные:</strong> <code>тандем;140</code> - найдет сообщения содержащие И "тандем" И "140"
          </div>
          <div className="help-example">
            <strong>Комбинированные:</strong> <code>груз;дальнобой;срочно</code> - все три слова должны быть в тексте
          </div>
        </div>
      </div>

      {/* Список ключевых слов */}
      <div className="keywords-list-compact">
        {!keywords || !Array.isArray(keywords) || keywords.length === 0 ? (
          <span className="no-keywords-compact">Не настроены</span>
        ) : (
          keywords.map((keywordObj, index) => {
            const keywordText = keywordObj.keyword || keywordObj;
            return (
              <div key={keywordObj.id || index} className={`keyword-tag ${keywordText.includes(';') ? 'complex-keyword' : 'simple-keyword'}`}>
                <span className="keyword-text">
                  {keywordText.includes(';') && <span className="complex-icon">🔗</span>}
                  {keywordText}
                </span>
                <button
                  onClick={() => removeKeyword(keywordObj)}
                  className="keyword-remove"
                disabled={loading}
                title="Удалить"
              >
                ×
              </button>
              </div>
            );
          })
        )}
      </div>

      {/* Форма добавления */}
      <div className="keywords-add-compact">
        <div className="add-form">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Ключевое слово (используйте ; для И-условий)..."
            className="keyword-input-compact"
            onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            disabled={loading}
          />
          <button 
            onClick={addKeyword} 
            disabled={loading || !newKeyword.trim()}
            className="add-btn-compact"
            title="Добавить ключевое слово"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}