-- Добавляем поле phone в таблицу recipient_categories
ALTER TABLE recipient_categories 
ADD COLUMN phone VARCHAR(20);

-- Создаем индекс для поиска по номеру телефона
CREATE INDEX idx_recipient_categories_phone ON recipient_categories(phone);

-- Добавляем комментарий к полю
COMMENT ON COLUMN recipient_categories.phone IS 'Номер телефона получателя в формате +XXXXXXXXXX';

-- Обновляем существующие записи (если нужно)
-- UPDATE recipient_categories SET phone = '+' || username WHERE username ~ '^[0-9]+$';