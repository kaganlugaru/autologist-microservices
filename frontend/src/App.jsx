import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageList from './components/MessageList';
import TelegramChatManager from './components/TelegramChatManager';
import Management from './components/Management';
import LoginForm from './components/LoginForm';
import UserManager from './components/UserManager';
import './App.css';
import './components/KeywordsManagerCompact.css';

// Получаем URL бэкенда из переменных окружения или используем локальный для разработки
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Настройка axios с увеличенным timeout для Render (может быть медленным на cold start)
axios.defaults.timeout = 30000; // 30 секунд
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.withCredentials = true; // Для передачи cookies

function App() {
  // Состояние аутентификации
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Основное состояние
  const [activeTab, setActiveTab] = useState('messages');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [stats, setStats] = useState({});
  
  // Состояния загрузки
  const [essentialLoading, setEssentialLoading] = useState(true);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [keywordFilter, setKeywordFilter] = useState('');

  // Определение типа устройства
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Проверка аутентификации при запуске
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.log('User not authenticated');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    // Загружаем данные после успешного входа
    loadEssentialData(userData);
    setTimeout(() => {
      loadStatsBackground(userData);
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setMessages([]);
    setChats([]);
    setKeywords([]);
    setStats({});
  };

  // Отдельная загрузка keywords (только для админов)
  const loadKeywords = async () => {
    if (!user || user.role !== 'admin' || isLoadingKeywords) return;
    
    setIsLoadingKeywords(true);
    try {
      console.log('🔑 [DEBUG] Загружаем keywords отдельно...');
      const response = await axios.get(`${API_BASE}/keywords`);
      const keywordsData = response.data?.data || response.data || [];
      setKeywords(keywordsData);
      console.log('✅ [DEBUG] Keywords загружены:', keywordsData.length);
    } catch (error) {
      console.error('❌ [ERROR] Ошибка загрузки keywords:', error);
    } finally {
      setIsLoadingKeywords(false);
    }
  };

  // Противодействие дублированию - флаги блокировки
  const [isLoadingEssential, setIsLoadingEssential] = useState(false);
  const [isLoadingKeywords, setIsLoadingKeywords] = useState(false);

  // Обработка изменения фильтра поиска с диапазоном
  const handleKeywordFilterChange = (newFilter, range = '24h') => {
    console.log('🔍 [App] Поиск изменен:', `"${newFilter}"`, 'Диапазон:', range);
    setKeywordFilter(newFilter);
    // Перезагружаем данные с новым фильтром и диапазоном
    if (user) {
      console.log('🔍 [App] Вызов loadEssentialData с параметрами:', { newFilter, range });
      loadEssentialData(user, newFilter, range);
    }
  };

  // КРИТИЧНАЯ ЗАГРУЗКА: Сообщения + Ключевые слова
  const loadEssentialData = async (currentUser = user, filterKeyword = keywordFilter, searchRange = '24h') => {
    if (!currentUser || isLoadingEssential) return;
    
    // Блокируем повторные вызовы
    setIsLoadingEssential(true);
    
    console.log('📚 [DEBUG] Загрузка данных:', {
      user: currentUser.username,
      role: currentUser.role,
      filterKeyword: `"${filterKeyword}"`,
      searchRange,
      hasFilter: !!(filterKeyword && filterKeyword.trim())
    });
    
    setEssentialLoading(true);
    try {
      // Определяем лимит на основе переданного фильтра
      const isSearchMode = filterKeyword && filterKeyword.trim();
      const limit = isSearchMode ? 5000 : (isMobile ? 200 : 1000); // Увеличиваю лимиты
      
      // Проверяем сложный поиск (через ;)
      const isComplexSearch = isSearchMode && filterKeyword.includes(';');
      
      let messagesUrl;
      if (isSearchMode) {
        // Используем серверный поиск с диапазоном
        const searchParam = isComplexSearch ? 'complex' : 'q';
        messagesUrl = `${API_BASE}/search?${searchParam}=${encodeURIComponent(filterKeyword.trim())}&range=${searchRange}&limit=${limit}`;
        console.log('🔍 [DEBUG] Поиск URL:', messagesUrl);
        if (isComplexSearch) {
          console.log('🔗 [DEBUG] Сложный поиск по ключам:', filterKeyword.split(';'));
        }
      } else {
        // Обычная загрузка последних сообщений
        messagesUrl = `${API_BASE}/messages?limit=${limit}`;
        console.log('📜 [DEBUG] Обычная загрузка URL:', messagesUrl);
      }

      const requests = [axios.get(messagesUrl)];
      
      // НЕ загружаем keywords при каждом поиске!
      // Keywords загрузятся отдельно только при первом заходе
      
      const responses = await Promise.all(requests);
      
      console.log('📋 [DEBUG] Ответы:', responses);
      
      // ДЕТАЛЬНАЯ ДИАГНОСТИКА СТРУКТУРЫ ОТВЕТА
      const response = responses[0];
      console.log('🔎 [DEBUG] Полная структура ответа:');
      console.log('  📦 response:', response);
      console.log('  📄 response.data:', response?.data);
      console.log('  🎯 response.data.data:', response?.data?.data);
      console.log('  ✅ response.data.success:', response?.data?.success);
      console.log('  📊 response.data.count:', response?.data?.count);
      
      // Обновляем только сообщения
      if (response?.data?.data) {
        setMessages(response.data.data);
        setLastUpdateTime(new Date());
        console.log('✅ [DEBUG] Сообщения обновлены:', response.data.data.length);
      } else {
        console.log('⚠️ [DEBUG] Нет данных сообщений, полный ответ:', response?.data);
        setMessages([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setEssentialLoading(false);
      setIsLoadingEssential(false); // Разблокируем
    }
  };

  // ФОНОВАЯ ЗАГРУЗКА: Статистика
  const loadStatsBackground = async (currentUser = user) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    setStatsLoading(true);
    try {
      const statsRes = await axios.get(`${API_BASE}/stats`);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // ФОНОВАЯ ЗАГРУЗКА: Чаты (только при необходимости)
  const loadChatsIfNeeded = async () => {
    if (!user || user.role !== 'admin') return;
    
    if (activeTab === 'chats' && chats.length === 0) {
      setChatsLoading(true);
      try {
        const chatsRes = await axios.get(`${API_BASE}/monitored-chats`);
        setChats(chatsRes.data || []);
      } catch (error) {
        console.error('Ошибка загрузки чатов:', error);
      } finally {
        setChatsLoading(false);
      }
    }
  };

  // Утилиты
  const get24HoursAgo = () => {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString();
  };

  // Автозагрузка при смене пользователя
  useEffect(() => {
    if (user) {
      loadEssentialData();
      
      // Загружаем keywords отдельно один раз
      if (user.role === 'admin') {
        loadKeywords();
      }
      
      setTimeout(() => {
        loadStatsBackground();
      }, 1000);
      
      // Автообновление каждые 30 секунд
      const interval = setInterval(loadEssentialData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Загрузка при смене фильтра
  useEffect(() => {
    if (user && keywordFilter !== undefined) {
      loadEssentialData();
    }
  }, [keywordFilter]);

  // Загрузка чатов при переходе на вкладку
  useEffect(() => {
    loadChatsIfNeeded();
  }, [activeTab]);

  // Показываем загрузку при проверке аутентификации
  if (authLoading) {
    return (
      <div className="app">
        <div style={{
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh', 
          fontSize: '1.2em'
        }}>
          🔄 Проверка авторизации...
        </div>
      </div>
    );
  }

  // Показываем форму входа если пользователь не авторизован
  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Определяем доступные вкладки в зависимости от роли
  const tabs = user.role === 'admin' ? [
    { id: 'messages', name: 'Сообщения', icon: '💬' },
    { id: 'chats', name: 'Telegram Чаты', icon: '📱' },
    { id: 'management', name: 'Управление', icon: '⚙️' },
    { id: 'users', name: 'Пользователи', icon: '👥' }
  ] : [
    { id: 'messages', name: 'Сообщения', icon: '💬' }
  ];

  // Проверяем, что текущая вкладка доступна пользователю
  const availableTabIds = tabs.map(tab => tab.id);
  if (!availableTabIds.includes(activeTab)) {
    setActiveTab('messages');
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <span className="emoji">🚛</span>
          Autologist Parser Dashboard
        </div>
        <div className="app-actions">
          <div className="user-info">
            <span style={{color: '#666', marginRight: '15px'}}>
              {user.role === 'admin' ? '👑' : '👤'} {user.username}
            </span>
            <button 
              onClick={handleLogout}
              style={{
                background: '#dc3545', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🚪 Выйти
            </button>
          </div>
          <div className="status-indicator">
            {essentialLoading ? (
              <span style={{color: '#ff9800'}}>🔄 Загрузка данных...</span>
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
              loading={essentialLoading}
              lastUpdateTime={lastUpdateTime}
              keywordFilter={keywordFilter}
              onKeywordFilterChange={handleKeywordFilterChange}
              user={user}
              apiBase={API_BASE}
            />
          )}
          {activeTab === 'chats' && user.role === 'admin' && (
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
          {activeTab === 'users' && user.role === 'admin' && (
            <UserManager apiBase={API_BASE} />
          )}
          {activeTab === 'management' && user.role === 'admin' && (
            <Management
              keywords={keywords}
              apiBase={API_BASE}
              onUpdate={loadKeywords}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;