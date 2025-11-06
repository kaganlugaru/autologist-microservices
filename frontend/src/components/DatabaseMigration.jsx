import React, { useState } from 'react';
import axios from 'axios';

export default function DatabaseMigration({ apiBase }) {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const runMigration = async () => {
    try {
      setMigrating(true);
      setResult(null);

      const response = await axios.post(`${apiBase}/migrate-phone-field`);
      
      if (response.data.success) {
        setResult({ type: 'success', message: 'Миграция выполнена успешно' });
      } else {
        setResult({ type: 'error', message: response.data.error || 'Ошибка миграции' });
      }
    } catch (error) {
      setResult({ type: 'error', message: 'Ошибка выполнения миграции' });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="migration-panel">
      <h4>🔧 Миграция базы данных</h4>
      <p>Добавление поля номера телефона для получателей</p>
      
      <button 
        onClick={runMigration}
        disabled={migrating}
        className="btn btn-primary"
      >
        {migrating ? 'Выполняется...' : 'Запустить миграцию'}
      </button>

      {result && (
        <div className={`migration-result ${result.type}`}>
          {result.type === 'success' ? '✅' : '❌'} {result.message}
        </div>
      )}
    </div>
  );
}