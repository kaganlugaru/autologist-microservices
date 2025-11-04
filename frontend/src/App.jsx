import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './components/MessageList';
import Statistics from './components/Statistics';
import ParserControl from './components/ParserControl';
import TelegramChatManager from './components/TelegramChatManager';
import './App.css';

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [activeTab, setActiveTab] = useState('telegram-chats');
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
        axios.get(`${API_BASE}/messages?limit=100`),
        axios.get(`${API_BASE}/chats`),
        axios.get(`${API_BASE}/keywords`),
        axios.get(`${API_BASE}/stats`)
      ]);

      setMessages(messagesRes.data.data || []);
      setChats(chatsRes.data.data || []);
      setKeywords(keywordsRes.data.data || []);
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
    { id: 'messages', label: '📨 Сообщения', component: MessageList },
    { id: 'telegram-chats', label: '📱 Telegram чаты', component: TelegramChatManager },
    { id: 'stats', label: '📊 Статистика', component: Statistics },
    { id: 'control', label: '⚙️ Управление', component: ParserControl }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚛 Autologist Parser Dashboard</h1>
        <div className="status-indicator">
          <span className={`status ${loading ? 'loading' : 'online'}`}>
            {loading ? '🔄 Загрузка...' : '🟢 Онлайн'}
          </span>
          <button onClick={loadData} className="refresh-btn">
            🔄 Обновить
          </button>
        </div>
      </header>

      <nav className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-content">
        {ActiveComponent && (
          <ActiveComponent
            messages={messages}
            chats={chats}
            keywords={keywords}
            stats={stats}
            onUpdate={loadData}
            apiBase={API_BASE}
          />
        )}
      </main>
    </div>
  );
}

export default App;
