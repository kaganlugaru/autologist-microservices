import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Statistics({ stats = {}, messages = [], chats = [], onUpdate, apiBase }) {
  // Подготовка данных для графиков
  const messagesByDate = messages.reduce((acc, msg) => {
    const date = new Date(msg.created_at).toLocaleDateString('ru-RU');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(messagesByDate).map(([date, count]) => ({
    date,
    count
  })).slice(-7); // Последние 7 дней

  const duplicateData = [
    { name: 'Новые', value: messages.filter(m => !m.is_duplicate).length, color: '#22c55e' },
    { name: 'Дубликаты', value: messages.filter(m => m.is_duplicate).length, color: '#ef4444' }
  ];

  const chatStats = chats.map(chat => {
    const chatMessages = messages.filter(m => m.chat_id === chat.chat_id);
    return {
      name: chat.chat_name.length > 20 ? chat.chat_name.slice(0, 20) + '...' : chat.chat_name,
      messages: chatMessages.length,
      duplicates: chatMessages.filter(m => m.is_duplicate).length,
      active: chat.active
    };
  }).sort((a, b) => b.messages - a.messages);

  const keywordStats = messages.reduce((acc, msg) => {
    if (msg.matched_keywords) {
      msg.matched_keywords.forEach(keyword => {
        acc[keyword] = (acc[keyword] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const topKeywords = Object.entries(keywordStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([keyword, count]) => ({ keyword, count }));

  const totalMessages = messages.length;
  const totalDuplicates = messages.filter(m => m.is_duplicate).length;
  const totalKeywordMatches = messages.filter(m => m.contains_keywords).length;
  const activeChats = chats.filter(c => c.active).length;

  return (
    <div className="statistics">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📨</div>
          <div className="stat-content">
            <h3>{totalMessages}</h3>
            <p>Всего сообщений</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{totalMessages - totalDuplicates}</h3>
            <p>Новых сообщений</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <h3>{totalDuplicates}</h3>
            <p>Дубликатов</p>
            <small>{totalMessages > 0 ? Math.round((totalDuplicates / totalMessages) * 100) : 0}%</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <h3>{totalKeywordMatches}</h3>
            <p>С ключевыми словами</p>
            <small>{totalMessages > 0 ? Math.round((totalKeywordMatches / totalMessages) * 100) : 0}%</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{activeChats}</h3>
            <p>Активных чатов</p>
            <small>из {chats.length}</small>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>📊 Сообщения по дням</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>🥧 Новые vs Дубликаты</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={duplicateData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {duplicateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>💬 Активность чатов</h3>
          <div className="chat-stats-list">
            {chatStats.slice(0, 10).map((chat, index) => (
              <div key={index} className="chat-stat-item">
                <div className="chat-stat-name">
                  <span className={`status ${chat.active ? 'active' : 'inactive'}`}>
                    {chat.active ? '🟢' : '🔴'}
                  </span>
                  {chat.name}
                </div>
                <div className="chat-stat-numbers">
                  <span className="total">{chat.messages}</span>
                  <span className="duplicates">({chat.duplicates} дубл.)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3>🔍 Топ ключевых слов</h3>
          <div className="keyword-stats-list">
            {topKeywords.map((item, index) => (
              <div key={index} className="keyword-stat-item">
                <span className="keyword">{item.keyword}</span>
                <span className="count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}