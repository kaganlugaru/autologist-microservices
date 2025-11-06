-- 🔍 Проверка: есть ли поле phone в таблице recipient_categories
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recipient_categories' 
AND column_name = 'phone';

-- Если результат пустой - поле не добавилось
-- Если есть строка - поле добавлено успешно