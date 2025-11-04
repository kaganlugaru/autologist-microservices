-- Создание таблицы для получателей сообщений по ключевым словам
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor

CREATE TABLE message_recipients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    telegram_id BIGINT DEFAULT NULL,
    keyword VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_recipients_keyword ON message_recipients(keyword);
CREATE INDEX idx_recipients_username ON message_recipients(username);
CREATE INDEX idx_recipients_active ON message_recipients(active);

-- Создаем уникальный индекс для предотвращения дубликатов
CREATE UNIQUE INDEX unique_recipient_keyword ON message_recipients(username, keyword);

-- Добавляем получателя KGN для всех ключевых слов
INSERT INTO message_recipients (name, username, keyword, active) VALUES
('KGN', 'Rinat575kz', 'доставка', true),
('KGN', 'Rinat575kz', 'перевозка', true),
('KGN', 'Rinat575kz', 'Китай', true),
('KGN', 'Rinat575kz', 'Москва', true),
('KGN', 'Rinat575kz', 'горячий', true),
('KGN', 'Rinat575kz', 'стоимость', true);

-- Включаем Row Level Security (RLS) для безопасности
ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;

-- Создаем политику для полного доступа (можно настроить позже)
CREATE POLICY "Enable all operations for message_recipients" ON message_recipients
FOR ALL USING (true) WITH CHECK (true);