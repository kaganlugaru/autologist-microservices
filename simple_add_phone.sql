-- 🔧 Упрощенный скрипт для добавления поля phone
-- Выполнить, если поле не добавилось с первого раза

-- 1. Проверяем существует ли таблица
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'recipient_categories';

-- 2. Добавляем поле phone (упрощенная версия)
ALTER TABLE recipient_categories 
ADD COLUMN phone VARCHAR(20);

-- 3. Проверяем что поле добавилось
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipient_categories' 
AND column_name = 'phone';