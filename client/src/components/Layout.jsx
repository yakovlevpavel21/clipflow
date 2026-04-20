import { useState, useEffect } from 'react';
import api, { socket, subscribeUserToPush } from '../api';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Video, Settings, 
  Menu, X, Sun, Moon, LogOut, Zap, User, Bell 
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Layout({ onLogout, user }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  // Динамический заголовок для мобильной шапки
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/content')) return 'Контент';
    if (path.startsWith('/profile')) return 'Профиль';
    if (path.startsWith('/admin')) return 'Админ-центр';
    if (path.startsWith('/notifications')) return 'Уведомления';
    return 'Дашборд';
  };

  const checkNotifications = async () => {
    try {
      const res = await api.get('/api/tasks/notifications');
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user && socket) {
      checkNotifications();
      subscribeUserToPush();
      const handleUpdate = () => checkNotifications();
      socket.on('new_notification', handleUpdate);
      socket.on('notif_read_locally', handleUpdate);
      return () => {
        socket.off('new_notification', handleUpdate);
        socket.off('notif_read_locally', handleUpdate);
      };
    }
  }, [user]);

  useEffect(() => { setIsMenuOpen(false); }, [location.pathname]);

  const menuItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "Дашборд", roles: ['ADMIN', 'MANAGER', 'CREATOR'] },
    { to: "/content", icon: <Video size={20} />, label: "Контент", roles: ['ADMIN', 'MANAGER', 'CREATOR'] },
    { to: "/admin", icon: <Zap size={20} />, label: "Админ", roles: ['ADMIN'] },
    { 
      to: "/notifications", 
      icon: (
        <div className="relative flex items-center">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white dark:border-[#1f1f1f]"></span>
            </span>
          )}
        </div>
      ), 
      label: "Уведомления", 
      roles: ['ADMIN', 'MANAGER', 'CREATOR'] 
    }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-white dark:bg-[#1f1f1f] text-slate-900 dark:text-[#f1f1f1] transition-colors duration-300 flex flex-col lg:flex-row font-['Inter']">
      
      {/* MOBILE HEADER - Фиксированная высота 64px */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#1f1f1f] border-b border-slate-100 dark:border-[#333333] z-[110] flex items-center justify-between px-4 transform translate-z-0">
        <button 
          onClick={() => setIsMenuOpen(true)} 
          className="p-2 rounded-xl bg-slate-50 dark:bg-[#262626] text-slate-600 dark:text-[#aaaaaa] active:scale-95 transition-all"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight uppercase dark:text-white">{getPageTitle()}</h1>
        <Link to="/notifications" className="relative p-2 text-slate-400">
          <Bell size={24} />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#1f1f1f] rounded-full" />}
        </Link>
      </header>

      {/* SIDEBAR - Виден только от lg: (1024px) */}
      <aside className={`fixed lg:sticky top-0 left-0 z-[110] w-72 h-screen bg-white dark:bg-[#1f1f1f] border-r dark:border-[#333333] transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 flex flex-col`}>
        <div className="p-6 flex flex-col h-full w-full">
          
          {/* Logo Section */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap size={22} className="text-white" fill="currentColor" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">Clipsio</h1>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="lg:hidden p-2 text-slate-400"><X size={24} /></button>
          </div>
          
          {/* User Card */}
          <Link 
            to={`/profile/${user.id}`} 
            className="mb-8 p-4 bg-slate-50 dark:bg-[#171717] rounded-2xl border border-slate-100 dark:border-[#333333] flex items-center gap-3 hover:border-blue-500/30 transition-all group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-[#2a2a2a] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate uppercase">{user.username}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-[#aaaaaa] uppercase tracking-widest">{user.role}</p>
            </div>
          </Link>

          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1 no-scrollbar">
            {filteredMenu.map((item) => (
              <Link 
                key={item.to}
                to={item.to} 
                className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 ${
                  location.pathname === item.to 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                    : 'hover:bg-slate-100 dark:hover:bg-[#2a2a2a] text-slate-500 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="mt-auto pt-6 space-y-2 border-t border-slate-100 dark:border-[#333333]">
            <button 
              onClick={toggleTheme}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition text-slate-500 dark:text-[#aaaaaa] font-semibold text-sm hover:text-slate-900 dark:hover:text-white"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              <span>{theme === 'dark' ? 'Светлая тема' : 'Темная тема'}</span>
            </button>

            <button 
              onClick={onLogout}
              className="flex items-center gap-3 w-full p-3.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition text-slate-500 dark:text-[#aaaaaa] hover:text-red-600 font-semibold text-sm"
            >
              <LogOut size={20} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className={`
          w-full h-full transition-all
          ${location.pathname === '/content' 
            ? 'p-0' // Убираем все отступы для страницы контента
            : 'p-4 md:p-8 lg:p-10 max-w-6xl mx-auto'
          }
          /* Добавляем отступ сверху только для мобилок (до 1150px) под высоту хедера */
          pt-[64px] min-[1150px]:pt-0 
          pb-[env(safe-area-inset-bottom)]
        `}>
          <Outlet />
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMenuOpen && <div className="fixed inset-0 bg-black/60 z-[105] lg:hidden" onClick={() => setIsMenuOpen(false)} />}
    </div>
  );
}