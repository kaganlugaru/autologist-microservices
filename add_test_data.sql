-- Добавление тестовых чатов для мониторинга
-- Выполните в Supabase SQL Editor

-- Добавляем несколько тестовых чатов
INSERT INTO monitored_chats (chat_id, chat_name, platform, active) VALUES
('-1001234567890', 'Тестовый грузовой чат', 'telegram', true),
('-1001987654321', 'Логистика и перевозки', 'telegram', true);

-- Добавляем дополнительные ключевые слова
INSERT INTO keywords (keyword, category, active) VALUES
('автомобиль', 'transport', true),
('фура', 'transport', true),
('тонник', 'transport', true),
('паллет', 'cargo', true),
('контейнер', 'cargo', true),
('склад', 'location', true),
('терминал', 'location', true),
('загрузка', 'action', true),
('выгрузка', 'action', true),
('маршрут', 'route', true);

-- Проверяем что добавилось
SELECT * FROM monitored_chats WHERE platform = 'telegram';
SELECT * FROM keywords WHERE active = true;