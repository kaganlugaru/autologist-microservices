-- Создание таблицы получателей уведомлений
-- Эта таблица хранит информацию о людях, которым должны отправляться уведомления

CREATE TABLE IF NOT EXISTS notification_recipients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- связь с recipient_categories
    
    -- Варианты контактной информации (один из полей должен быть заполнен)
    phone_number VARCHAR(20), -- номер телефона для отправки через Telegram API
    telegram_username VARCHAR(100), -- username в Telegram (@username)
    chat_id BIGINT, -- ID чата в Telegram
    
    -- Настройки
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Проверка что хотя бы один способ связи указан
    CONSTRAINT notification_recipients_contact_check 
        CHECK (phone_number IS NOT NULL OR telegram_username IS NOT NULL OR chat_id IS NOT NULL)
);

-- Добавляем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_notification_recipients_category ON notification_recipients(category);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_active ON notification_recipients(active);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_phone ON notification_recipients(phone_number);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_username ON notification_recipients(telegram_username);

-- Добавляем внешний ключ на категории (если таблица recipient_categories уже существует)
-- ALTER TABLE notification_recipients 
-- ADD CONSTRAINT fk_notification_recipients_category 
-- FOREIGN KEY (category) REFERENCES recipient_categories(category);

-- Добавляем триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_notification_recipients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_recipients_updated_at
    BEFORE UPDATE ON notification_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_recipients_updated_at();

-- Добавляем тестовых получателей (замените на реальные данные)
INSERT INTO notification_recipients (name, category, phone_number, active) VALUES
    ('Тестовый получатель 1', 'грузоперевозки', '+77000000001', true),
    ('Тестовый получатель 2', 'грузоперевозки', '+77000000002', true)
ON CONFLICT DO NOTHING;

-- Комментарии к таблице
COMMENT ON TABLE notification_recipients IS 'Получатели уведомлений о сообщениях с ключевыми словами';
COMMENT ON COLUMN notification_recipients.category IS 'Категория получателя, связана с категориями ключевых слов';
COMMENT ON COLUMN notification_recipients.phone_number IS 'Номер телефона в международном формате (+7...)';
COMMENT ON COLUMN notification_recipients.telegram_username IS 'Username в Telegram без @';
COMMENT ON COLUMN notification_recipients.chat_id IS 'ID чата Telegram для прямой отправки';