-- Создание представления для удобного просмотра дубликатов с оригинальными сообщениями
-- Выполняйте этот SQL ПОСЛЕ создания таблицы message_duplicates

CREATE OR REPLACE VIEW message_duplicates_view AS
SELECT 
    m.id as original_id,
    m.message_text as original_content,
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