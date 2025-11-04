import React, { useState, useEffect } from 'react';
import './RecipientsManager.css';

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
        telegram_id: '',
        keyword: '',
        active: true
    });

    useEffect(() => {
        loadRecipients();
        loadKeywords();
    }, []);

    const loadRecipients = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/recipients');
            if (response.ok) {
                const data = await response.json();
                setRecipients(data);
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
            const response = await fetch('/api/keywords');
            if (response.ok) {
                const data = await response.json();
                setKeywords(data);
            }
        } catch (err) {
            console.error('Ошибка загрузки ключевых слов:', err);
        }
    };

    const addRecipient = async (e) => {
        e.preventDefault();
        
        // Проверяем обязательные поля
        if (!newRecipient.name || !newRecipient.telegram_id || !newRecipient.keyword) {
            setError('Заполните все обязательные поля');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/recipients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newRecipient),
            });

            if (response.ok) {
                setSuccess('Получатель добавлен успешно');
                setNewRecipient({
                    name: '',
                    username: '',
                    telegram_id: '',
                    keyword: '',
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
            const response = await fetch(`/api/recipients/${id}`, {
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
            const response = await fetch(`/api/recipients/${id}`, {
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

    // Группируем получателей по пользователям
    const groupedRecipients = recipients.reduce((acc, recipient) => {
        const key = `${recipient.name}_${recipient.telegram_id}`;
        if (!acc[key]) {
            acc[key] = {
                name: recipient.name,
                username: recipient.username,
                telegram_id: recipient.telegram_id,
                keywords: []
            };
        }
        acc[key].keywords.push({
            id: recipient.id,
            keyword: recipient.keyword,
            active: recipient.active
        });
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
                        <label>Username в Telegram</label>
                        <input
                            type="text"
                            value={newRecipient.username}
                            onChange={(e) => setNewRecipient({...newRecipient, username: e.target.value})}
                            placeholder="Например: Rinat575kz (без @)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Telegram ID *</label>
                        <input
                            type="number"
                            value={newRecipient.telegram_id}
                            onChange={(e) => setNewRecipient({...newRecipient, telegram_id: e.target.value})}
                            placeholder="Например: 262700292"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Ключевое слово *</label>
                        <select
                            value={newRecipient.keyword}
                            onChange={(e) => setNewRecipient({...newRecipient, keyword: e.target.value})}
                            required
                        >
                            <option value="">Выберите ключевое слово</option>
                            {keywords.map((keyword) => (
                                <option key={keyword.id} value={keyword.keyword}>
                                    {keyword.keyword}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Добавление...' : 'Добавить получателя'}
                    </button>
                </form>
            </div>

            {/* Список получателей */}
            <div className="recipients-list">
                <h3>Текущие получатели ({Object.keys(groupedRecipients).length})</h3>
                
                {loading && <div className="loading">Загрузка...</div>}
                
                {Object.values(groupedRecipients).map((user, index) => (
                    <div key={index} className="recipient-card">
                        <div className="recipient-header">
                            <h4>{user.name}</h4>
                            <div className="recipient-info">
                                <span>@{user.username || 'не указан'}</span>
                                <span>ID: {user.telegram_id}</span>
                            </div>
                        </div>
                        
                        <div className="keywords-list">
                            <h5>Ключевые слова:</h5>
                            {user.keywords.map((kw) => (
                                <div key={kw.id} className="keyword-item">
                                    <span className={`keyword ${kw.active ? 'active' : 'inactive'}`}>
                                        {kw.keyword}
                                    </span>
                                    <div className="keyword-actions">
                                        <button
                                            onClick={() => toggleRecipientActive(kw.id, kw.active)}
                                            className={kw.active ? 'deactivate' : 'activate'}
                                            title={kw.active ? 'Отключить' : 'Включить'}
                                        >
                                            {kw.active ? '🔴' : '🟢'}
                                        </button>
                                        <button
                                            onClick={() => deleteRecipient(kw.id)}
                                            className="delete"
                                            title="Удалить"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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