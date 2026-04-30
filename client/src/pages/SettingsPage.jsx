import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { 
  User, Sun, Moon, LogOut, ChevronRight, 
  Bell, BellOff, HelpCircle, Info, Loader2 
} from 'lucide-react';
import { getPreferences, updatePreferences, subscribeUserToPush } from '../api';
import { toast } from 'sonner';

export default function SettingsPage({ onLogout }) {
  const { theme, handleThemeToggle } = useOutletContext();
  const [user] = useState(JSON.parse(localStorage.getItem('user')));
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  const [isUpdatingNotifs, setIsUpdatingNotifs] = useState(false);

  // Загружаем текущие настройки уведомлений
  useEffect(() => {
    getPreferences().then(res => {
      setNotifsEnabled(res.data.enabled);
    }).catch(() => {});
  }, []);

  const handleToggleNotifs = async () => {
    setIsUpdatingNotifs(true);
    const newStatus = !notifsEnabled;
    
    try {
      // Если включаем — запрашиваем подписку у браузера
      if (newStatus) {
        await subscribeUserToPush();
      }
      
      await updatePreferences({ enabled: newStatus });
      setNotifsEnabled(newStatus);
      
      toast.info(newStatus ? 'Уведомления включены' : 'Уведомления отключены');
    } catch (err) {
      toast.error('Ошибка при настройке уведомлений');
    } finally {
      setIsUpdatingNotifs(false);
    }
  };

  const SettingButton = ({ icon: Icon, label, value, onClick, color = "text-slate-500", disabled = false, rightElement }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1a1a1a] active:bg-slate-50 dark:active:bg-[#222222] transition-colors disabled:opacity-50"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-lg bg-slate-50 dark:bg-[#262626] ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-[14px] font-semibold text-slate-900 dark:text-[#eeeeee]">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-[12px] font-medium text-slate-400 uppercase tracking-tighter">{value}</span>}
        {rightElement ? rightElement : <ChevronRight size={16} className="text-slate-300" />}
      </div>
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto pb-24 px-4 font-['Inter'] animate-in fade-in duration-500">
      <header className="hidden lg:block pt-10 mb-8 px-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Настройки</h1>
      </header>

      <div className="space-y-6 mt-6 md:mt-0">
        
        {/* СЕКЦИЯ АККАУНТ */}
        <section className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Аккаунт</label>
          <Link to={`/profile/${user?.id}`} className="flex items-center justify-between p-5 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-[#333333] shadow-sm hover:border-blue-500/30 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg font-bold">
                {user?.username?.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 dark:text-white truncate">{user?.username}</p>
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-300" />
          </Link>
        </section>

        {/* СЕКЦИЯ ИНТЕРФЕЙС */}
        <section className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Конфигурация</label>
          <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-[#333333] shadow-sm divide-y divide-slate-100 dark:divide-[#333333]">
            <SettingButton
              icon={theme === 'dark' ? Moon : Sun}
              label="Тема оформления"
              value={theme === 'dark' ? 'Темная' : 'Светлая'}
              color={theme === 'dark' ? 'text-blue-500' : 'text-amber-500'}
              onClick={handleThemeToggle} 
            />
            <SettingButton 
              icon={notifsEnabled ? Bell : BellOff} 
              label="Push-уведомления" 
              color={notifsEnabled ? "text-emerald-500" : "text-slate-400"}
              disabled={isUpdatingNotifs}
              onClick={handleToggleNotifs}
              rightElement={
                isUpdatingNotifs ? (
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                ) : (
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${notifsEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifsEnabled ? 'left-6' : 'left-1'}`} />
                  </div>
                )
              }
            />
          </div>
        </section>

        <button onClick={onLogout} className="w-full h-16 flex items-center justify-center gap-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl border border-red-100 dark:border-red-900/20 font-bold text-[14px] active:scale-[0.98] transition-all">
          <LogOut size={20} />
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}