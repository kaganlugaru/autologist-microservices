// Простой тест подключения к Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function simpleTest() {
  console.log('🔗 Простой тест Supabase подключения...\n');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  console.log('URL:', supabaseUrl);
  console.log('Service Key:', supabaseKey ? `${supabaseKey.substring(0, 30)}...` : 'ОТСУТСТВУЕТ');
  console.log('Anon Key:', process.env.SUPABASE_ANON_KEY ? `${process.env.SUPABASE_ANON_KEY.substring(0, 30)}...` : 'ОТСУТСТВУЕТ');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Отсутствуют переменные окружения');
    return;
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Клиент создан');
    
    // Простой запрос
    console.log('📡 Выполняем запрос...');
    const { data, error } = await supabase
      .from('keywords')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Ошибка запроса:', error);
    } else {
      console.log('✅ Запрос успешен!');
      console.log('📊 Данные:', data);
    }
    
  } catch (error) {
    console.error('❌ Критическая ошибка:', error);
  }
}

simpleTest();