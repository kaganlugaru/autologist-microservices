const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanTestData() {
  console.log('🧹 Очистка тестовых данных...\n');

  try {
    // 1. Удаляем все тестовые сообщения
    console.log('1️⃣ Удаление всех сообщений...');
    const { data: deletedMessages, error: messagesError } = await supabase
      .from('messages')
      .delete()
      .neq('id', 0); // Удаляем все записи

    if (messagesError) {
      console.error('❌ Ошибка удаления сообщений:', messagesError);
    } else {
      console.log(`✅ Удалено сообщений: ${deletedMessages?.length || 0}`);
    }

    // 2. Удаляем все тестовые чаты (кроме реальных из Firebase)
    console.log('\n2️⃣ Удаление тестовых чатов...');
    
    // Список реальных чатов, которые нужно оставить
    const realChatIds = [
      '-1001208543145', // Груз Украина
      '-1001254956843', // Логистика Европа  
      '-1001627973435', // Груз Дальнобой
      '-1001631736811', // Дальнобой Форум
      '-1001678459958', // Грузоперевозки UA
      '-5063354364'     // Работа Водители
    ];

    const { data: deletedChats, error: chatsError } = await supabase
      .from('monitored_chats')
      .delete()
      .not('chat_id', 'in', `(${realChatIds.map(id => `'${id}'`).join(',')})`);

    if (chatsError) {
      console.error('❌ Ошибка удаления чатов:', chatsError);
    } else {
      console.log(`✅ Удалено тестовых чатов: ${deletedChats?.length || 0}`);
    }

    // 3. Удаляем все объявления
    console.log('\n3️⃣ Удаление объявлений...');
    const { data: deletedAnnouncements, error: announcementsError } = await supabase
      .from('announcements')
      .delete()
      .neq('id', 0);

    if (announcementsError) {
      console.error('❌ Ошибка удаления объявлений:', announcementsError);
    } else {
      console.log(`✅ Удалено объявлений: ${deletedAnnouncements?.length || 0}`);
    }

    // 4. Проверяем оставшиеся данные
    console.log('\n📊 Проверка оставшихся данных:');
    
    const { data: remainingChats } = await supabase
      .from('monitored_chats')
      .select('*');

    const { data: remainingMessages } = await supabase
      .from('messages')
      .select('*');

    const { data: remainingKeywords } = await supabase
      .from('keywords')
      .select('*');

    console.log(`📱 Чатов осталось: ${remainingChats?.length || 0}`);
    console.log(`💬 Сообщений осталось: ${remainingMessages?.length || 0}`);
    console.log(`🔍 Ключевых слов: ${remainingKeywords?.length || 0}`);

    if (remainingChats && remainingChats.length > 0) {
      console.log('\n📋 Оставшиеся чаты:');
      remainingChats.forEach(chat => {
        console.log(`  - ${chat.chat_name} (${chat.chat_id}) - ${chat.active ? '🟢 Активен' : '🔴 Неактивен'}`);
      });
    }

    console.log('\n✅ Очистка тестовых данных завершена!');
    console.log('🚀 Готово к работе с реальными Telegram чатами');

  } catch (error) {
    console.error('💥 Ошибка очистки:', error);
  }
}

// Запуск очистки
cleanTestData();