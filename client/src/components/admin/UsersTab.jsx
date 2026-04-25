import { useState, useEffect, memo } from 'react';
import { 
  Trash2, Edit3, BarChart2, Plus, 
  Bell, BellOff, MoreVertical, User as UserIcon, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsersTab = ({ users, now, onEdit, onDelete, onAdd }) => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Закрытие меню при клике в любое место
  useEffect(() => {
    const close = () => setActiveMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const getUserStatus = (user) => {
    if (user.isOnline) return { label: 'В сети', color: 'text-emerald-500', dot: 'bg-emerald-500', isOnline: true };
    if (!user.lastActive) return { label: 'офлайн', color: 'text-slate-500', dot: 'bg-slate-300 dark:bg-[#333333]' };

    const last = new Date(user.lastActive);
    const diffMs = now - last;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    let label = '';
    if (diffMins < 1) label = 'только что';
    else if (diffMins < 60) label = `${diffMins} мин. назад`;
    else if (diffHrs < 24) label = `${diffHrs} ч. назад`;
    else label = last.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).toLowerCase();
    
    return { label, color: 'text-slate-500', dot: 'bg-slate-600' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Команда Clipsio</h3>
        <button onClick={onAdd} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20">
          <Plus size={14} /> Добавить
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const status = getUserStatus(u);
          const canManage = u.id === currentUser.id || u.role !== 'ADMIN';
          const isNotifEnabled = u.preference?.enabled ?? true;
          const hasPush = u._count?.pushSubscriptions > 0;

          return (
            <div key={u.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-[#333333] shadow-sm p-4 transition-all hover:border-blue-500/20 group relative">
              
              <div className="flex items-center justify-between gap-3">
                {/* ЛЕВАЯ ЧАСТЬ: Аватар + Инфо */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Аватар */}
                  <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#262626] flex items-center justify-center text-slate-400 border border-slate-100 dark:border-[#333333] shrink-0 font-bold uppercase text-[11px]">
                    {u.username.slice(0, 2)}
                  </div>
                  
                  {/* Текстовый блок */}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-[#f1f1f1] text-[14px] truncate leading-tight">
                      {u.username}
                    </p>
                    
                    {/* Роль + Статус */}
                    <div className="flex items-center gap-2 text-[11px] font-medium mt-1 whitespace-nowrap overflow-hidden">
                      <span className={`font-black uppercase tracking-tighter shrink-0 ${u.role === 'ADMIN' ? 'text-blue-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        {u.role}
                      </span>
                      
                      <div className="flex items-center gap-1.5 min-w-0 truncate border-l border-slate-200 dark:border-[#333333] pl-2">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot} ${status.isOnline ? 'animate-pulse' : ''}`} />
                        <span className={`truncate ${status.isOnline ? 'text-emerald-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ПРАВАЯ ЧАСТЬ: Уведомления + Меню */}
                <div className="flex items-center shrink-0">
                  {/* Иконка уведомлений (выровнена) */}
                  <div className="w-9 h-9 flex items-center justify-center">
                    {!hasPush ? (
                      <Bell size={16} className="text-slate-300 dark:text-slate-700/50" title="Пуш не настроен" />
                    ) : !isNotifEnabled ? (
                      <BellOff size={16} className="text-red-500/60" title="Выключены пользователем" />
                    ) : (
                      <Bell size={16} className="text-emerald-500" title="Активны" />
                    )}
                  </div>

                  {/* Три точки */}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === u.id ? null : u.id);
                      }}
                      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                        activeMenuId === u.id 
                          ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600' 
                          : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-[#262626]'
                      }`}
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Выпадающее меню (код без изменений) */}
                    {activeMenuId === u.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#444444] rounded-xl shadow-2xl z-[100] py-1.5 animate-in fade-in zoom-in-95 duration-100">
                        
                        {/* Кнопка Статистика — доступна всегда */}
                        <button 
                          onClick={() => navigate(`/profile/${u.id}`)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#333333] transition-colors"
                        >
                          <BarChart2 size={16} className="opacity-70" /> Статистика
                        </button>
                        
                        {/* Кнопка Изменить — блокируется для чужих админов */}
                        <button 
                          disabled={!canManage}
                          onClick={(e) => { e.stopPropagation(); onEdit(u); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                            canManage 
                              ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#333333]' 
                              : 'opacity-30 grayscale cursor-not-allowed'
                          }`}
                        >
                          <Edit3 size={16} className="opacity-70" /> Изменить
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-[#333333] my-1" />

                        {/* Кнопка Удалить — блокируется для чужих админов и самого себя */}
                        <button 
                          disabled={!canManage || u.id === currentUser.id}
                          onClick={(e) => { e.stopPropagation(); onDelete('users', u.id); }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${
                            canManage && u.id !== currentUser.id
                              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10' 
                              : 'opacity-30 grayscale cursor-not-allowed'
                          }`}
                        >
                          <Trash2 size={16} className="opacity-70" /> Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(UsersTab);