import { useState, useEffect } from 'react'; // Добавь импорт хуков
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PageStatus from './components/PageStatus';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import NotificationsPage from './pages/NotificationsPage';
import ContentPage from './pages/ContentPage';
import Profile from './pages/Profile';
import api, { socket } from './api';

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [isValidating, setIsValidating] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const verifySession = async () => {
      if (!user) {
        setIsValidating(false);
        return;
      }

      try {
        // Проверяем пользователя на бэкенде
        const res = await api.get('/api/auth/me');
        // Если данные изменились (например, роль), обновляем их
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
        
        // Подключаем сокет после успешной проверки
        if (socket) socket.emit('user_online', res.data.id);

      } catch (err) {
        console.error("Session verification failed:", err);
        handleLogout(); // Если юзера нет в БД или токен неверный — выходим
      } finally {
        setIsValidating(false);
      }
    };

    verifySession();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // window.location.href используется для полной перезагрузки, 
    // чтобы сбросить все стейты после входа
    window.location.href = '/';
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-[#1f1f1f]">
        <PageStatus loading={true} />
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage onLogin={(u) => { setUser(u); window.location.href = '/'; }} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/" element={<Layout onLogout={handleLogout} user={user} />}>
            {/* ГЛАВНАЯ: теперь доступна всем без Navigate */}
            <Route index element={<Dashboard />} />

            <Route path="profile/:id" element={<Profile />} />
            <Route path="content" element={<ContentPage />} />
            
            {/* Ограничение оставляем только для страницы системных настроек */}
            {user.role === 'ADMIN' && <Route path="admin" element={<AdminPage />} />}
            
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}