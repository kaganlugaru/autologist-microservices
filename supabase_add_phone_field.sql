-- 📱 Скрипт для добавления поля phone в таблицу recipient_categories
-- Выполнить в Supabase Dashboard → SQL Editor

-- 1. Добавляем поле phone в таблицу recipient_categories
ALTER TABLE recipient_categories 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 2. Добавляем комментарий к полю для документации
COMMENT ON COLUMN recipient_categories.phone IS 'Номер телефона получателя в формате +77771234567';

-- 3. Создаем индекс для быстрого поиска по номеру телефона
CREATE INDEX IF NOT EXISTS idx_recipient_categories_phone 
ON recipient_categories(phone);

-- 4. Добавляем constraint для проверки формата телефона (международный формат)
-- Сначала удаляем constraint если он существует, потом добавляем
ALTER TABLE recipient_categories 
DROP CONSTRAINT IF EXISTS chk_phone_format;

ALTER TABLE recipient_categories 
ADD CONSTRAINT chk_phone_format 
CHECK (phone IS NULL OR phone ~ '^\+[1-9]\d{1,14}$');

-- 5. Проверяем структуру таблицы после изменений
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'recipient_categories' 
ORDER BY ordinal_position;