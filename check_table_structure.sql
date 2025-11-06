-- Проверка структуры таблицы recipient_categories
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'recipient_categories' 
ORDER BY ordinal_position;

-- Проверка ограничений таблицы
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    confupdtype,
    confdeltype,
    confmatchtype
FROM pg_constraint 
WHERE conrelid = 'recipient_categories'::regclass;