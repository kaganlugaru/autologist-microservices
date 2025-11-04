-- Исправление регистра ключевых слов в таблице получателей
-- Выполните этот SQL в Supabase Dashboard -> SQL Editor

UPDATE message_recipients SET keyword = 'доставка' WHERE keyword = 'доставка';
UPDATE message_recipients SET keyword = 'перевозка' WHERE keyword = 'перевозка';
UPDATE message_recipients SET keyword = 'китай' WHERE keyword = 'Китай';
UPDATE message_recipients SET keyword = 'москва' WHERE keyword = 'Москва';
UPDATE message_recipients SET keyword = 'горячий' WHERE keyword = 'горячий';
UPDATE message_recipients SET keyword = 'стоимость' WHERE keyword = 'стоимость';

-- Проверяем результат
SELECT keyword, COUNT(*) as count FROM message_recipients GROUP BY keyword ORDER BY keyword;

-- Должно показать:
-- горячий    1
-- доставка   1
-- китай      1
-- москва     1
-- перевозка  1
-- стоимость  1