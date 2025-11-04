// Скрипт для добавления тестовых данных в Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addTestData() {
  console.log('🔄 Добавляем тестовые данные...');

  try {
    // Добавляем тестовые чаты
    const chats = [
      {
        chat_id: '-1001234567890',
        chat_name: 'Грузоперевозки Украина',
        platform: 'telegram',
        active: true
      },
      {
        chat_id: '-1001234567891', 
        chat_name: 'Логистика Европа',
        platform: 'telegram',
        active: true
      },
      {
        chat_id: '-1001234567892',
        chat_name: 'Автобазар Киев',
        platform: 'telegram',
        active: false
      },
      {
        chat_id: '-1001234567893',
        chat_name: 'Дальнобой Форум',
        platform: 'telegram',
        active: true
      },
      {
        chat_id: '-1001234567894',
        chat_name: 'Грузчики и Водители',
        platform: 'telegram',
        active: true
      }
    ];

    const { data: chatData, error: chatError } = await supabase
      .from('monitored_chats')
      .insert(chats);

    if (chatError && !chatError.message.includes('duplicate')) {
      throw chatError;
    }
    console.log('✅ Чаты добавлены:', chats.length);

    // Добавляем тестовые сообщения
    const messages = [
      {
        message_id: 1001,
        chat_id: '-1001234567890',
        chat_name: 'Грузоперевозки Украина',
        user_id: '123456789',
        username: 'driver_alex',
        message_text: 'Нужен груз из Киева в Львов, до 5 тонн, срочно!',
        content_hash: 'hash1',
        price: null,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['срочно', 'груз'],
        is_duplicate: false
      },
      {
        message_id: 1002,
        chat_id: '-1001234567890', 
        chat_name: 'Грузоперевозки Украина',
        user_id: '123456790',
        username: 'cargo_man',
        message_text: 'Перевозка мебели Одесса-Харьков, 2000 грн',
        content_hash: 'hash2',
        price: 2000,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['мебель', 'перевозка'],
        is_duplicate: false
      },
      {
        message_id: 1003,
        chat_id: '-1001234567891',
        chat_name: 'Логистика Европа',
        user_id: '123456791',
        username: 'euro_driver', 
        message_text: 'Маршрут Польша-Германия, есть место 10 тонн',
        content_hash: 'hash3',
        price: null,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['маршрут'],
        is_duplicate: false
      },
      {
        message_id: 1004,
        chat_id: '-1001234567890',
        chat_name: 'Грузоперевозки Украина',
        user_id: '123456789',
        username: 'driver_alex',
        message_text: 'Нужен груз из Киева в Львов, до 5 тонн, срочно!',
        content_hash: 'hash1',
        price: null,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['срочно', 'груз'],
        is_duplicate: true
      },
      {
        message_id: 1005,
        chat_id: '-1001234567894',
        chat_name: 'Грузчики и Водители',
        user_id: '123456792',
        username: 'work_man',
        message_text: 'Требуются грузчики на склад, 500 грн/день',
        content_hash: 'hash4',
        price: 500,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['грузчики'],
        is_duplicate: false
      }
    ];

    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert(messages);

    if (msgError && !msgError.message.includes('duplicate')) {
      throw msgError;
    }
    console.log('✅ Сообщения добавлены:', messages.length);

    console.log('🎉 Тестовые данные успешно добавлены!');
    
  } catch (error) {
    console.error('❌ Ошибка добавления данных:', error);
  }
}

addTestData();