import { memo } from 'react';
import { Users, Trash2, Edit3, BarChart2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsersTab = ({ users, now, onEdit, onDelete, onAdd }) => {
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem('user'));

  const getUserStatus = (user) => {
    if (user.isOnline) return { label: 'В сети', color: 'text-emerald-500', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' };
    if (!user.lastActive) return { label: 'Офлайн', color: 'text-slate-500', dot: 'bg-slate-300 dark:bg-[#333333]' };

    const last = new Date(user.lastActive).getTime();
    const diff = Math.floor((now.getTime() - last) / 60000);

    if (diff < 1) return { label: 'Только что', color: 'text-slate-400', dot: 'bg-slate-400' };
    if (diff < 60) return { label: `${diff}м назад`, color: 'text-slate-400', dot: 'bg-slate-500' };
    
    return { 
      label: new Date(user.lastActive).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }), 
      color: 'text-slate-500', dot: 'bg-slate-600' 
    };
  };

  // Профессиональный стиль для кнопок действий
  const actionBtnClass = "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border border-slate-100 dark:border-[#333333] bg-slate-50 dark:bg-[#262626] text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:border-blue-500/30 active:scale-95";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Команда Clipsio</h3>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} />
          <span>Добавить</span>
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(u => {
          const status = getUserStatus(u);
          const canManage = u.id === currentUser.id || u.role !== 'ADMIN';

          return (
            <div key={u.id} className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-[#333333] shadow-sm flex flex-col p-5 transition-all hover:border-blue-500/20 group">
              
              <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Avatar */}
                  <div className="w-11 h-11 bg-slate-50 dark:bg-[#262626] rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 dark:border-[#333333] shrink-0 font-bold uppercase text-xs">
                    {u.username.slice(0, 2)}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-[#f1f1f1] text-[15px] truncate leading-none mb-2">
                      {u.username}
                    </p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30">
                        {u.role}
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot} ${u.isOnline ? 'animate-pulse' : ''}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-tight ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  disabled={!canManage}
                  onClick={() => onDelete('users', u.id)}
                  className={`p-2 transition-all shrink-0 ${
                    canManage 
                      ? 'text-slate-300 hover:text-red-500 dark:hover:text-red-400' 
                      : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* BOTTOM ACTIONS */}
              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-50 dark:border-[#262626]">
                <button 
                  disabled={!canManage}
                  onClick={() => onEdit(u)}
                  className={`${actionBtnClass} ${
                    !canManage ? 'opacity-20 cursor-not-allowed grayscale' : ''
                  }`}
                >
                  <Edit3 size={14} />
                  <span>Правка</span>
                </button>
                
                <button 
                  onClick={() => navigate(`/profile/${u.id}`)}
                  className={actionBtnClass}
                >
                  <BarChart2 size={14} />
                  <span>Профиль</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="py-24 text-center border-2 border-dashed border-slate-100 dark:border-[#262626] rounded-3xl">
          <Users className="mx-auto text-slate-200 dark:text-[#262626] mb-4" size={48} />
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] opacity-60">Сотрудники не найдены</p>
        </div>
      )}
    </div>
  );
};

export default memo(UsersTab);