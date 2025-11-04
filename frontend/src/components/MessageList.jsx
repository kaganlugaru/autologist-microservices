import React, { useState } from 'react';

export default function MessageList({ messages = [], onUpdate, apiBase }) {
  const [filter, setFilter] = useState('all');
  const [searchText, setSearchText] = useState('');

  const filteredMessages = messages.filter(msg => {
    const matchesFilter = filter === 'all' || 
      (filter === 'duplicates' && msg.is_duplicate) ||
      (filter === 'new' && !msg.is_duplicate) ||
      (filter === 'keywords' && msg.contains_keywords);
    
    const matchesSearch = !searchText || 
      msg.message_text.toLowerCase().includes(searchText.toLowerCase()) ||
      msg.chat_name.toLowerCase().includes(searchText.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

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
      const webUrl = `https://t.me/${username}`;
      
      // Создаем невидимый iframe для попытки открыть десктопное приложение
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = desktopUrl;
      document.body.appendChild(iframe);
      
      // Если через 1 секунду не сработало, открываем веб-версию
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(webUrl, '_blank');
      }, 1000);
    }
  };

  // Функция для создания WhatsApp диалога
  const openWhatsAppChat = (phone) => {
    const cleanPhone = formatPhoneForLink(phone);
    // Открываем в новой вкладке и сразу закрываем текущую
    const whatsappWindow = window.open(`https://wa.me/${cleanPhone}`, '_blank');
    if (whatsappWindow) {
      // Небольшая задержка для корректного открытия
      setTimeout(() => {
        whatsappWindow.focus();
      }, 100);
    }
  };

  // Функция для создания Telegram диалога по номеру телефона  
  const openTelegramByPhone = (phone) => {
    const cleanPhone = formatPhoneForLink(phone);
    console.log('🔗 Открываем телефон в Telegram:', cleanPhone);
    
    // Пробуем разные протоколы для десктопного приложения
    const desktopUrls = [
      `tg://resolve?phone=${cleanPhone}`,
      `tg://resolve?phone=${cleanPhone.replace('+', '')}`,
      `tg://msg?phone=${cleanPhone}`,
      `tg://msg?phone=${cleanPhone.replace('+', '')}`
    ];
    
    let urlIndex = 0;
    
    function tryNextDesktopUrl() {
      if (urlIndex < desktopUrls.length) {
        console.log(`Попытка ${urlIndex + 1}: ${desktopUrls[urlIndex]}`);
        
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = desktopUrls[urlIndex];
        document.body.appendChild(iframe);
        
        setTimeout(() => {
          document.body.removeChild(iframe);
          urlIndex++;
          
          // Пробуем следующий URL через 300ms
          if (urlIndex < desktopUrls.length) {
            setTimeout(tryNextDesktopUrl, 300);
          } else {
            // Если все десктопные варианты не сработали, открываем веб-версию
            openWebTelegramWithPhone(cleanPhone);
          }
        }, 600);
      } else {
        openWebTelegramWithPhone(cleanPhone);
      }
    }
    
    function openWebTelegramWithPhone(phone) {
      console.log('Открываем веб-версию Telegram для номера:', phone);
      
      // Открываем веб-версию Telegram
      const webUrl = 'https://web.telegram.org/k/';
      window.open(webUrl, '_blank');
      
      // Копируем номер в буфер обмена для удобства поиска
      if (navigator.clipboard) {
        navigator.clipboard.writeText(phone).then(() => {
          setTimeout(() => {
            alert(`Telegram открыт! Номер скопирован: "${phone}"\nВставьте его в поиск Telegram для создания диалога.`);
          }, 1000);
        }).catch(() => {
          setTimeout(() => {
            alert(`Telegram открыт! Найдите пользователя по номеру: "${phone}"`);
          }, 1000);
        });
      } else {
        setTimeout(() => {
          alert(`Telegram открыт! Найдите пользователя по номеру: "${phone}"`);
        }, 1000);
      }
    }
    
    // Начинаем с первого URL
    tryNextDesktopUrl();
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
      // Если нет username, пытаемся найти по ID
      const userId = message.user_id;
      const userName = getAuthorDisplayName(message);
      
      // Пробуем разные протоколы для десктопного приложения
      const desktopUrls = [
        `tg://resolve?id=${userId}`,
        `tg://user?id=${userId}`,
        `tg://openmessage?user_id=${userId}`
      ];
      
      let urlIndex = 0;
      
      function tryNextDesktopUrl() {
        if (urlIndex < desktopUrls.length) {
          console.log(`Попытка ${urlIndex + 1}: ${desktopUrls[urlIndex]}`);
          
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = desktopUrls[urlIndex];
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
            urlIndex++;
            
            // Пробуем следующий URL через 300ms
            if (urlIndex < desktopUrls.length) {
              setTimeout(tryNextDesktopUrl, 300);
            } else {
              // Если все десктопные варианты не сработали, открываем веб-версию
              openWebTelegramWithNameAndId(userId, userName);
            }
          }, 600);
        } else {
          openWebTelegramWithNameAndId(userId, userName);
        }
      }
      
      function openWebTelegramWithNameAndId(userId, userName) {
        console.log('Открываем веб-версию Telegram для поиска пользователя:', userName);
        
        // Открываем веб-версию Telegram
        const webUrl = 'https://web.telegram.org/k/';
        window.open(webUrl, '_blank');
        
        // Копируем имя пользователя в буфер обмена для удобства поиска
        const searchText = userName.replace('@', '');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(searchText).then(() => {
            setTimeout(() => {
              alert(`Telegram открыт! Имя пользователя скопировано: "${userName}"\nИспользуйте поиск в Telegram или вставьте имя для поиска.\n\nТакже можете искать по ID: ${userId}`);
            }, 1000);
          }).catch(() => {
            setTimeout(() => {
              alert(`Telegram открыт! Найдите пользователя по имени: "${userName}"\nИли по ID: ${userId}`);
            }, 1000);
          });
        } else {
          setTimeout(() => {
            alert(`Telegram открыт! Найдите пользователя по имени: "${userName}"\nИли по ID: ${userId}`);
          }, 1000);
        }
      }
      
      // Начинаем с первого URL
      tryNextDesktopUrl();
    }
  };

  return (
    <div className="message-list">
      <div className="controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Поиск по тексту или чату..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Все ({messages.length})
          </button>
          <button 
            className={filter === 'new' ? 'active' : ''}
            onClick={() => setFilter('new')}
          >
            ✅ Новые ({messages.filter(m => !m.is_duplicate).length})
          </button>
          <button 
            className={filter === 'duplicates' ? 'active' : ''}
            onClick={() => setFilter('duplicates')}
          >
            🔄 Дубликаты ({messages.filter(m => m.is_duplicate).length})
          </button>
          <button 
            className={filter === 'keywords' ? 'active' : ''}
            onClick={() => setFilter('keywords')}
          >
            🔍 С ключевыми словами ({messages.filter(m => m.contains_keywords).length})
          </button>
        </div>
      </div>

      <div className="message-cards">
        {filteredMessages.map(message => {
          const phoneNumbers = extractPhoneNumbers(message.message_text);
          
          return (
            <div 
              key={message.id} 
              className={`message-card ${message.is_duplicate ? 'duplicate' : 'new'} ${message.contains_keywords ? 'has-keywords' : ''}`}
            >
              <div className="message-header">
                <div className="chat-info">
                  <strong>💬 {message.chat_name}</strong>
                  <span className="date">� Дата: {formatTime(message.created_at)}</span>
                </div>
                
                <div className="author-info">
                  <span className="author-label">👤 Автор:</span>
                  <button 
                    className="author-button clickable-author"
                    onClick={() => openUserProfile(message)}
                    title="Открыть профиль пользователя"
                  >
                    💎 {getAuthorDisplayName(message)}
                  </button>
                </div>
              </div>

              <div className="message-content">
                <div className="content-label">📝 Текст:</div>
                <p className="message-text">{message.message_text}</p>
                
                {/* Номера телефонов с кнопками */}
                {phoneNumbers.length > 0 && (
                  <div className="phone-section">
                    {phoneNumbers.map((phone, index) => (
                      <div key={index} className="phone-item">
                        <span className="phone-number">📞 {phone}</span>
                        <div className="contact-buttons">
                          <button 
                            className="whatsapp-btn"
                            onClick={() => openWhatsAppChat(phone)}
                            title="Написать в WhatsApp"
                          >
                            WhatsApp
                          </button>
                          <button 
                            className="telegram-btn"
                            onClick={() => openTelegramByPhone(phone)}
                            title="Написать в Telegram"
                          >
                            Telegram
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="message-footer">
                {message.matched_keywords && message.matched_keywords.length > 0 && (
                  <div className="keywords">
                    🔍 <strong>Ваши ключевые слова:</strong> {message.matched_keywords.join(', ')}
                  </div>
                )}
                
                <div className="status-info">
                  <span className={`status ${message.is_duplicate ? 'duplicate' : 'new'}`}>
                    {message.is_duplicate ? '🔄 ДУБЛИКАТ' : '✅ НОВОЕ'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMessages.length === 0 && (
        <div className="empty-state">
          <p>📭 Нет сообщений по выбранному фильтру</p>
        </div>
      )}
    </div>
  );
}