-- SQL для создания таблицы all_chats
CREATE TABLE IF NOT EXISTS all_chats (
  chat_id BIGINT PRIMARY KEY,
  chat_name TEXT,
  active BOOL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);