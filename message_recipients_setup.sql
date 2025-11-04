-- Создание таблицы для получателей сообщений по ключевым словам
CREATE TABLE IF NOT EXISTS message_recipients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Имя получателя',
    username VARCHAR(255) COMMENT 'Username в Telegram (без @)',
    telegram_id BIGINT NOT NULL COMMENT 'Telegram ID получателя',
    keyword VARCHAR(255) NOT NULL COMMENT 'Ключевое слово для отправки',
    active BOOLEAN DEFAULT true COMMENT 'Активен ли получатель',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Индексы для быстрого поиска
    INDEX idx_keyword (keyword),
    INDEX idx_telegram_id (telegram_id),
    INDEX idx_active (active),
    
    -- Уникальный индекс для предотвращения дубликатов
    UNIQUE KEY unique_recipient_keyword (telegram_id, keyword)
);

-- Добавляем получателя для KGN по всем ключевым словам
INSERT INTO message_recipients (name, username, telegram_id, keyword, active) VALUES
('KGN', 'Rinat575kz', 262700292, 'доставка', true),
('KGN', 'Rinat575kz', 262700292, 'перевозка', true),
('KGN', 'Rinat575kz', 262700292, 'Китай', true),
('KGN', 'Rinat575kz', 262700292, 'Москва', true),
('KGN', 'Rinat575kz', 262700292, 'горячий', true),
('KGN', 'Rinat575kz', 262700292, 'стоимость', true)
ON CONFLICT (telegram_id, keyword) DO NOTHING;