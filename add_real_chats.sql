-- Добавление реальных чатов из старого проекта
-- Выполните в Supabase SQL Editor

-- Очищаем тестовые данные
DELETE FROM monitored_chats WHERE platform = 'telegram';

-- Добавляем реальные чаты из discovered_chats.json
INSERT INTO monitored_chats (chat_id, chat_name, platform, active, keywords) VALUES
('-1001656314936', 'CarGoRuqsat', 'telegram', true, ARRAY['груз', 'перевозка', 'доставка']),
('-1001627973435', 'Чат Нур Жолы (Хоргос КНР)', 'telegram', true, ARRAY['груз', 'Китай', 'хоргос']),
('-1001631736811', 'Чат Калжат (Дулаты КНР)', 'telegram', true, ARRAY['груз', 'Китай', 'калжат']),
('-1001208543145', 'NUR JOLY Полутяги', 'telegram', true, ARRAY['полутяги', 'груз', 'перевозка']),
('-1001254956843', 'Нур Жолы актив', 'telegram', true, ARRAY['груз', 'актив', 'нур жолы']),
('-1002352511027', 'Канал событий', 'telegram', false, ARRAY['событие']);

-- Добавляем дополнительные ключевые слова для лучшей фильтрации
INSERT INTO keywords (keyword, category, active) VALUES
('хоргос', 'location', true),
('калжат', 'location', true),
('дулаты', 'location', true),
('нур жолы', 'company', true),
('полутяги', 'transport', true),
('актив', 'status', true),
('тонн', 'weight', true),
('паллет', 'cargo', true),
('контейнер', 'cargo', true),
('рефрижератор', 'transport', true),
('попутно', 'type', true),
('обратно', 'direction', true);

-- Проверяем что добавилось
SELECT chat_id, chat_name, active, array_length(keywords, 1) as keywords_count 
FROM monitored_chats 
WHERE platform = 'telegram' 
ORDER BY active DESC, chat_name;

SELECT COUNT(*) as total_keywords FROM keywords WHERE active = true;