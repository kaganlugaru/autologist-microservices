const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Отсутствуют переменные окружения SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addRealTelegramChats() {
  console.log('📱 Добавление реальных Telegram чатов в базу данных...\n');

  try {
    // Читаем файл с реальными чатами
    const chatsFile = '../telegram-parser/real_telegram_chats.json';
    
    if (!fs.existsSync(chatsFile)) {
      console.error('❌ Файл real_telegram_chats.json не найден');
      console.log('💡 Сначала запустите: python telegram-parser/real-telegram-client.py');
      return;
    }

    const chatsData = JSON.parse(fs.readFileSync(chatsFile, 'utf8'));
    console.log(`📊 Загружен файл с ${chatsData.total_chats} чатами`);
    console.log(`🚛 Из них связанных с грузоперевозками: ${chatsData.cargo_related}`);

    // Фильтруем чаты для добавления
    const relevantChats = chatsData.chats.filter(chat => {
      // Добавляем только чаты связанные с грузоперевозками ИЛИ большие группы (>1000 участников)
      return chat.is_cargo_related || chat.participants_count > 1000;
    });

    console.log(`\n✅ Отобрано для добавления: ${relevantChats.length} чатов\n`);

    // Добавляем чаты в базу
    let added = 0;
    let skipped = 0;

    for (const chat of relevantChats) {
      try {
        // Проверяем, есть ли уже такой чат
        const { data: existingChat } = await supabase
          .from('monitored_chats')
          .select('id')
          .eq('chat_id', chat.id.toString())
          .single();

        if (existingChat) {
          console.log(`⏭️  Пропускаем: ${chat.title} (уже существует)`);
          skipped++;
          continue;
        }

        // Добавляем новый чат
        const { data, error } = await supabase
          .from('monitored_chats')
          .insert({
            chat_id: chat.id.toString(),
            chat_name: chat.title,
            platform: 'telegram',
            active: chat.is_cargo_related, // Активируем только грузовые чаты
            added_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Ошибка добавления ${chat.title}:`, error.message);
        } else {
          const status = chat.is_cargo_related ? '🚛' : '💬';
          const activeStatus = data.active ? '🟢' : '🔴';
          console.log(`${status} ${activeStatus} Добавлен: ${chat.title}`);
          console.log(`   👥 ${chat.participants_count.toLocaleString()} участников, ID: ${chat.id}`);
          added++;
        }

      } catch (err) {
        console.error(`💥 Ошибка обработки ${chat.title}:`, err.message);
      }
    }

    console.log(`\n📊 Результат:`);
    console.log(`✅ Добавлено: ${added} чатов`);
    console.log(`⏭️  Пропущено: ${skipped} чатов`);

    // Показываем финальную статистику
    const { data: allChats } = await supabase
      .from('monitored_chats')
      .select('*');

    const { data: allMessages } = await supabase
      .from('messages')
      .select('*');

    console.log(`\n📈 Общая статистика базы данных:`);
    console.log(`📱 Всего чатов в мониторинге: ${allChats?.length || 0}`);
    console.log(`🟢 Активных чатов: ${allChats?.filter(c => c.active).length || 0}`);
    console.log(`💬 Всего сообщений: ${allMessages?.length || 0}`);

    if (allChats && allChats.length > 0) {
      console.log(`\n📋 Список активных чатов:`);
      allChats
        .filter(chat => chat.active)
        .forEach(chat => {
          console.log(`  🟢 ${chat.chat_name} (${chat.chat_id})`);
        });
    }

    console.log('\n🎉 Готово! Реальные Telegram чаты добавлены в систему');

  } catch (error) {
    console.error('💥 Ошибка:', error);
  }
}

// Запуск добавления
addRealTelegramChats();