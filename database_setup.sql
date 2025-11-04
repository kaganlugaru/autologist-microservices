-- База данных для системы автоматизации грузоперевозок
-- Создайте эти таблицы в SQL Editor вашего Supabase проекта

-- Основная таблица сообщений
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  message_text TEXT NOT NULL,
  message_hash TEXT, -- Хеш для дедупликации (без цифр)
  chat_id TEXT NOT NULL,
  chat_name TEXT,
  chat_type TEXT, -- 'telegram' или 'whatsapp'
  user_id TEXT NOT NULL,
  username TEXT,
  price DECIMAL,
  location_from TEXT,
  location_to TEXT,
  cargo_type TEXT,
  urgency INTEGER DEFAULT 0,
  is_duplicate BOOLEAN DEFAULT FALSE,
  original_message_id BIGINT, -- Ссылка на оригинальное сообщение при дедупликации
  keywords_matched TEXT[], -- Массив найденных ключевых слов
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_date TIMESTAMP WITH TIME ZONE -- Время оригинального сообщения
);

-- Таблица ключевых слов для фильтрации
CREATE TABLE keywords (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  category TEXT, -- категория ключевого слова (груз, место, срочность)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица уведомлений
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT REFERENCES messages(id),
  keyword TEXT NOT NULL,
  sent_to_telegram BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  telegram_message_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица объявлений для рассылки
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_chats TEXT[], -- Массив ID чатов для рассылки
  send_immediately BOOLEAN DEFAULT FALSE,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sent', 'cancelled'
  sent_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Таблица логов отправки объявлений
CREATE TABLE announcement_logs (
  id BIGSERIAL PRIMARY KEY,
  announcement_id INTEGER REFERENCES announcements(id),
  chat_id TEXT NOT NULL,
  chat_name TEXT,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации производительности
CREATE INDEX idx_messages_hash ON messages(message_hash);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_keywords ON messages USING GIN(keywords_matched);
CREATE INDEX idx_notifications_sent ON notifications(sent_to_telegram);
CREATE INDEX idx_announcements_status ON announcements(status);

-- Начальные ключевые слова
INSERT INTO keywords (keyword, category) VALUES 
('груз', 'cargo'),
('доставка', 'cargo'),
('транспорт', 'cargo'),
('перевозка', 'cargo'),
('срочно', 'urgency'),
('горячий', 'urgency'),
('Москва', 'location'),
('СПб', 'location'),
('Питер', 'location'),
('Китай', 'location'),
('Гуанчжоу', 'location'),
('Шанхай', 'location');

-- Функция для создания хеша сообщения (без цифр)
CREATE OR REPLACE FUNCTION create_message_hash(input_text TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- Удаляем все цифры и создаем хеш
  RETURN md5(regexp_replace(lower(input_text), '\d', '', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Функция для извлечения цены из текста
CREATE OR REPLACE FUNCTION extract_price(input_text TEXT) 
RETURNS DECIMAL AS $$
DECLARE
  price_match TEXT;
BEGIN
  -- Простое извлечение числа (можно улучшить регулярными выражениями)
  price_match := (regexp_matches(input_text, '(\d+(?:\.\d+)?)', 'g'))[1];
  
  IF price_match IS NOT NULL THEN
    RETURN price_match::DECIMAL;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;