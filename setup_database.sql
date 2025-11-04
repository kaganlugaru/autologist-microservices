-- ===============================================
-- SQL SETUP для Supabase: Autologist система
-- ===============================================
-- Выполните этот скрипт в SQL Editor в Supabase

-- 1. Создание основной таблицы для сообщений
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  
  -- Основные поля сообщения
  message_id TEXT NOT NULL,              -- ID сообщения в Telegram/WhatsApp
  chat_id TEXT NOT NULL,                 -- ID чата
  chat_name TEXT,                        -- Название чата
  user_id TEXT NOT NULL,                 -- ID пользователя
  username TEXT,                         -- Username пользователя
  message_text TEXT NOT NULL,            -- Текст сообщения
  
  -- Поля для дедупликации
  content_hash TEXT,                     -- Хеш текста без цифр (для дедупликации)
  price DECIMAL,                         -- Извлеченная цена
  is_duplicate BOOLEAN DEFAULT FALSE,    -- Флаг дубликата
  original_message_id BIGINT REFERENCES messages(id), -- Ссылка на оригинальное сообщение
  
  -- Метаданные
  platform TEXT CHECK (platform IN ('telegram', 'whatsapp')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Поля для ИИ обработки
  ai_processed BOOLEAN DEFAULT FALSE,    -- Обработано ли ИИ
  ai_structured_data JSONB,             -- Структурированные данные от ИИ
  
  -- Поля для фильтрации
  contains_keywords BOOLEAN DEFAULT FALSE, -- Содержит ключевые слова
  matched_keywords TEXT[],              -- Массив найденных ключевых слов
  
  -- Индексы для быстрого поиска
  UNIQUE(message_id, chat_id, platform)
);

-- 2. Создание таблицы для ключевых слов
CREATE TABLE keywords (
  id SERIAL PRIMARY KEY,
  keyword TEXT UNIQUE NOT NULL,
  category TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создание таблицы для отслеживаемых чатов
CREATE TABLE monitored_chats (
  id SERIAL PRIMARY KEY,
  chat_id TEXT NOT NULL,
  chat_name TEXT,
  platform TEXT CHECK (platform IN ('telegram', 'whatsapp')),
  active BOOLEAN DEFAULT TRUE,
  keywords TEXT[], -- Специфичные ключевые слова для этого чата
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(chat_id, platform)
);

-- 4. Создание таблицы для объявлений (рассылка)
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_chats TEXT[], -- Массив chat_id для рассылки
  status TEXT CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')) DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Создание индексов для производительности
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_content_hash ON messages(content_hash);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_keywords ON messages USING GIN(matched_keywords);
CREATE INDEX idx_messages_ai_processed ON messages(ai_processed);
CREATE INDEX idx_messages_platform ON messages(platform);

-- 6. Создание функции для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Создание триггеров
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at 
  BEFORE UPDATE ON announcements 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Вставка начальных данных (ключевые слова)
INSERT INTO keywords (keyword, category) VALUES
('груз', 'cargo'),
('доставка', 'delivery'),
('перевозка', 'transport'),
('Китай', 'location'),
('Москва', 'location'),
('срочно', 'urgency'),
('горячий', 'urgency'),
('цена', 'price'),
('стоимость', 'price');

-- 9. Включение RLS (Row Level Security) для безопасности
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitored_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 10. Создание политик RLS (разрешить все для авторизованных пользователей)
CREATE POLICY "Enable all operations for authenticated users" ON messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON keywords
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON monitored_chats
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON announcements
  FOR ALL USING (auth.role() = 'authenticated');

-- ===============================================
-- Готово! Теперь скопируйте Connection String
-- из Settings > Database в Supabase
-- ===============================================