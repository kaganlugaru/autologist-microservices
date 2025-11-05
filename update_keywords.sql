-- Обновление всех ключевых слов для присвоения категории "грузоперевозки"
UPDATE keywords 
SET category = 'грузоперевозки' 
WHERE category IS NULL OR category = '';

-- Проверим результат
SELECT * FROM keywords;