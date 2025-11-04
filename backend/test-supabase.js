// Простой тест подключения к Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testSupabase() {
  console.log('🔍 SUPABASE_URL:', process.env.SUPABASE_URL ? 'есть' : 'отсутствует');
  console.log('🔍 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'есть' : 'отсутствует');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Отсутствуют переменные окружения');
    return;
  }
  
  // Попробуем сначала с anon ключом
  console.log('🔄 Тестирую с ANON ключом...');
  const supabaseAnon = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  console.log('🔄 Тестирую с SERVICE_ROLE ключом...');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    console.log('🔄 Проверяю аутентификацию...');
    
    // Самый простой тест - получить пользователя
    const { data: authData, error: authError } = await supabaseAnon.auth.getUser();
    console.log('🔐 Auth test result:', authError ? authError.message : 'OK');
    
    // Попробуем получить сессию
    const { data: sessionData, error: sessionError } = await supabaseAnon.auth.getSession();
    console.log('🔐 Session test result:', sessionError ? sessionError.message : 'OK');
    
    console.log('🔄 Проверяю простой RPC вызов...');
    
    // Попробуем вызвать встроенную функцию
    const { data: versionData, error: versionError } = await supabaseAnon.rpc('version');
    console.log('📞 Version RPC result:', versionError ? versionError.message : versionData);
    
    console.log('🔄 Проверяю доступ к таблице keywords...');
    
    // Тест с anon ключом
    let { data: anonData, error: anonError } = await supabaseAnon
      .from('keywords')
      .select('count', { count: 'exact', head: true });
    
    if (anonError) {
      console.error('❌ ANON ключ - ошибка:', anonError.message);
      console.error('❌ ANON ключ - код:', anonError.code);
      console.error('❌ ANON ключ - детали:', anonError.details);
    } else {
      console.log('✅ ANON ключ работает!');
    }
    
    console.log('🔄 Проверяю доступ с SERVICE_ROLE ключом...');
    
    // Тест с service_role ключом  
    let { data, error } = await supabase
      .from('keywords')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ SERVICE_ROLE - ошибка запроса к базе:', error.message);
      console.error('❌ SERVICE_ROLE - код ошибки:', error.code);
      console.error('❌ SERVICE_ROLE - подробности:', error.details);
    } else {
      console.log('✅ SERVICE_ROLE ключ работает!');
      console.log('📋 Подключение к таблице keywords успешно');
    }
  } catch (err) {
    console.error('❌ Критическая ошибка:', err.message);
  }
}

testSupabase();