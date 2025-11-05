        {paginatedMessages.map(message => {
          const phoneNumbers = extractPhoneNumbers(message.message_text);
          return (
            <div key={message.id} className={`message-card ${message.is_duplicate ? 'duplicate' : 'new'} ${message.contains_keywords ? 'has-keywords' : ''}`}>
              <div className="message-header">
                <span className="message-author" title="Открыть профиль пользователя" onClick={() => openUserProfile(message)}>
                  💎 {getAuthorDisplayName(message)}
                </span>
                <span className="message-time">🕒 {formatTime(message.created_at)}</span>
                <span className="chat-info">💬 {message.chat_name}</span>
              </div>
              <div className="message-content">
                <div className="content-label">📝 Текст:</div>
                <p className="message-text">{message.message_text}</p>
                {/* Кликабельные телефоны с кнопками */}
                {phoneNumbers.length > 0 && (
                  <div className="phone-section">
                    {phoneNumbers.map((phone, index) => (
                      <div key={index} className="phone-item">
                        <a className="message-phone" href={`tel:${formatPhoneForLink(phone)}`}>📞 {phone}</a>
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

              <div className="message-header">
                <span className="message-author" title="Открыть профиль пользователя" onClick={() => openUserProfile(message)}>
                  💎 {getAuthorDisplayName(message)}
                </span>
                <span className="message-time">🕒 {formatTime(message.created_at)}</span>
                <span className="chat-info">💬 {message.chat_name}</span>
              </div>
                </div>
              </div>

              <div className="message-content">
                <div className="content-label">📝 Текст:</div>
                <p className="message-text">{message.message_text}</p>
                
                {/* Кликабельные телефоны с кнопками */}
                {phoneNumbers.length > 0 && (
                  <div className="phone-section">
                    {phoneNumbers.map((phone, index) => (
                      <div key={index} className="phone-item">
                        <a className="message-phone" href={`tel:${formatPhoneForLink(phone)}`}>📞 {phone}</a>
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