-- Временное отключение RLS для тестирования
-- Выполните этот скрипт в SQL Editor Supabase

-- Отключаем RLS для тестирования
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_chats DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- Или создадим более мягкие политики
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON messages;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON keywords;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON monitored_chats;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON announcements;

-- Включаем RLS обратно
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Создаем политики, которые разрешают все операции для service_role
CREATE POLICY "Allow all for service role" ON messages
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all for service role" ON keywords
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all for service role" ON monitored_chats
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow all for service role" ON announcements
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Разрешаем чтение для анонимных пользователей
CREATE POLICY "Allow read for anon" ON keywords
  FOR SELECT USING (true);

CREATE POLICY "Allow read for anon" ON monitored_chats
  FOR SELECT USING (true);