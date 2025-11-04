# 🚀 Быстрая настройка отправки уведомлений

## Что нужно сделать

### 1. Создать таблицу в Supabase (1 минута!)

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект 
3. Перейдите в **SQL Editor**
4. Скопируйте и выполните этот SQL код:

```sql
-- ПРОСТАЯ ВЕРСИЯ: Создание таблицы получателей и добавление KGN
DROP TABLE IF EXISTS message_recipients;

CREATE TABLE message_recipients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    keyword VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recipients_keyword ON message_recipients(keyword);
CREATE INDEX idx_recipients_username ON message_recipients(username);
CREATE INDEX idx_recipients_active ON message_recipients(active);
CREATE UNIQUE INDEX unique_recipient_keyword ON message_recipients(username, keyword);

-- Добавляем KGN для всех ключевых слов
INSERT INTO message_recipients (name, username, keyword, active) VALUES
('KGN', 'Rinat575kz', 'доставка', true),
('KGN', 'Rinat575kz', 'перевозка', true),
('KGN', 'Rinat575kz', 'Китай', true),
('KGN', 'Rinat575kz', 'Москва', true),
('KGN', 'Rinat575kz', 'горячий', true),
('KGN', 'Rinat575kz', 'стоимость', true);

ALTER TABLE message_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for message_recipients" ON message_recipients
FOR ALL USING (true) WITH CHECK (true);

SELECT 'Таблица создана успешно!' as status;
SELECT name, username, keyword, active FROM message_recipients;
```

### 2. Готово! Проверьте работу

После выполнения SQL:

1. **Во вкладке "⚙️ Управление"** появится секция "📤 Управление получателями уведомлений"
2. **Отправьте тест:** напишите в чат "тест автологист" сообщение: "нужна доставка из Китая"
3. **Парсер автоматически отправит уведомление** пользователю @Rinat575kz

## 📱 Как добавить других получателей

В интерфейсе "⚙️ Управление":
- Введите **Имя** и **Username** (без @)
- Нажмите **"Добавить для всех ключевых слов"**
- Получатель будет автоматически добавлен для всех активных ключевых слов

## ✅ Результат

Теперь при обнаружении любого ключевого слова в сообщениях парсер будет автоматически отправлять уведомления всем настроенным получателям!