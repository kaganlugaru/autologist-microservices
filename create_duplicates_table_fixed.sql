-- Создание таблицы для отслеживания дубликатов (исправленная версия для Supabase)
-- Эта таблица будет хранить информацию о всех появлениях одного и того же сообщения

CREATE TABLE IF NOT EXISTS message_duplicates (
    id BIGSERIAL PRIMARY KEY,
    original_message_id BIGINT REFERENCES messages(id),
    duplicate_chat_id BIGINT NOT NULL,
    duplicate_chat_name TEXT NOT NULL,
    duplicate_user_id BIGINT,
    duplicate_username TEXT,
    duplicate_user_first_name TEXT,
    duplicate_user_last_name TEXT,
    duplicate_message_id BIGINT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content_hash TEXT NOT NULL
);

-- Создаем индексы отдельно (правильный синтаксис для Supabase)
CREATE INDEX IF NOT EXISTS idx_message_duplicates_original ON message_duplicates (original_message_id);
CREATE INDEX IF NOT EXISTS idx_message_duplicates_hash ON message_duplicates (content_hash);
CREATE INDEX IF NOT EXISTS idx_message_duplicates_chat ON message_duplicates (duplicate_chat_id);

-- Добавляем комментарии к таблице
COMMENT ON TABLE message_duplicates IS 'Хранит информацию о всех дубликатах сообщений';
COMMENT ON COLUMN message_duplicates.original_message_id IS 'ID оригинального сообщения в БД';
COMMENT ON COLUMN message_duplicates.duplicate_chat_id IS 'ID чата где был найден дубликат';
COMMENT ON COLUMN message_duplicates.duplicate_chat_name IS 'Название чата где был найден дубликат';
COMMENT ON COLUMN message_duplicates.duplicate_user_id IS 'ID пользователя который опубликовал дубликат';
COMMENT ON COLUMN message_duplicates.duplicate_username IS 'Username пользователя';
COMMENT ON COLUMN message_duplicates.duplicate_user_first_name IS 'Имя пользователя';
COMMENT ON COLUMN message_duplicates.duplicate_user_last_name IS 'Фамилия пользователя';
COMMENT ON COLUMN message_duplicates.duplicate_message_id IS 'ID сообщения в Telegram';
COMMENT ON COLUMN message_duplicates.detected_at IS 'Время обнаружения дубликата';
COMMENT ON COLUMN message_duplicates.content_hash IS 'Хеш содержимого для связи с оригиналом';