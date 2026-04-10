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

  useEffect(() => {
    loadInitialData();

    // Слушаем сокет: если пришло уведомление — вызываем loadLatest
    socket.on('new_notification', loadLatest);

    return () => {
      socket.off('new_notification', loadLatest);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      // 1. СРАЗУ отправляем запрос на прочтение, чтобы точка исчезла
      markNotificationsRead().catch(e => console.error(e));

      // 2. Загружаем данные для отображения
      const [notifsRes, prefsRes] = await Promise.all([
        getNotifications(0, 20), 
        getPreferences()
      ]);
      
      setNotifications(notifsRes.data);
      setIsEnabled(prefsRes.data.enabled);
      setHasMore(notifsRes.data.length === 20);
      
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  const loadLatest = async () => {
    try {
      // Подгружаем первую страницу (последние 20 штук)
      const res = await getNotifications(0, 20);
      const newBatch = res.data;

      setNotifications(prev => {
        // Соединяем старые и новые, убирая дубликаты по ID
        const all = [...newBatch, ...prev];
        const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        // Сортируем по дате на всякий случай
        return unique.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });

      // Сразу помечаем их как прочитанные в базе, чтобы точка в Layout исчезла
      await markNotificationsRead();
      socket.emit('notif_read_locally');
    } catch (e) {
      console.error("Ошибка при обновлении списка:", e);
    }
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
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) fetchMore();
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, notifications.length]);

  const handleNotifClick = (n) => {
    // 1. Проверяем, существует ли задача вообще
    if (!n.taskId || !n.task) {
      alert("Эта задача была удалена из системы.");
      return;
    }

    // 2. Проверяем, не опубликована ли она (т.е. ушла ли она из рабочих списков)
    // Мы решили, что в рабочих списках остаются только задачи НЕ PUBLISHED
    if (n.task.status === 'PUBLISHED') {
      alert("Эта задача уже опубликована и перемещена в архив профиля.");
      return;
    }

    // 3. Если задача активна (AWAITING_REACTION, IN_PROGRESS, REACTION_UPLOADED)
    const targetPath = n.type === 'REACTION_UPLOADED' ? '/manager' : '/creator';
    
    navigate(targetPath, { 
      state: { 
        scrollToTaskId: n.taskId 
      } 
    });
  };

  const groupedNotifications = notifications.reduce((groups, n) => {
    const date = new Date(n.createdAt).toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
    return groups;
  }, {});

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">
      
      <header className="pt-10 mb-10 px-1 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Уведомления
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              История ваших событий Clipsio и управление оповещениями.
            </p>
          </div>

          <button 
            onClick={async () => {
              const newStatus = !isEnabled;
              if (newStatus) await subscribeUserToPush();
              setIsEnabled(newStatus);
              await updatePreferences({ enabled: newStatus });
            }}
            className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shrink-0 ${
              isEnabled 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isEnabled ? <Bell size={18}/> : <BellOff size={18}/>}
            {isEnabled ? "Включены" : "Выключены"}
          </button>
        </div>
      </header>

      <div className="space-y-10">
        {notifications.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <Inbox className="text-slate-300 dark:text-slate-700" size={32} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] opacity-60">Уведомлений пока нет</p>
          </div>
        ) : (
          Object.entries(groupedNotifications).map(([date, items]) => (
            <div key={date} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">{date}</span>
                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full opacity-50" />
              </div>
              <div className="space-y-3">
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
        <div className="py-10 flex justify-center">
          <Loader2 className="animate-spin text-blue-500" size={24} />
        </div>
      )}
    </div>
  );
}

const NotificationItem = memo(forwardRef(({ notif, onClick }, ref) => {
  // Проверяем, считается ли задача архивной
  const isArchived = !notif.task || notif.task.status === 'PUBLISHED';

  return (
    <div 
      ref={ref}
      onClick={!isArchived ? onClick : undefined} // Отключаем клик, если в архиве
      className={`group relative p-4 md:p-5 rounded-[1.8rem] border transition-all duration-300 
        ${notif.isRead 
          ? 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800' 
          : 'bg-white dark:bg-slate-900 border-blue-500/20 shadow-md ring-1 ring-blue-500/5'
        } 
        ${isArchived 
          ? 'grayscale-[0.8] opacity-80 bg-slate-50/50 dark:bg-slate-900/20 cursor-default' 
          : 'cursor-pointer active:scale-[0.99]'
        }`}
    >
      {/* СИНЯЯ ТОЧКА (Индикатор нового) */}
      {!notif.isRead && !isArchived && (
        <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)] z-10" />
      )}

      <div className="flex gap-5">
        {/* ИКОНКА ТИПА */}
        <div className={`p-4 rounded-2xl h-fit shadow-inner transition-transform ${!isArchived && 'group-hover:scale-105'} ${
          notif.type === 'REVISION_NEEDED' ? 'bg-red-500/10 text-red-500' : 
          notif.type === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-500' : 
          'bg-blue-500/10 text-blue-500'
        }`}>
           {notif.type === 'REVISION_NEEDED' ? <ShieldAlert size={22}/> : 
            notif.type === 'PUBLISHED' ? <CheckCircle2 size={22}/> : 
            <Video size={22}/>}
        </div>

        {/* КОНТЕНТ */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1.5 gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h3 className={`font-bold text-sm md:text-base tracking-tight leading-tight transition-colors 
                ${notif.isRead ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'} 
                ${!isArchived && 'group-hover:text-blue-600'}`}>
                {notif.title}
              </h3>
              
              {/* БЕЙДЖ АРХИВА (Исправлен и выровнен) */}
              {isArchived && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-[8px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-700 mt-0.5">
                  Архив
                </span>
              )}
            </div>

            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tabular-nums uppercase shrink-0 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md">
              {new Date(notif.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </span>
          </div>
          
          <p className={`text-xs md:text-sm leading-relaxed pr-2 
            ${notif.isRead ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'} 
            ${isArchived && 'opacity-60'}`}>
            {notif.message}
          </p>
        </div>
      </div>
    </div>
  );
}));