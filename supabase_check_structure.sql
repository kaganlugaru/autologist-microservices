-- 🔍 Диагностика структуры базы данных
-- Выполнить в Supabase SQL Editor для проверки

-- 1. Проверяем существование таблицы categories
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('categories', 'recipient_categories', 'keywords');

-- 2. Проверяем структуру таблицы categories (если существует)
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'categories' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Проверяем данные в categories
SELECT * FROM categories LIMIT 10;

-- 4. Проверяем структуру recipient_categories
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'recipient_categories' 
    AND table_schema = 'public'
ORDER BY ordinal_position;