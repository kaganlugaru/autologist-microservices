import React, { useState } from 'react';
import './MessageList.css';

export default function MessageList({ messages = [], onUpdate, apiBase, keywordFilter, onKeywordFilterChange, loading, lastUpdateTime, user }) {
  
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState(''); // Локальное значение в поле
  const [activeSearch, setActiveSearch] = useState(''); // Активный поисковый запрос
  const [searchRange, setSearchRange] = useState('24h');
  const [duplicateInfo, setDuplicateInfo] = useState({});
  const [loadingDuplicates, setLoadingDuplicates] = useState({});
  const [expandedMessages, setExpandedMessages] = useState({});
  const [isSearchMode, setIsSearchMode] = useState(false); // Режим поиска
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [messagesPerPage, setMessagesPerPage] = useState(20);

  // Обработка ввода в поле поиска
  const handleSearchInputChange = (e) => {
    setSearchText(e.target.value);
  };

  // Выполнение поиска
  const executeSearch = () => {
    if (!searchText.trim()) return;
    
    console.log('🔍 [MessageList] Выполняем поиск:', `"${searchText.trim()}"`, 'Диапазон:', searchRange);
    setActiveSearch(searchText.trim());
    setIsSearchMode(true);
    
    if (onKeywordFilterChange) {
      onKeywordFilterChange(searchText.trim(), searchRange);
    } else {
      console.error('🛑 [MessageList] onKeywordFilterChange не передан!');
    }
  };

  // Сброс поиска
  const resetSearch = () => {
    console.log('🔄 [MessageList] Сброс поиска');
    setSearchText('');
    setActiveSearch('');
    setIsSearchMode(false);
    
    if (onKeywordFilterChange) {
      onKeywordFilterChange('', searchRange);
    }
  };

  // Обработка изменения диапазона поиска
  const handleRangeChange = (newRange) => {
    console.log('📅 [MessageList] Диапазон изменен:', newRange);
    setSearchRange(newRange);
    
    // Если активен поиск, перезапускаем с новым диапазоном
    if (isSearchMode && activeSearch) {
      console.log('📅 [MessageList] Повторный поиск с новым диапазоном:', `"${activeSearch}"`);
      if (onKeywordFilterChange) {
        onKeywordFilterChange(activeSearch, newRange);
      }
    }
  };

  // Обработка Enter в поле поиска
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  // Опции диапазона поиска
  const searchRangeOptions = [
    { value: '1h', label: 'Последний час' },
    { value: '6h', label: 'Последние 6 часов' },
    { value: '24h', label: 'Последние 24 часа' },
    { value: '3d', label: 'Последние 3 дня' },
    { value: '7d', label: 'Последняя неделя' },
    { value: '30d', label: 'Последний месяц' },
    { value: 'all', label: 'За всё время' }
  ];

  // Получить текст диапазона
  const getRangeText = (range) => {
    const option = searchRangeOptions.find(opt => opt.value === range);
    return option ? option.label : range;
  };

  // Функция для переключения развернутого состояния сообщения
  const toggleExpanded = (messageId) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Функция для форматирования текста сообщений - убираем лишние переносы
  const formatMessageText = (text) => {
    if (!text) return '';
    
    // Заменяем множественные переносы строк на одиночные
    // Убираем переносы в середине предложений, оставляем только при двойном переносе
    return text
      .replace(/\n{3,}/g, '\n\n')  // Множественные переносы заменяем на двойной
      .replace(/\n(?!\n)/g, ' ')   // Одиночные переносы заменяем пробелами
      .replace(/\s+/g, ' ')        // Множественные пробелы заменяем одним
      .trim();                     // Убираем пробелы в начале и конце
  };

  // Функция для загрузки информации о дубликатах
  const loadDuplicateInfo = async (messageId) => {
    if (loadingDuplicates[messageId] || duplicateInfo[messageId]) return;
    
    setLoadingDuplicates(prev => ({ ...prev, [messageId]: true }));
    
    try {
      const response = await fetch(`${apiBase}/messages/${messageId}/duplicates`);
      const result = await response.json();
      
      if (result.success) {
        setDuplicateInfo(prev => ({
          ...prev,
          [messageId]: result.data
        }));
      }
    } catch (error) {
      console.error('Ошибка загрузки дубликатов:', error);
    } finally {
      setLoadingDuplicates(prev => ({ ...prev, [messageId]: false }));
    }
  };

  // Безопасная проверка messages
  const safeMessages = Array.isArray(messages) ? messages : [];

  const filteredMessages = safeMessages.filter(msg => {
    const matchesFilter = filter === 'all' || 
      (filter === 'duplicates' && msg.is_duplicate) ||
      (filter === 'new' && !msg.is_duplicate) ||
      (filter === 'keywords' && msg.contains_keywords);
    
    // 🔴 КРИТИЧНОЕ ИСПРАВЛЕНИЕ:
    // При активном поиске НЕ применяем локальную фильтрацию!
    // Сервер уже отфильтровал сообщения по keywordFilter
    const matchesSearch = !isSearchMode && (!searchText || 
      msg.message_text.toLowerCase().includes(searchText.toLowerCase()) ||
      msg.chat_name.toLowerCase().includes(searchText.toLowerCase()));
    
    // Если режим поиска - показываем ВСЕ пришедшие с сервера сообщения
    return matchesFilter && (isSearchMode || matchesSearch);
  });

  // Пагинация
  const totalPages = Math.ceil(filteredMessages.length / messagesPerPage);
  const startIndex = (currentPage - 1) * messagesPerPage;
  const paginatedMessages = filteredMessages.slice(startIndex, startIndex + messagesPerPage);

  // Сброс страницы при изменении фильтров
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchText]);

  const getDuplicateReason = (msg) => {
    if (msg.duplicate_reason) return msg.duplicate_reason;
    if (msg.is_duplicate) return "ДУБЛИКАТ: Похожее сообщение уже обработано";
    return "НОВОЕ: Первое сообщения такого типа";
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  // Функция для извлечения номеров телефонов из текста
  const extractPhoneNumbers = (text) => {
    const phonePatterns = [
      /\+7\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}/g,  // +7 999 999 99 99
      /\+7\d{10}/g,                             // +79999999999
      /8\s?\d{3}\s?\d{3}\s?\d{2}\s?\d{2}/g,   // 8 999 999 99 99
      /8\d{10}/g,                               // 89999999999
      /\+\d{1,3}\s?\d{7,15}/g,                 // Международные номера
      /\d{3}[-\s]?\d{3}[-\s]?\d{4}/g,         // 999-999-9999 или 999 999 9999
    ];
    
    let phones = [];
    phonePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phones = phones.concat(matches);
      }
    });
    
    // Убираем дубликаты и нормализуем номера
    return [...new Set(phones)];
  };

  // Функция для форматирования номера для ссылок
  const formatPhoneForLink = (phone) => {
    // Убираем все кроме цифр и +
    let cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Если номер начинается с 8, заменяем на +7
    if (cleanPhone.startsWith('8') && cleanPhone.length === 11) {
      cleanPhone = '+7' + cleanPhone.slice(1);
    }
    
    // Если номер не начинается с +, добавляем +
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    
    return cleanPhone;
  };

  // Функция для создания Telegram диалога с пользователем
  const openTelegramChat = (username) => {
    if (username) {
      console.log('🔗 Открываем пользователя Telegram:', username);
      
      // Пробуем открыть через десктопное приложение
      const desktopUrl = `tg://resolve?domain=${username}`;
      const telegramWebUrl = `https://t.me/${username}`;
      
      // Создаем невидимый iframe для попытки открыть десктопное приложение
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = desktopUrl;
      document.body.appendChild(iframe);
      
      // Если через 1 секунду не сработало, открываем веб-версию
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(telegramWebUrl, '_blank');
      }, 1000);
    }
  };

  // Функция для создания WhatsApp диалога
  const openWhatsAppChat = (phone) => {
    const cleanPhone = formatPhoneForLink(phone);
    // Пытаемся открыть десктопное приложение, если не получается - веб-версию
    const desktopUrl = `whatsapp://send?phone=${cleanPhone}`;
    const whatsappWebUrl = `https://wa.me/${cleanPhone}`;
    
    // Открываем десктопное приложение
    window.location.href = desktopUrl;
    
    // Резервный вариант - веб-версия через 2 секунды
    setTimeout(() => {
      window.open(whatsappWebUrl, '_blank');
    }, 2000);
  };

  // Функция для создания Telegram диалога по номеру телефона  
  const openTelegramByPhone = (phone) => {
    const cleanPhone = formatPhoneForLink(phone);
    console.log('🔗 Открываем телефон в Telegram:', cleanPhone);
    
    // Пытаемся открыть десктопное приложение
    const desktopUrl = `tg://resolve?phone=${cleanPhone}`;
    const webTelegramUrl = `https://t.me/+${cleanPhone}`;
    
    // Открываем десктопное приложение
    window.location.href = desktopUrl;
    
    // Резервный вариант - веб-версия через 2 секунды
    setTimeout(() => {
      window.open(webTelegramUrl, '_blank');
    }, 2000);
    
    // Копируем номер в буфер обмена для удобства поиска
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cleanPhone).then(() => {
        console.log('📋 Номер скопирован в буфер обмена:', cleanPhone);
      }).catch(() => {
        console.log('⚠️ Не удалось скопировать номер в буфер обмена');
      });
    }
  };

  // Функция для получения отображаемого имени автора
  const getAuthorDisplayName = (message) => {
    // Если есть username, показываем его
    if (message.username) {
      return `@${message.username}`;
    }
    
    // Если есть имя/фамилия в базе (если такие поля есть)
    if (message.first_name || message.last_name) {
      const parts = [];
      if (message.first_name) parts.push(message.first_name);
      if (message.last_name) parts.push(message.last_name);
      return parts.join(' ');
    }
    
    // Иначе показываем User ID
    return `User ${message.user_id}`;
  };

  // Функция для открытия профиля пользователя в Telegram
  const openUserProfile = (message) => {
    console.log('🔗 Открываем пользователя Telegram по ID и имени:', message.user_id, getAuthorDisplayName(message));
    
    if (message.username) {
      // Если есть username, используем его
      openTelegramChat(message.username);
    } else {
      // Если нет username, открываем веб-версию Telegram
      const webTelegramUrl = 'https://web.telegram.org/k/';
      window.open(webTelegramUrl, '_blank');
      
      // Копируем имя пользователя в буфер обмена для удобства поиска
      const searchText = getAuthorDisplayName(message).replace('@', '');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(searchText).then(() => {
          setTimeout(() => {
            alert(`Telegram открыт! Имя пользователя скопировано: "${getAuthorDisplayName(message)}"\nИспользуйте поиск в Telegram или вставьте имя для поиска.\n\nТакже можете искать по ID: ${message.user_id}`);
          }, 1000);
        }).catch(() => {
          setTimeout(() => {
            alert(`Telegram открыт! Найдите пользователя по имени: "${getAuthorDisplayName(message)}"\nИли по ID: ${message.user_id}`);
          }, 1000);
        });
      } else {
        setTimeout(() => {
          alert(`Telegram открыт! Найдите пользователя по имени: "${getAuthorDisplayName(message)}"\nИли по ID: ${message.user_id}`);
        }, 1000);
      }
    }
  };

  return (
    <div className="message-list">
      <div className="controls">
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Поиск: груз ИЛИ тандем;алматы;130 (через ; для сложного поиска)"
              value={searchText}
              onChange={handleSearchInputChange}
              onKeyPress={handleKeyPress}
            />
            <button 
              onClick={executeSearch} 
              disabled={!searchText.trim() || loading}
              className="search-button primary"
            >
              🔍 Найти
            </button>
            {isSearchMode && (
              <button 
                onClick={resetSearch}
                className="search-button secondary"
              >
                🔄 Сбросить
              </button>
            )}
          </div>
          
          {/* Диапазон поиска всегда видимый */}
          <div className="search-range-selector">
            <label>Диапазон поиска:</label>
            <select 
              value={searchRange} 
              onChange={(e) => handleRangeChange(e.target.value)}
              className="range-select"
            >
              {searchRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Индикатор активного поиска */}
          {isSearchMode && activeSearch && (
            <div className="search-status">
              {activeSearch.includes(';') ? (
                <span>🔗 Сложный поиск: <strong>[{activeSearch.split(';').join('] + [')}]</strong> за <strong>{getRangeText(searchRange)}</strong></span>
              ) : (
                <span>🔍 Поиск: <strong>"{activeSearch}"</strong> за <strong>{getRangeText(searchRange)}</strong></span>
              )}
            </div>
          )}
        </div>
        
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Все ({safeMessages.length})
          </button>
          <button 
            className={filter === 'new' ? 'active' : ''}
            onClick={() => setFilter('new')}
          >
            ✅ Новые ({safeMessages.filter(m => !m.is_duplicate).length})
          </button>
          <button 
            className={filter === 'duplicates' ? 'active' : ''}
            onClick={() => setFilter('duplicates')}
          >
            🔄 Дубликаты ({safeMessages.filter(m => m.is_duplicate).length})
          </button>
          <button 
            className={filter === 'keywords' ? 'active' : ''}
            onClick={() => setFilter('keywords')}
          >
            🔍 С ключевыми словами ({safeMessages.filter(m => m.contains_keywords).length})
          </button>
        </div>
      </div>

      <div className="message-cards">
        {/* 🚨 КРИТИЧЕСКОЕ ЛОГИРОВАНИЕ РЕНДЕРИНГА */}
        {console.log('🖼️ [MessageList] РЕНДЕРИНГ СПИСКА:')}
        {console.log('  📝 paginatedMessages для отображения:', paginatedMessages.length)}
        {console.log('  📋 Первые 3 ID:', paginatedMessages.slice(0, 3).map(m => m.id))}
        
        {paginatedMessages.length === 0 ? (
          <>
            {console.log('❌ [MessageList] ПУСТОЙ СПИСОК! Показываем заглушку')}
            <div className="no-messages">
              📝 Нет сообщений по выбранному фильтру
            </div>
          </>
        ) : (
          <>
            {console.log('✅ [MessageList] ОТОБРАЖАЕМ СООБЩЕНИЯ:', paginatedMessages.length)}
            {paginatedMessages.map(message => {
              console.log('🔄 [MessageList] Рендерим сообщение ID:', message.id);
              const phoneNumbers = extractPhoneNumbers(message.message_text);
              const isExpanded = expandedMessages[message.id];
              const isLongMessage = message.message_text.length > 200;
          
          return (
            <div key={message.id} className={`message-card ${message.is_duplicate ? 'duplicate' : 'new'} ${message.contains_keywords ? 'has-keywords' : ''} ${isExpanded ? 'expanded' : ''}`}>
              <div className="message-header">
                <span className="message-author clickable" title="Открыть профиль в Telegram" onClick={() => openUserProfile(message)}>
                  {getAuthorDisplayName(message)}
                </span>
                <span className={`status ${message.is_duplicate ? 'duplicate' : 'new'}`}>
                  {message.is_duplicate ? 'ДУБЛИКАТ' : 'НОВОЕ'}
                </span>
                <span className="message-time">{formatTime(message.created_at)}</span>
                <span className="chat-info">{message.chat_name}</span>
              </div>

              <div className="message-content">
                <span className="message-text">{formatMessageText(message.message_text)}</span>
                
                {/* Компактные телефоны в одну строку */}
                {phoneNumbers.length > 0 && (
                  <div className="phone-section-compact">
                    📞 {phoneNumbers.map((phone, index) => (
                      <span key={index} className="phone-item-inline">
                        <a className="message-phone" href={`tel:${formatPhoneForLink(phone)}`}>{phone}</a>
                        <button 
                          className="whatsapp-btn-mini"
                          onClick={() => openWhatsAppChat(phone)}
                          title="WhatsApp"
                        >
                          WA
                        </button>
                        <button 
                          className="telegram-btn-mini"
                          onClick={() => openTelegramByPhone(phone)}
                          title="Telegram"
                        >
                          TG
                        </button>
                        {index < phoneNumbers.length - 1 && <span className="phone-separator"> • </span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Секция дубликатов - показываем только для оригинальных сообщений */}
              {!message.is_duplicate && (
                <div className="duplicates-section">
                  <button 
                    className="duplicates-toggle"
                    onClick={() => loadDuplicateInfo(message.id)}
                    disabled={loadingDuplicates[message.id]}
                  >
                    {loadingDuplicates[message.id] ? '⏳ Загрузка...' : 
                     duplicateInfo[message.id] ? `🔄 Дубликаты (${duplicateInfo[message.id].length})` : 
                     '🔄 Показать дубликаты'}
                  </button>
                  
                  {duplicateInfo[message.id] && duplicateInfo[message.id].length > 0 && (
                    <div className="duplicates-list">
                      <div className="duplicates-header">
                        <strong>📍 Это сообщение также появлялось в:</strong>
                      </div>
                      {duplicateInfo[message.id].map((duplicate, index) => (
                        <div key={index} className="duplicate-item">
                          <div className="duplicate-chat">
                            💬 <strong>{duplicate.duplicate_chat_name}</strong>
                          </div>
                          <div className="duplicate-author">
                            👤 {duplicate.duplicate_username || 
                                 `${duplicate.duplicate_user_first_name || ''} ${duplicate.duplicate_user_last_name || ''}`.trim() || 
                                 `ID: ${duplicate.duplicate_user_id}`}
                          </div>
                          <div className="duplicate-time">
                            🕐 {formatTime(duplicate.detected_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {duplicateInfo[message.id] && duplicateInfo[message.id].length === 0 && (
                    <div className="no-duplicates">
                      ✅ Дубликатов не найдено
                    </div>
                  )}
                </div>
              )}

              <div className="message-footer">
                {message.matched_keywords && message.matched_keywords.length > 0 && (
                  <div className="keywords">
                    🔍 <strong>Ваши ключевые слова:</strong> {message.matched_keywords.join(', ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
          </>
        )}
      </div>

      {/* Пагинация */}
      {filteredMessages.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Показано {startIndex + 1}-{Math.min(startIndex + messagesPerPage, filteredMessages.length)} из {filteredMessages.length} сообщений
            </span>
            
            <div className="per-page-selector">
              <label>На странице:</label>
              <select 
                value={messagesPerPage} 
                onChange={(e) => setMessagesPerPage(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ⏮️ Первая
            </button>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              ⬅️ Пред
            </button>
            
            <span className="page-info">
              Страница {currentPage} из {totalPages}
            </span>
            
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              След ➡️
            </button>
            
            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Последняя ⏭️
            </button>
          </div>
        </div>
      )}

      {filteredMessages.length === 0 && (
        <div className="empty-state">
          <p>📭 Нет сообщений по выбранному фильтру</p>
        </div>
      )}
    </div>
  );
}