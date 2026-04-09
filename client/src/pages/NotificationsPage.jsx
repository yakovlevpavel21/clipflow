import { useState, useEffect } from 'react';
import { getNotifications, markNotificationsRead, getPreferences, updatePreferences, socket, subscribeUserToPush } from '../api';
import { Bell, BellOff, ShieldAlert, CheckCircle2, Loader2, Info, AlertTriangle } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
    socket.on('new_notification', loadData);
    return () => socket.off('new_notification');
  }, []);

  const loadData = async () => {
    try {
      const [notifsRes, prefsRes] = await Promise.all([getNotifications(), getPreferences()]);
      setNotifications(notifsRes.data);
      setIsEnabled(prefsRes.data.enabled);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = async () => {
    const newStatus = !isEnabled;
    
    if (newStatus) {
      // ПЫТАЕМСЯ ВКЛЮЧИТЬ
      setIsProcessing(true);
      
      // Проверяем текущий статус разрешения в браузере
      if (Notification.permission !== 'granted') {
        const success = await subscribeUserToPush();
        if (!success) {
          alert("Не удалось включить уведомления. Проверьте настройки разрешений в браузере или используйте HTTPS.");
          setIsProcessing(false);
          return;
        }
      }
      
      setIsEnabled(true);
      await updatePreferences({ enabled: true });
      setIsProcessing(false);
    } else {
      // ПРОСТО ВЫКЛЮЧАЕМ В БАЗЕ (не шлем пуши)
      setIsEnabled(false);
      await updatePreferences({ enabled: false });
    }
  };

  const handleReadAll = async () => {
    await markNotificationsRead();
    loadData();
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">
      
      <header className="pt-10 mb-8 px-1 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Уведомления
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              История событий и управление системными оповещениями Clipsio.
            </p>
          </div>

          <button 
            onClick={toggleNotifications}
            disabled={isProcessing}
            className={`flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest transition-all active:scale-95 min-w-[240px] ${
              isEnabled 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="animate-spin" size={18} />
            ) : isEnabled ? (
              <Bell size={18} />
            ) : (
              <BellOff size={18} />
            )}
            <span>{isEnabled ? "Уведомления Активны" : "Уведомления Выключены"}</span>
          </button>
        </div>
      </header>

      {/* Предупреждение если заблокировано в браузере вручную */}
      {isEnabled && Notification.permission === 'denied' && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[1.5rem] flex items-center gap-3 text-amber-700 dark:text-amber-400">
          <AlertTriangle size={20} className="shrink-0" />
          <p className="text-xs font-bold uppercase tracking-tight">
            Уведомления включены в Clipsio, но заблокированы в настройках вашего браузера.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {notifications.length > 0 ? (
          <>
            <div className="flex justify-end px-2">
              <button 
                onClick={handleReadAll}
                className="text-[10px] font-extrabold text-blue-500 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors py-2"
              >
                Пометить все как прочитанные
              </button>
            </div>

            <div className="grid gap-3">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${
                    n.isRead 
                      ? 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-60' 
                      : 'bg-white dark:bg-slate-900 border-blue-500/20 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/5'
                  }`}
                >
                  <div className="flex gap-5">
                    <div className={`p-4 rounded-2xl h-fit shadow-inner ${
                      n.type === 'REVISION_NEEDED' ? 'bg-red-500/10 text-red-500' : 
                      n.type === 'PUBLISHED' ? 'bg-green-500/10 text-green-500' :
                      'bg-blue-500/10 text-blue-500'
                    }`}>
                      {n.type === 'REVISION_NEEDED' ? <ShieldAlert size={22}/> : 
                       n.type === 'PUBLISHED' ? <CheckCircle2 size={22}/> : 
                       <Bell size={22}/>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
                          {n.title}
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase whitespace-nowrap ml-4 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {new Date(n.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed italic">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <Bell className="text-slate-300 dark:text-slate-700" size={32} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">История уведомлений пуста</p>
          </div>
        )}
      </div>
    </div>
  );
}