import React, { useState } from 'react';
import axios from 'axios';

export default function ChatManager({ chats = [], onUpdate, apiBase }) {
  const [newChat, setNewChat] = useState({
    chat_id: '',
    chat_name: '',
    keywords: ''
  });
  const [loading, setLoading] = useState(false);

  const handleAddChat = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${apiBase}/chats`, {
        chat_id: newChat.chat_id,
        chat_name: newChat.chat_name,
        platform: 'telegram',
        keywords: newChat.keywords.split(',').map(k => k.trim()).filter(k => k)
      });
      
      setNewChat({ chat_id: '', chat_name: '', keywords: '' });
      onUpdate();
    } catch (error) {
      console.error('Ошибка добавления чата:', error);
      alert('Ошибка добавления чата');
    } finally {
      setLoading(false);
    }
  };

  const toggleChatStatus = async (chatId, currentStatus) => {
    try {
      await axios.put(`${apiBase}/chats/${chatId}`, {
        active: !currentStatus
      });
      onUpdate();
    } catch (error) {
      console.error('Ошибка изменения статуса чата:', error);
    }
  };

  const deleteChat = async (chatId) => {
    if (!confirm('Удалить чат из мониторинга?')) return;
    
    try {
      await axios.delete(`${apiBase}/chats/${chatId}`);
      onUpdate();
    } catch (error) {
      console.error('Ошибка удаления чата:', error);
    }
  };

  return (
    <div className="chat-manager">
      <div className="add-chat-form">
        <h3>➕ Добавить чат для мониторинга</h3>
        <form onSubmit={handleAddChat}>
          <div className="form-row">
            <input
              type="text"
              placeholder="ID чата (например: -1001234567890)"
              value={newChat.chat_id}
              onChange={(e) => setNewChat({...newChat, chat_id: e.target.value})}
              required
            />
            <input
              type="text"
              placeholder="Название чата"
              value={newChat.chat_name}
              onChange={(e) => setNewChat({...newChat, chat_name: e.target.value})}
              required
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              placeholder="Ключевые слова через запятую"
              value={newChat.keywords}
              onChange={(e) => setNewChat({...newChat, keywords: e.target.value})}
            />
            <button type="submit" disabled={loading}>
              {loading ? '⏳ Добавляем...' : '➕ Добавить'}
            </button>
          </div>
        </form>
      </div>

      <div className="chat-list">
        <h3>💬 Отслеживаемые чаты ({chats.length})</h3>
        
        <div className="chat-stats">
          <span className="stat">
            🟢 Активных: {chats.filter(c => c.active).length}
          </span>
          <span className="stat">
            🔴 Неактивных: {chats.filter(c => !c.active).length}
          </span>
        </div>

        <div className="chat-cards">
          {chats.map(chat => (
            <div key={chat.id} className={`chat-card ${chat.active ? 'active' : 'inactive'}`}>
              <div className="chat-header">
                <div className="chat-info">
                  <h4>{chat.chat_name}</h4>
                  <span className="chat-id">ID: {chat.chat_id}</span>
                </div>
                <div className="chat-controls">
                  <button
                    className={`toggle-btn ${chat.active ? 'active' : 'inactive'}`}
                    onClick={() => toggleChatStatus(chat.id, chat.active)}
                  >
                    {chat.active ? '🟢 Вкл' : '🔴 Выкл'}
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => deleteChat(chat.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {chat.keywords && chat.keywords.length > 0 && (
                <div className="chat-keywords">
                  🔍 Ключевые слова: {chat.keywords.join(', ')}
                </div>
              )}
              
              <div className="chat-meta">
                <span>📅 Добавлен: {new Date(chat.created_at).toLocaleDateString('ru-RU')}</span>
                <span className={`platform ${chat.platform}`}>
                  📱 {chat.platform}
                </span>
              </div>
            </div>
          ))}
        </div>

        {chats.length === 0 && (
          <div className="empty-state">
            <p>📭 Нет отслеживаемых чатов</p>
            <p>Добавьте чат с помощью формы выше</p>
          </div>
        )}
      </div>
    </div>
  );
}