import { useState, useEffect } from 'react'; // Добавь импорт хуков
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManagerPage from './pages/ManagerPage';
import CreatorPage from './pages/CreatorPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import NotificationsPage from './pages/NotificationsPage';
import Profile from './pages/Profile';
import api, { socket } from './api'; // Импортируем наш настроенный сокет

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  // ЭТОТ БЛОК ДОЛЖЕН БЫТЬ ВНУТРИ App
  useEffect(() => {
    if (user && socket) {
      // Если сокет уже подключен, шлем сразу
      if (socket.connected) {
        socket.emit('user_online', user.id);
      }
      
      // На случай переподключения (интернет моргнул)
      socket.on('connect', () => {
        socket.emit('user_online', user.id);
      });

      return () => {
        socket.off('connect');
      };
    }
  }, [user]);

  const handleLogin = (userData) => {
    setUser(userData);
    // window.location.href используется для полной перезагрузки, 
    // чтобы сбросить все стейты после входа
    window.location.href = '/';
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Если пользователь НЕ залогинен */}
        {!user ? (
          <>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          /* 2. Если пользователь залогинен */
          <Route path="/" element={<Layout onLogout={handleLogout} user={user} />}>
            
            {/* ГЛАВНАЯ СТРАНИЦА (Редиректор на основе роли) */}
            <Route index element={
              user.role === 'ADMIN' ? <Dashboard /> : 
              user.role === 'MANAGER' ? <Navigate to="/manager" replace /> : 
              <Navigate to="/creator" replace />
            } />

            <Route path="profile/:id" element={<Profile />} />

            {/* ДАШБОРД: Только для ADMIN */}
            {user.role === 'ADMIN' && (
              <Route path="dashboard" element={<Dashboard />} />
            )}

            {/* МЕНЕДЖЕР: ADMIN и MANAGER */}
            {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
              <Route path="manager" element={<ManagerPage />} />
            )}

            {/* КРЕАТОР: ADMIN и CREATOR (Менеджеры сюда не попадут) */}
            {(user.role === 'ADMIN' || user.role === 'CREATOR') && (
              <Route path="creator" element={<CreatorPage />} />
            )}
            
            {/* АДМИН-ЦЕНТР: Только для ADMIN */}
            {user.role === 'ADMIN' && (
              <Route path="admin" element={<AdminPage />} />
            )}

            {/* УВЕДОМЛЕНИЯ: Для всех */}
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Если ввели несуществующий путь — кидаем на главную (которая сама сделает редирект) */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}