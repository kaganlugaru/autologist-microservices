import React from 'react';
import KeywordsManagerCompact from './KeywordsManagerCompact';
import './Management.css';

export default function Management({ keywords = [], apiBase, onUpdate }) {
  return (
    <div className="management">
      <div className="management-header">
        <h2>Управление системой</h2>
        <p>Настройка ключевых слов и получателей уведомлений</p>
      </div>

      <div className="management-panels">
        {/* КЛЮЧЕВЫЕ СЛОВА */}
        <div className="management-panel">
          <div className="panel-header">
            <h3>🔑 Ключевые слова ({keywords.length})</h3>
          </div>
          <KeywordsManagerCompact 
            keywords={keywords}
            apiBase={apiBase}
            onUpdate={onUpdate}
          />
        </div>

        {/* ПОЛУЧАТЕЛИ РАССЫЛКИ */}
        <div className="management-panel">
          <div className="panel-header">
            <h3>📧 Получатели рассылки</h3>
          </div>
          <div className="recipients-section">
            <div className="info-message">
              <p>📋 Быстрое добавление получателей:</p>
              <div className="recipient-fields">
                <div className="field-group">
                  <label>Имя</label>
                  <input type="text" placeholder="Введите имя получателя" />
                </div>
                <div className="field-group">
                  <label>Телефон</label>
                  <input type="tel" placeholder="+7 777 777 77 77" />
                </div>
                <button className="btn-add-recipient">Добавить</button>
              </div>
            </div>

            <div className="recipients-list">
              <h4>📋 Список получателей:</h4>
              <div className="recipient-item">
                <span>• Логист GL +77771561636</span>
                <button className="btn-remove">❌</button>
              </div>
              <div className="recipient-item">
                <span>• Ринат +77015888280</span>
                <button className="btn-remove">❌</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};