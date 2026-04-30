import { useState, useEffect, cloneElement, useRef } from 'react';
import api, { socket, subscribeUserToPush } from '../api';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Video, Sun, Moon, LogOut, Zap, User, Bell, Settings,
  CheckCircle2, AlertCircle, Info as InfoIcon,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { toast, Toaster } from 'sonner';

export default function Layout({ onLogout, user }) {
  const { theme, toggleTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const themeColor = theme === 'dark' ? '#1f1f1f' : '#f9fafb';

    const metas = document.querySelectorAll('meta[name="theme-color"]');
    metas.forEach(meta => meta.setAttribute('content', themeColor));

    document.documentElement.style.backgroundColor = themeColor;
    document.body.style.backgroundColor = themeColor;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const handleThemeToggle = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    
    toggleTheme();

    toast.info(`${nextTheme === 'dark' ? 'Темная' : 'Светлая'} тема включена`);
  };

  const checkNotifications = async () => {
    try {
      const res = await api.get('/api/tasks/notifications');
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (user && socket) {
      checkNotifications();
      subscribeUserToPush();
      socket.on('new_notification', checkNotifications);
      socket.on('notif_read_locally', checkNotifications);
      return () => {
        socket.off('new_notification', checkNotifications);
        socket.off('notif_read_locally', checkNotifications);
      };
    }
  }, [user]);

  const commonItems = [
    { to: "/", icon: <LayoutDashboard />, label: "Главная" },
    { to: "/content", icon: <Video />, label: "Контент" },
  ];

  const adminItem = user.role === 'ADMIN' ? { to: "/admin", icon: <Zap />, label: "Админ" } : null;

  const mobileNav = [
    ...commonItems, 
    adminItem, 
    { to: "/settings", icon: <Settings />, label: "Настройки", noFill: true }
  ].filter(Boolean);

  const desktopNav = [
    ...commonItems, 
    adminItem, 
    { 
      to: "/notifications", 
      // Оборачиваем в div с фиксированным размером 20x20 как у других иконок
      icon: (
        <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              {/* Слой пульсации */}
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              {/* Основная точка */}
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-white dark:border-[#1f1f1f]"></span>
            </span>
          )}
        </div>
      ), 
      label: "Уведомления",
      isCustom: true // Флаг, чтобы не применять cloneElement повторно
    }
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f9fafb] dark:bg-[#1f1f1f] text-slate-900 dark:text-[#f1f1f1] transition-colors duration-300 font-['Inter']">
      
      {/* --- КРАСИВЫЕ ЦВЕТНЫЕ УВЕДОМЛЕНИЯ --- */}
      <Toaster 
        theme={theme} 
        position="top-center" 
        visibleToasts={3} 
        expand={true} 
        gap={10}
        // ГЛОБАЛЬНЫЕ ИКОНКИ (самый высокий приоритет)
        icons={{
          success: <CheckCircle2 size={19} color="#10b981" strokeWidth={2.5} />,
          info: <InfoIcon size={19} color="#3b82f6" strokeWidth={2.5} />,
          error: <AlertCircle size={19} color="#ef4444" strokeWidth={2.5} />,
        }}
        toastOptions={{
          duration: 2500,
          style: {
            background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            color: theme === 'dark' ? '#f1f1f1' : '#1a1a1a',
            border: theme === 'dark' ? '1px solid #333333' : '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '12px 16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            fontSize: '13px',
            fontWeight: '600',
          },
          // Обнуляем встроенные стили типов, чтобы они не конфликтовали
          success: { className: 'success-toast' },
          error: { className: 'error-toast' },
          info: { className: 'info-toast' },
        }}
      />

      {/* --- MOBILE HEADER --- */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-[#f9fafb] dark:bg-[#1f1f1f] z-[110] flex items-end justify-between px-5 
        h-[calc(52px+env(safe-area-inset-top))] pb-3 pt-[env(safe-area-inset-top)]">
        
        <div className="flex items-center gap-2.5">
           <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Zap size={18} fill="currentColor" />
           </div>
           <h1 className="text-[17px] font-black tracking-tighter uppercase text-slate-900 dark:text-white">Clipsio</h1>
        </div>

        <Link to="/notifications" className="relative p-2 text-slate-500 dark:text-[#eeeeee] active:scale-90">
          <Bell size={22} />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border border-[#f9fafb] dark:border-[#1f1f1f]"></span>}
        </Link>
      </header>

      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-[120] w-72 h-screen bg-white dark:bg-[#1f1f1f] border-r border-gray-100 dark:border-[#333333] flex-col">
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white"><Zap size={22} fill="currentColor" /></div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Clipsio</h1>
          </div>

          <Link to={`/profile/${user.id}`} className="mb-8 p-4 bg-gray-50 dark:bg-[#181818] rounded-2xl border border-gray-100 dark:border-[#333333] flex items-center gap-3 hover:border-blue-500/30 transition-all group">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-[#262626] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all"><User size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-[#eeeeee] truncate">{user.username}</p>
              <p className="text-[10px] font-medium text-slate-400 dark:text-[#888888] uppercase tracking-widest">{user.role}</p>
            </div>
          </Link>
          
          <nav className="flex-1 space-y-1">
            {desktopNav.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link 
                  key={item.to} 
                  to={item.to} 
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'hover:bg-gray-50 dark:hover:bg-[#262626] text-slate-500 dark:text-[#d1d1d1] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {/* Контейнер для иконки с фиксированной шириной для выравнивания текста */}
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {item.isCustom ? (
                      item.icon 
                    ) : (
                      cloneElement(item.icon, { 
                        size: 20, 
                        fill: "none", 
                        strokeWidth: isActive ? 2.5 : 2 
                      })
                    )}
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 space-y-1 border-t dark:border-[#333333]">
            <button onClick={handleThemeToggle} className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#262626] text-slate-500 dark:text-[#d1d1d1] hover:text-slate-900 dark:hover:text-white font-medium text-sm">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />} 
              <span>{theme === 'dark' ? 'Светлая тема' : 'Темная тема'}</span>
            </button>
            <button onClick={onLogout} className="flex items-center gap-4 w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 text-slate-500 dark:text-[#d1d1d1] hover:text-red-600 font-medium text-sm">
              <LogOut size={20} /> <span>Выйти</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- MOBILE BOTTOM NAV: Яркие иконки и текст --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-[calc(84px+env(safe-area-inset-bottom))] bg-[#f9fafb] dark:bg-[#1a1a1a] border-t border-gray-100 dark:border-[#333333] z-[110] flex items-stretch justify-around shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
        {mobileNav.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link 
              key={item.to} to={item.to} 
              className={`flex-1 flex flex-col items-center justify-center pb-[calc(18px+env(safe-area-inset-bottom))] transition-colors 
                ${isActive ? 'text-blue-600' : 'text-slate-700 dark:text-[#d1d1d1]'}`}
            >
              <div className="mb-0">
                {cloneElement(item.icon, { 
                  size: 26, 
                  fill: (isActive && !item.noFill) ? 'currentColor' : 'none',
                  strokeWidth: isActive ? 2.5 : 1.5
                })}
              </div>
              <span className={`text-[10px] font-normal tracking-wide whitespace-nowrap leading-none mt-1.5 
                ${isActive ? 'font-bold' : 'opacity-90'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* --- MAIN AREA --- */}
      <main className="flex-1">
        <div className={`
          min-h-screen transition-all lg:pl-72
          pt-[calc(52px+env(safe-area-inset-top))] lg:pt-0
          pb-[calc(90px+env(safe-area-inset-bottom))] lg:pb-0
        `}>
          <div className={`${location.pathname === '/content' ? 'p-0' : 'p-4 md:p-8 lg:p-10 max-w-6xl mx-auto'}`}>
            <Outlet context={{ handleThemeToggle }} />
          </div>
        </div>
      </main>
    </div>
  );
}