-- Добавление тестовых чатов в базу данных
INSERT INTO monitored_chats (chat_id, chat_name, chat_type, platform, is_active, added_date) VALUES 
(-1001234567890, 'Грузоперевозки Украина', 'supergroup', 'telegram', true, NOW()),
(-1001234567891, 'Логистика Европа', 'supergroup', 'telegram', true, NOW()),
(-1001234567892, 'Автобазар Киев', 'supergroup', 'telegram', false, NOW()),
(-1001234567893, 'Дальнобой Форум', 'supergroup', 'telegram', true, NOW()),
(-1001234567894, 'Грузчики и Водители', 'supergroup', 'telegram', true, NOW())
ON CONFLICT (chat_id) DO NOTHING;

-- Добавление тестовых сообщений
INSERT INTO messages (
  message_id, chat_id, chat_name, user_id, username, 
  message_text, content_hash, price, platform, 
  contains_keywords, matched_keywords, is_duplicate, created_at
) VALUES 
(1001, -1001234567890, 'Грузоперевозки Украина', 123456789, 'driver_alex', 
 'Нужен груз из Киева в Львов, до 5 тонн, срочно!', 'hash1', NULL, 'telegram', 
 true, '["срочно", "груз"]', false, NOW() - INTERVAL '2 hours'),

(1002, -1001234567890, 'Грузоперевозки Украина', 123456790, 'cargo_man', 
 'Перевозка мебели Одесса-Харьков, 2000 грн', 'hash2', 2000, 'telegram', 
 true, '["мебель", "перевозка"]', false, NOW() - INTERVAL '1 hour'),

(1003, -1001234567891, 'Логистика Европа', 123456791, 'euro_driver', 
 'Маршрут Польша-Германия, есть место 10 тонн', 'hash3', NULL, 'telegram', 
 true, '["маршрут"]', false, NOW() - INTERVAL '30 minutes'),

(1004, -1001234567890, 'Грузоперевозки Украина', 123456789, 'driver_alex', 
 'Нужен груз из Киева в Львов, до 5 тонн, срочно!', 'hash1', NULL, 'telegram', 
 true, '["срочно", "груз"]', true, NOW() - INTERVAL '10 minutes'),

(1005, -1001234567894, 'Грузчики и Водители', 123456792, 'work_man', 
 'Требуются грузчики на склад, 500 грн/день', 'hash4', 500, 'telegram', 
 true, '["грузчики"]', false, NOW() - INTERVAL '5 minutes')

ON CONFLICT (message_id, chat_id) DO NOTHING;