const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testTelegramAPI() {
  console.log('🧪 Тестирование Telegram API эндпоинтов...\n');

  try {
    // Тест 1: Получение доступных чатов
    console.log('1️⃣ Тестирую /api/telegram/chats');
    try {
      const chatsResponse = await axios.get(`${API_BASE}/telegram/chats`);
      console.log('✅ Статус:', chatsResponse.status);
      console.log('📊 Данные:', JSON.stringify(chatsResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Ошибка:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Тест 2: Проверка доступности чатов
    console.log('2️⃣ Тестирую /api/telegram/check-chats');
    try {
      const checkResponse = await axios.get(`${API_BASE}/telegram/check-chats`);
      console.log('✅ Статус:', checkResponse.status);
      console.log('📊 Данные:', JSON.stringify(checkResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Ошибка:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Тест 3: Получение обычных чатов для сравнения
    console.log('3️⃣ Тестирую /api/chats (для сравнения)');
    try {
      const normalChatsResponse = await axios.get(`${API_BASE}/chats`);
      console.log('✅ Статус:', normalChatsResponse.status);
      console.log('📊 Количество чатов:', normalChatsResponse.data.data?.length || 0);
      console.log('📝 Чаты:', normalChatsResponse.data.data?.map(c => ({
        id: c.id,
        name: c.chat_name,
        chat_id: c.chat_id,
        active: c.active
      })) || []);
    } catch (error) {
      console.log('❌ Ошибка:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('💥 Общая ошибка тестирования:', error.message);
  }
}

// Запуск тестов
testTelegramAPI();