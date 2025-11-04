-- Добавление полей для имен пользователей в таблицу messages
ALTER TABLE messages 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Добавим индекс для username, если его еще нет
CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);

-- Добавим индекс для first_name для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_messages_first_name ON messages(first_name);