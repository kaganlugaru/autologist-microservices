-- Создание таблицы для отслеживания дубликатов
-- Эта таблица будет хранить информацию о всех появлениях одного и того же сообщения

CREATE TABLE IF NOT EXISTS message_duplicates (
    id SERIAL PRIMARY KEY,
    original_message_id INTEGER REFERENCES messages(id),
    duplicate_chat_id BIGINT NOT NULL,
    duplicate_chat_name TEXT NOT NULL,
    duplicate_user_id BIGINT,
    duplicate_username TEXT,
    duplicate_user_first_name TEXT,
    duplicate_user_last_name TEXT,
    duplicate_message_id BIGINT,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content_hash TEXT NOT NULL,
    
    -- Индексы для быстрого поиска
    INDEX idx_message_duplicates_original (original_message_id),
    INDEX idx_message_duplicates_hash (content_hash),
    INDEX idx_message_duplicates_chat (duplicate_chat_id)
);

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

-- Создаем представление для удобного просмотра дубликатов с оригинальными сообщениями
CREATE OR REPLACE VIEW message_duplicates_view AS
SELECT 
    m.id as original_id,
    m.content as original_content,
    m.chat_name as original_chat,
    m.username as original_username,
    m.created_at as original_time,
    
    md.id as duplicate_id,
    md.duplicate_chat_name,
    md.duplicate_username,
    md.duplicate_user_first_name,
    md.duplicate_user_last_name,
    md.detected_at as duplicate_time,
    
    -- Подсчет общего количества дубликатов для данного сообщения
    COUNT(*) OVER (PARTITION BY m.id) as total_duplicates
    
FROM messages m
LEFT JOIN message_duplicates md ON m.id = md.original_message_id
WHERE md.id IS NOT NULL
ORDER BY m.created_at DESC, md.detected_at ASC;