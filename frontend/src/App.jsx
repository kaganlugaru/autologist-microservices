import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './components/MessageList';
import Statistics from './components/Statistics';
import TelegramChatManager from './components/TelegramChatManager';
import './App.css';
import './components/KeywordsManagerCompact.css';

// Получаем URL бэкенда из переменных окружения или используем локальный для разработки
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Настройка axios с увеличенным timeout для Render (может быть медленным на cold start)
axios.defaults.timeout = 30000; // 30 секунд
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [stats, setStats] = useState({});
  
  // Отдельные состояния загрузки
  const [essentialLoading, setEssentialLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [keywordFilter, setKeywordFilter] = useState('');

  // Определение типа устройства и лимитов
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const getMessagesLimit = () => {
    if (keywordFilter) return 1000; // При фильтре - больше данных за 24ч
    return isMobile ? 50 : 300; // Мобильные 50, десктоп 300
  };

  // КРИТИЧНАЯ ЗАГРУЗКА: Сообщения + Ключевые слова (показываем интерфейс сразу)
  const loadEssentialData = async () => {
    setEssentialLoading(true);
    try {
      const limit = getMessagesLimit();
      const messagesUrl = keywordFilter 
        ? `${API_BASE}/messages?limit=${limit}&since=${get24HoursAgo()}&keywords=${encodeURIComponent(keywordFilter)}`
        : `${API_BASE}/messages?limit=${limit}`;

      const [messagesRes, keywordsRes] = await Promise.all([
        axios.get(messagesUrl),
        axios.get(`${API_BASE}/keywords`)
      ]);

      setMessages(messagesRes.data.data || []);
      
      // Обработка ключевых слов
      const keywordData = keywordsRes.data.data || [];
      const keywordStrings = keywordData.map(kw => 
        typeof kw === 'string' ? kw : kw.keyword || ''
      ).filter(kw => kw.length > 0);
      setKeywords(keywordStrings);
      
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.error('Ошибка загрузки критичных данных:', error);
      // Показываем пустые данные, но интерфейс готов
      setMessages([]);
      setKeywords([]);
    } finally {
      setEssentialLoading(false);
    }
  };

  // LAZY LOADING: Чаты (только при переходе на вкладку)
  const loadChatsIfNeeded = async () => {
    if (activeTab === 'chats' && chats.length === 0) {
      setChatsLoading(true);
      try {
        const chatsRes = await axios.get(`${API_BASE}/chats`);
        setChats(chatsRes.data.data || []);
      } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
        setChats([]);
      } finally {
        setChatsLoading(false);
      }
    }
  };

  // ФОНОВАЯ ЗАГРУЗКА: Статистика (не блокирует интерфейс)
  const loadStatsBackground = async () => {
    setStatsLoading(true);
    try {
      const statsRes = await axios.get(`${API_BASE}/stats`);
      setStats(statsRes.data.data || {});
    } catch (error) {
      console.error('Статистика недоступна:', error);
      setStats(null); // Скрываем блок статистики
    } finally {
      setStatsLoading(false);
    }
  };

  // Вспомогательная функция для 24 часов назад
  const get24HoursAgo = () => {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    return yesterday.toISOString();
  };

  useEffect(() => {
    // Сразу загружаем критичные данные
    loadEssentialData();
    
    // Статистику загружаем в фоне через 1 секунду  
    setTimeout(() => {
      loadStatsBackground();
    }, 1000);
    
    // Автообновление критичных данных каждые 30 секунд
    const interval = setInterval(loadEssentialData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Отслеживаем смену вкладок для lazy loading чатов
  useEffect(() => {
    loadChatsIfNeeded();
  }, [activeTab]);

  // Перезагрузка при изменении фильтра по ключевым словам
  useEffect(() => {
    if (keywordFilter !== '') {
      loadEssentialData();
    }
  }, [keywordFilter]);

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
            {essentialLoading ? (
              <span style={{color: '#ff9800'}}>� Загрузка данных...</span>
            ) : (
              <>
                🕐 Обновлено: {lastUpdateTime.toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
                {isMobile && <span style={{marginLeft: '10px', fontSize: '0.8em'}}>📱 Мобильный режим</span>}
              </>
            )}
          </div>
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
              loading={essentialLoading}
              onUpdate={loadEssentialData}
              apiBase={API_BASE}
            />
          )}
          {activeTab === 'chats' && (
            <TelegramChatManager
              messages={messages}
              chats={chats}
              keywords={keywords}
              stats={stats}
              loading={chatsLoading}
              onUpdate={loadChatsIfNeeded}
              apiBase={API_BASE}
            />
          )}
          {activeTab === 'statistics' && (
            <Statistics
              messages={messages}
              chats={chats}
              keywords={keywords}
              stats={stats}
              statsLoading={statsLoading}
              onUpdate={loadEssentialData}
              onStatsUpdate={loadStatsBackground}
              apiBase={API_BASE}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
