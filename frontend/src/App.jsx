import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './components/MessageList';
import Statistics from './components/Statistics';
import TelegramChatManager from './components/TelegramChatManager';
import './App.css';
import './components/KeywordsManagerCompact.css';

// Получаем URL бэкенда из переменных окружения или используем локальный для разработки
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

function App() {
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Загрузка данных
  const loadData = async () => {
    setLoading(true);
    try {
      const [messagesRes, chatsRes, keywordsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/messages?limit=1000`),
        axios.get(`${API_BASE}/chats`),
        axios.get(`${API_BASE}/keywords`),
        axios.get(`${API_BASE}/stats`)
      ]);

      setMessages(messagesRes.data.data || []);
      setChats(chatsRes.data.data || []);
      // Если keywords это массив объектов, извлекаем только строки keyword
      const keywordData = keywordsRes.data.data || [];
      const keywordStrings = keywordData.map(kw => 
        typeof kw === 'string' ? kw : kw.keyword || ''
      ).filter(kw => kw.length > 0);
      setKeywords(keywordStrings);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Автообновление каждые 30 секунд
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'messages', name: 'Сообщения', icon: '💬' },
    { id: 'chats', name: 'Telegram Чаты', icon: '📱' },
    { id: 'statistics', name: 'Управление', icon: '⚙️' }
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="emoji">🚛</span>
          Autologist Parser Dashboard
        </div>
        <div className="app-actions">
          <div className="status-indicator">
            <span className="status-dot"></span>
            {loading ? 'Загрузка...' : 'ЗАГРУЗКА'}
          </div>
          <button onClick={loadData} className="refresh-btn" disabled={loading}>
            🔄 Обновить
          </button>
        </div>
      </header>

      <nav className="app-nav">
        <div className="nav-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="icon">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </div>
      </nav>

      <main className="app-main">
        <div className="tab-content">
          {activeTab === 'messages' && (
            <MessageList
              messages={messages}
              chats={chats}
              keywords={keywords}
              stats={stats}
              onUpdate={loadData}
              apiBase={API_BASE}
            />
          )}
          {activeTab === 'chats' && (
            <TelegramChatManager
              messages={messages}
              chats={chats}
              keywords={keywords}
              stats={stats}
              onUpdate={loadData}
              apiBase={API_BASE}
            />
          )}
          {activeTab === 'statistics' && (
            <Statistics
              messages={messages}
              chats={chats}
              keywords={keywords}
              stats={stats}
              onUpdate={loadData}
              apiBase={API_BASE}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
