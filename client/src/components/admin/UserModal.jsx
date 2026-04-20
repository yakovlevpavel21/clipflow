import { useState, useEffect } from 'react';
import { X, User, Lock, Save, UserPlus, Shield } from 'lucide-react';

export default function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'CREATOR',
    tgUsername: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '', 
        role: user.role || 'CREATOR',
        tgUsername: user.tgUsername || ''
      });
    }
    // Блокируем скролл фона
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    /* z-[100000] гарантирует, что модалка будет выше бокового меню и хедера */
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      {/* Фон с размытием */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-lg h-full md:h-auto md:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333333] animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
        
        {/* Кнопка закрытия */}
        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-all z-10">
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">
          {/* ЗАГОЛОВОК */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              {user ? <Save size={24} /> : <UserPlus size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                {user ? 'Профиль сотрудника' : 'Новый аккаунт'}
              </h2>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">Управление доступом Clipsio</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* ЛОГИН */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                <User size={12} /> Логин в системе
              </label>
              <input 
                required
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-bold outline-none focus:border-blue-600 transition-all dark:text-[#f1f1f1]"
                placeholder="Имя"
              />
            </div>

            {/* ПАРОЛЬ */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                <Lock size={12} /> {user ? 'Сменить пароль' : 'Пароль'}
              </label>
              <input 
                type="password"
                required={!user}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-bold outline-none focus:border-blue-600 transition-all dark:text-[#f1f1f1]"
                placeholder={user ? "Оставьте пустым, если не меняете" : "••••••••"}
              />
            </div>

            {/* РОЛЬ */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                <Shield size={12} /> Уровень доступа
              </label>
              <div className="relative">
                <select 
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-bold outline-none focus:border-blue-600 transition-all cursor-pointer dark:text-[#f1f1f1]"
                >
                  <option value="CREATOR">КРЕАТОР (Съемка)</option>
                  <option value="MANAGER">МЕНЕДЖЕР (Контроль)</option>
                  <option value="ADMIN">АДМИНИСТРАТОР (Полный)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                   <Shield size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* КНОПКА ОТПРАВКИ */}
          <button 
            type="submit"
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
          >
            {user ? <Save size={18} /> : <UserPlus size={18} />}
            <span>{user ? 'Сохранить изменения' : 'Создать сотрудника'}</span>
          </button>
        </form>

      </div>
    </div>
  );
}