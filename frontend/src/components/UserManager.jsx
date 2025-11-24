import React, { useState, useEffect } from 'react';
import './UserManager.css';

const UserManager = ({ apiBase }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Данные формы
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });

  // Загрузка пользователей
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBase}/users`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Ошибка загрузки пользователей');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ username: '', password: '', role: 'user' });
    setShowCreateForm(false);
    setError('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Заполните все поля');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        resetForm();
        await loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка создания пользователя');
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Действительно удалить пользователя "${user.username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${apiBase}/users/${user.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        await loadUsers();
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка удаления пользователя');
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="user-manager">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="user-manager">
      <div className="header">
        <h2>Управление пользователями</h2>
        <button 
          className="btn-add" 
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Отмена' : 'Добавить пользователя'}
        </button>
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="form-section">
          <h3>Новый пользователь</h3>
          <form onSubmit={handleCreateUser} className="user-form">
            <div className="form-grid">
              <div className="field">
                <label>Логин</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="field">
                <label>Пароль</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>
              
              <div className="field">
                <label>Роль</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="user">Пользователь</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">Создать</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Отмена</button>
            </div>
          </form>
        </div>
      )}

      <div className="users-section">
        <div className="users-table">
          <div className="table-header">
            <div>Логин</div>
            <div>Роль</div>
            <div>Создан</div>
            <div>Последний вход</div>
            <div>Статус</div>
            <div>Действия</div>
          </div>
          
          {users.map(user => (
            <div key={user.id} className="table-row">
              <div className="cell">{user.username}</div>
              <div className="cell">
                <span className={`role ${user.role}`}>
                  {user.role === 'admin' ? 'Админ' : 'Пользователь'}
                </span>
              </div>
              <div className="cell">{formatDate(user.created_at)}</div>
              <div className="cell">{user.last_login ? formatDate(user.last_login) : '—'}</div>
              <div className="cell">
                <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? 'Активен' : 'Неактивен'}
                </span>
              </div>
              <div className="cell actions">
                <button 
                  onClick={() => handleDeleteUser(user)} 
                  className="btn-delete"
                  title="Удалить пользователя"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserManager;