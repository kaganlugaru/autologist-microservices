import React, { useState, useEffect } from 'react';
import './RecipientsManager.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const RecipientsManager = () => {
    const [recipients, setRecipients] = useState([]);
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Форма для добавления нового получателя
    const [newRecipient, setNewRecipient] = useState({
        name: '',
        username: '',
        category: '',
        active: true
    });

    useEffect(() => {
        loadRecipients();
        loadKeywords();
    }, []);

    const loadRecipients = async () => {
        try {
            setLoading(true);
            // Используем новый API endpoint для категорий
            const response = await fetch(`${API_BASE}/recipient-categories`);
            if (response.ok) {
                const result = await response.json();
                setRecipients(result.data || []);
            } else {
                setError('Ошибка загрузки получателей');
            }
        } catch (err) {
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    const loadKeywords = async () => {
        try {
            const response = await fetch(`${API_BASE}/keywords`);
            if (response.ok) {
                const result = await response.json();
                setKeywords(result.data || []);
            }
        } catch (err) {
            console.error('Ошибка загрузки ключевых слов:', err);
        }
    };

    const addRecipient = async (e) => {
        e.preventDefault();
        
        // Проверяем обязательные поля (теперь категория вместо конкретного ключевого слова)
        if (!newRecipient.name || !newRecipient.username || !newRecipient.category) {
            setError('Заполните все обязательные поля: имя, username, категория');
            return;
        }

        try {
            setLoading(true);
            // Отправляем данные в новый API endpoint для категорий
            const response = await fetch(`${API_BASE}/recipient-categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: newRecipient.name,
                    username: newRecipient.username,
                    category: newRecipient.category,
                    active: newRecipient.active
                }),
            });

            if (response.ok) {
                setSuccess('Получатель добавлен успешно');
                setNewRecipient({
                    name: '',
                    username: '',
                    category: '',
                    active: true
                });
                loadRecipients();
                setTimeout(() => setSuccess(''), 3000);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Ошибка добавления получателя');
            }
        } catch (err) {
            setError('Ошибка подключения к серверу');
        } finally {
            setLoading(false);
        }
    };

    const toggleRecipientActive = async (id, currentStatus) => {
        try {
            const response = await fetch(`${API_BASE}/recipient-categories/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ active: !currentStatus }),
            });

            if (response.ok) {
                loadRecipients();
                setSuccess('Статус получателя обновлен');
                setTimeout(() => setSuccess(''), 2000);
            } else {
                setError('Ошибка обновления статуса');
            }
        } catch (err) {
            setError('Ошибка подключения к серверу');
        }
    };

    const deleteRecipient = async (id) => {
        if (!confirm('Вы уверены, что хотите удалить этого получателя?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/recipient-categories/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                loadRecipients();
                setSuccess('Получатель удален');
                setTimeout(() => setSuccess(''), 2000);
            } else {
                setError('Ошибка удаления получателя');
            }
        } catch (err) {
            setError('Ошибка подключения к серверу');
        }
    };

    // Группировка получателей по категориям
    const groupedRecipients = recipients.reduce((acc, recipient) => {
        const key = recipient.category;
        if (!acc[key]) {
            acc[key] = {
                category: recipient.category,
                recipients: []
            };
        }
        acc[key].recipients.push(recipient);
        return acc;
    }, {});

    return (
        <div className="recipients-manager">
            <h2>📤 Управление получателями сообщений</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Форма добавления нового получателя */}
            <div className="add-recipient-form">
                <h3>Добавить получателя</h3>
                <form onSubmit={addRecipient}>
                    <div className="form-group">
                        <label>Имя получателя *</label>
                        <input
                            type="text"
                            value={newRecipient.name}
                            onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                            placeholder="Например: KGN"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Username в Telegram *</label>
                        <input
                            type="text"
                            value={newRecipient.username}
                            onChange={(e) => setNewRecipient({...newRecipient, username: e.target.value})}
                            placeholder="Например: Rinat575kz (без @)"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Категория *</label>
                        <select
                            value={newRecipient.category}
                            onChange={(e) => setNewRecipient({...newRecipient, category: e.target.value})}
                            required
                        >
                            <option value="">Выберите категорию</option>
                            <option value="грузоперевозки">Грузоперевозки</option>
                            <option value="логистика">Логистика</option>
                            <option value="транспорт">Транспорт</option>
                            <option value="доставка">Доставка</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Добавление...' : 'Добавить получателя'}
                    </button>
                </form>
            </div>

            {/* Список получателей */}
            <div className="recipients-list">
                <h3>Получатели по категориям ({Object.keys(groupedRecipients).length})</h3>
                
                {loading && <div className="loading">Загрузка...</div>}
                
                {Object.values(groupedRecipients).map((categoryGroup, index) => (
                    <div key={index} className="category-group">
                        <h4>📂 Категория: {categoryGroup.category}</h4>
                        {categoryGroup.recipients.map((recipient) => (
                            <div key={recipient.id} className="recipient-card">
                                <div className="recipient-header">
                                    <h5>{recipient.name}</h5>
                                    <div className="recipient-info">
                                        <span>@{recipient.username || 'не указан'}</span>
                                        <span className={`status ${recipient.active ? 'active' : 'inactive'}`}>
                                            {recipient.active ? '✅ Активен' : '❌ Неактивен'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="recipient-actions">
                                    <button 
                                        onClick={() => toggleRecipientActive(recipient.id, recipient.active)}
                                        className={`toggle-btn ${recipient.active ? 'deactivate' : 'activate'}`}
                                    >
                                        {recipient.active ? 'Отключить' : 'Включить'}
                                    </button>
                                    <button 
                                        onClick={() => deleteRecipient(recipient.id)}
                                        className="delete-btn"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
                
                {!loading && Object.keys(groupedRecipients).length === 0 && (
                    <div className="no-recipients">
                        Получатели не настроены. Добавьте первого получателя выше.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecipientsManager;