import { useState, useEffect, useRef, useCallback, memo, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getPreferences, updatePreferences, markNotificationsRead, socket, subscribeUserToPush } from '../api';
import { Bell, BellOff, ShieldAlert, CheckCircle2, Loader2, Video, Inbox } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const navigate = useNavigate();
  const observer = useRef();
  const hasMarkedRead = useRef(false);

  useEffect(() => {
    loadInitialData();

    const handleNewNotif = (newNotif) => {
      if (newNotif) {
        setNotifications(prev => {
          const exists = prev.find(n => n.id === newNotif.id);
          if (exists) return prev;
          return [newNotif, ...prev];
        });
      }
    };

    socket.on('new_notification', handleNewNotif);
    return () => socket.off('new_notification', handleNewNotif);
  }, []);

  const loadInitialData = async () => {
    try {
      const [notifsRes, prefsRes] = await Promise.all([
        getNotifications(0, 20), 
        getPreferences()
      ]);
      
      setNotifications(notifsRes.data);
      setIsEnabled(prefsRes.data.enabled);
      setHasMore(notifsRes.data.length === 20);

      if (!hasMarkedRead.current) {
        await markNotificationsRead();
        socket.emit('notif_read_locally');
        hasMarkedRead.current = true;
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchMore = async () => {
    if (isFetching || !hasMore) return;
    setIsFetching(true);
    try {
      const res = await getNotifications(notifications.length, 20);
      setNotifications(prev => [...prev, ...res.data]);
      setHasMore(res.data.length === 20);
    } catch (e) { console.error(e); }
    finally { setIsFetching(false); }
  };

  const lastElementRef = useCallback(node => {
    if (loading || isFetching) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) fetchMore();
    });
    if (node) observer.current.observe(node);
  }, [loading, isFetching, hasMore, notifications.length]);

  const handleNotifClick = (n) => {
    if (n.taskId) {
      // Всегда ведем на контент и передаем ID для скролла
      navigate('/content', { state: { scrollToTaskId: n.taskId } });
    }
  };

  const groupedNotifications = notifications.reduce((groups, n) => {
    const d = new Date(n.createdAt);
    
    // Формируем: "понедельник 18 апреля"
    const weekday = d.toLocaleDateString('ru-RU', { weekday: 'long' });
    const dayMonth = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    
    const fullDate = `${weekday}, ${dayMonth}`;
    
    if (!groups[fullDate]) groups[fullDate] = [];
    groups[fullDate].push(n);
    return groups;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px] text-blue-500">
      <Loader2 className="animate-spin" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-24 px-4 font-['Inter']">
      
      {/* HEADER: Скрыт на мобилке (hidden md:flex) */}
      <header className="hidden md:flex items-center justify-between pt-10 mb-10 animate-in fade-in duration-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Уведомления</h1>
          <p className="text-sm text-slate-500 mt-1">История событий Clipsio</p>
        </div>

        <button 
          onClick={async () => {
            const newStatus = !isEnabled;
            if (newStatus) await subscribeUserToPush();
            setIsEnabled(newStatus);
            await updatePreferences({ enabled: newStatus });
          }}
          className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 ${
            isEnabled ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-[#262626] text-slate-400'
          }`}
        >
          {isEnabled ? <Bell size={16}/> : <BellOff size={16}/>}
          {isEnabled ? "Включены" : "Выключены"}
        </button>
      </header>

      {/* MOBILE-ONLY SETTINGS BUTTON (Показываем только на мобилках вместо хедера) */}
      <div className="md:hidden pt-6 mb-8">
         <button 
           onClick={async () => {
             const newStatus = !isEnabled;
             setIsEnabled(newStatus);
             await updatePreferences({ enabled: newStatus });
           }}
           className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-[#333333]"
         >
           <div className="flex items-center gap-3">
             {isEnabled ? <Bell className="text-blue-500" size={20}/> : <BellOff className="text-slate-400" size={20}/>}
             <span className="text-[13px] font-bold dark:text-white">Push-уведомления</span>
           </div>
           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${isEnabled ? 'bg-blue-600/10 text-blue-600' : 'bg-slate-200 dark:bg-[#333333] text-slate-500'}`}>
             {isEnabled ? 'ВКЛ' : 'ВЫКЛ'}
           </span>
         </button>
      </div>

      <div className="space-y-8">
        {notifications.length === 0 ? (
          <div className="py-24 text-center">
            <Inbox className="text-slate-200 dark:text-[#262626] mx-auto mb-4" size={48} />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">Пусто</p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-4 px-1 mb-3">
                {/* whitespace-nowrap — главное исправление */}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  {date}
                </span>
                <div className="h-px bg-slate-100 dark:bg-[#262626] w-full" />
              </div>
              
              <div className="space-y-1">
                {items.map((n) => (
                  <NotificationItem 
                    key={n.id} 
                    notif={n} 
                    onClick={() => handleNotifClick(n)}
                    ref={notifications.indexOf(n) === notifications.length - 1 ? lastElementRef : null}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      
      {isFetching && (
        <div className="py-10 flex justify-center text-blue-500">
          <Loader2 className="animate-spin" size={24} />
        </div>
      )}
    </div>
  );
}

const NotificationItem = memo(forwardRef(({ notif, onClick }, ref) => {
  return (
    <div 
      ref={ref}
      onClick={onClick}
      className={`group relative p-4 rounded-2xl transition-all duration-200 cursor-pointer active:scale-[0.98]
        ${notif.isRead 
          ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-[#1a1a1a]' 
          : 'bg-blue-50/30 dark:bg-blue-600/5 shadow-sm ring-1 ring-blue-500/10'
        }
      `}
    >
      <div className="flex gap-4">
        {/* ИКОНКА */}
        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border
          ${notif.type === 'REVISION_NEEDED' ? 'bg-red-500/5 text-red-500 border-red-500/10' : 
            notif.type === 'PUBLISHED' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 
            'bg-blue-500/5 text-blue-500 border-blue-500/10'}
        `}>
           {notif.type === 'REVISION_NEEDED' ? <ShieldAlert size={18}/> : 
            notif.type === 'PUBLISHED' ? <CheckCircle2 size={18}/> : 
            <Video size={18}/>}
        </div>

        {/* ТЕСТОВАЯ ЧАСТЬ */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-0.5 gap-2">
            
            {/* ЗАГОЛОВОК С ТОЧКОЙ ВНУТРИ */}
            <div className="flex items-center gap-2 min-w-0">
              {!notif.isRead && (
                <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              )}
              <h3 className={`font-bold text-[14px] leading-tight truncate 
                ${notif.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                {notif.title}
              </h3>
            </div>

            {/* ВРЕМЯ */}
            <span className="text-[10px] font-medium text-slate-400 tabular-nums shrink-0 mt-0.5 uppercase">
              {new Date(notif.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </span>
          </div>
          
          <p className={`text-[13px] leading-snug line-clamp-2
            ${notif.isRead ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
            {notif.message}
          </p>
        </div>
      </div>
    </div>
  );
}));