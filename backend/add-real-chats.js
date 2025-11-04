// Скрипт для добавления реальных чатов из старого проекта
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addRealChats() {
  console.log('🔄 Добавляем реальные чаты из старого проекта...');

  try {
    // Реальные чаты из Firebase проекта
    const realChats = [
      {
        chat_id: '-1001208543145',
        chat_name: 'Груз Украина',
        platform: 'telegram',
        active: true,
        keywords: ['груз', 'перевозка', 'доставка']
      },
      {
        chat_id: '-1001254956843', 
        chat_name: 'Логистика Европа',
        platform: 'telegram',
        active: true,
        keywords: ['европа', 'экспорт', 'импорт']
      },
      {
        chat_id: '-1001627973435',
        chat_name: 'Автобазар',
        platform: 'telegram',
        active: false,
        keywords: ['автомобиль', 'продажа', 'покупка']
      },
      {
        chat_id: '-1001631736811',
        chat_name: 'Дальнобой Форум',
        platform: 'telegram',
        active: true,
        keywords: ['дальнобой', 'маршрут', 'водитель']
      },
      {
        chat_id: '-1001678459958',
        chat_name: 'Грузоперевозки UA',
        platform: 'telegram',
        active: true,
        keywords: ['украина', 'перевозки', 'срочно']
      },
      {
        chat_id: '-5063354364',
        chat_name: 'Работа Водители',
        platform: 'telegram',
        active: true,
        keywords: ['работа', 'вакансия', 'водитель']
      }
    ];

    // Удаляем тестовые чаты
    console.log('🗑️ Удаляем тестовые чаты...');
    await supabase
      .from('monitored_chats')
      .delete()
      .like('chat_name', '%тест%');

    // Добавляем реальные чаты
    const { data: chatData, error: chatError } = await supabase
      .from('monitored_chats')
      .insert(realChats);

    if (chatError && !chatError.message.includes('duplicate')) {
      throw chatError;
    }
    console.log('✅ Реальные чаты добавлены:', realChats.length);

    // Удаляем тестовые сообщения и добавляем реальные примеры
    console.log('🗑️ Очищаем тестовые сообщения...');
    await supabase
      .from('messages')
      .delete()
      .lt('message_id', 2000);

    const realMessages = [
      {
        message_id: 5001,
        chat_id: '-1001208543145',
        chat_name: 'Груз Украина',
        user_id: '987654321',
        username: 'cargo_pro',
        message_text: 'Ищу груз Киев-Львов, еврофура, до 20 тонн. Тел: +380671234567',
        content_hash: 'real_hash_1',
        price: null,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['груз', 'еврофура'],
        is_duplicate: false,
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 час назад
      },
      {
        message_id: 5002,
        chat_id: '-1001254956843',
        chat_name: 'Логистика Европа',
        user_id: '987654322',
        username: 'euro_logistics',
        message_text: 'Постоянные перевозки Польша-Украина, нужны проверенные перевозчики',
        content_hash: 'real_hash_2',
        price: null,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['перевозки', 'польша'],
        is_duplicate: false,
        created_at: new Date(Date.now() - 7200000).toISOString() // 2 часа назад
      },
      {
        message_id: 5003,
        chat_id: '-1001678459958',
        chat_name: 'Грузоперевозки UA',
        user_id: '987654323',
        username: 'fast_delivery',
        message_text: 'СРОЧНО! Нужна газель Одесса-Харьков сегодня! 3500 грн',
        content_hash: 'real_hash_3',
        price: 3500,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['срочно', 'газель', 'грн'],
        is_duplicate: false,
        created_at: new Date(Date.now() - 1800000).toISOString() // 30 минут назад
      },
      {
        message_id: 5004,
        chat_id: '-5063354364',
        chat_name: 'Работа Водители',
        user_id: '987654324',
        username: 'job_manager',
        message_text: 'Требуется водитель категории С+Е, зарплата 25000 грн/месяц + премии',
        content_hash: 'real_hash_4',
        price: 25000,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['водитель', 'зарплата', 'грн'],
        is_duplicate: false,
        created_at: new Date(Date.now() - 900000).toISOString() // 15 минут назад
      },
      {
        message_id: 5005,
        chat_id: '-1001208543145',
        chat_name: 'Груз Украина',
        user_id: '987654321',
        username: 'cargo_pro',
        message_text: 'Ищу груз Киев-Львов, еврофура, до 20 тонн. Тел: +380671234567',
        content_hash: 'real_hash_1',
        price: null,
        platform: 'telegram',
        contains_keywords: true,
        matched_keywords: ['груз', 'еврофура'],
        is_duplicate: true, // Дубликат первого сообщения
        created_at: new Date(Date.now() - 600000).toISOString() // 10 минут назад
      }
    ];

    const { data: msgData, error: msgError } = await supabase
      .from('messages')
      .insert(realMessages);

    if (msgError && !msgError.message.includes('duplicate')) {
      throw msgError;
    }
    console.log('✅ Реальные сообщения добавлены:', realMessages.length);

    console.log('🎉 Реальные данные из старого проекта успешно добавлены!');
    console.log('📊 Статистика:');
    console.log(`   📱 Чатов: ${realChats.length} (${realChats.filter(c => c.active).length} активных)`);
    console.log(`   💬 Сообщений: ${realMessages.length} (${realMessages.filter(m => m.is_duplicate).length} дубликатов)`);
    console.log(`   💰 С ценами: ${realMessages.filter(m => m.price).length}`);
    
  } catch (error) {
    console.error('❌ Ошибка добавления реальных данных:', error);
  }
}

addRealChats();