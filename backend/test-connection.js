// backend/test-connection.js
// Тестовый скрипт для проверки соединения с базой данных
require('dotenv').config();
const DatabaseManager = require('../shared/database');

async function testDatabase() {
  console.log('🧪 Тестирование подключения к базе данных...\n');
  
  try {
    // Инициализация
    const db = new DatabaseManager();
    console.log('✅ DatabaseManager инициализирован');
    
    // Проверка соединения
    const connectionTest = await db.testConnection();
    console.log('🔗 Тест соединения:', connectionTest);
    
    if (!connectionTest.success) {
      throw new Error('Соединение с БД не установлено');
    }
    
    // Тест получения ключевых слов
    console.log('\n📝 Тест получения ключевых слов...');
    const keywords = await db.getKeywords();
    console.log('✅ Ключевые слова:', keywords);
    
    // Тест получения отслеживаемых чатов
    console.log('\n💬 Тест получения отслеживаемых чатов...');
    const chats = await db.getMonitoredChats();
    console.log('✅ Отслеживаемые чаты:', chats.length, 'шт.');
    
    // Тест получения сообщений
    console.log('\n📨 Тест получения сообщений...');
    const messages = await db.getRecentMessages(5);
    console.log('✅ Последние сообщения:', messages.length, 'шт.');
    
    console.log('\n🎉 Все тесты прошли успешно!');
    console.log('💡 Можно запускать backend: npm start');
    
  } catch (error) {
    console.error('\n❌ Ошибка тестирования:', error.message);
    console.log('\n🔧 Проверьте:');
    console.log('1. Переменные окружения в .env файле');
    console.log('2. Выполнен ли setup_database.sql в Supabase');
    console.log('3. Правильность SUPABASE_URL и SUPABASE_ANON_KEY');
    process.exit(1);
  }
}

// Запуск тестов
testDatabase();