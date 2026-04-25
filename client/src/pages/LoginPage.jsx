import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Zap, Loader2, Lock, User, ChevronDown, UserCircle, X } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Логика сохраненных аккаунтов
  const [savedAccounts, setSavedAccounts] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Загружаем аккаунты из памяти браузера при старте
  useEffect(() => {
    const accounts = JSON.parse(localStorage.getItem('clipsio_accounts') || '[]');
    setSavedAccounts(accounts);

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowSaved(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', formData);
      
      // 1. Сначала работаем с аккаунтами
      const localData = localStorage.getItem('clipsio_accounts');
      let currentAccounts = localData ? JSON.parse(localData) : [];
      
      const existingIdx = currentAccounts.findIndex(a => a.username === formData.username);
      
      if (existingIdx > -1) {
        // Обновляем пароль, если он изменился
        currentAccounts[existingIdx].password = formData.password;
      } else {
        // Добавляем новый
        currentAccounts.push({ 
          username: formData.username, 
          password: formData.password 
        });
      }
      
      // Сохраняем список аккаунтов (этот ключ теперь не удаляется при выходе)
      localStorage.setItem('clipsio_accounts', JSON.stringify(currentAccounts));

      // 2. Сохраняем сессию
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // 3. Вызываем вход
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Неверные данные доступа');
    } finally {
      setLoading(false);
    }
  };

  const selectAccount = (acc) => {
    setFormData({ username: acc.username, password: acc.password });
    setShowSaved(false);
  };

  const removeAccount = (e, username) => {
    e.stopPropagation();
    const filtered = savedAccounts.filter(a => a.username !== username);
    setSavedAccounts(filtered);
    localStorage.setItem('clipsio_accounts', JSON.stringify(filtered));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#1f1f1f] px-4 font-['Inter'] transition-colors duration-300">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/20 mx-auto">
            <Zap size={32} className="text-white" fill="currentColor" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Clipsio</h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em]">Content Management System</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-[#1a1a1a] p-6 md:p-10 rounded-2xl border border-slate-200 dark:border-[#333333] shadow-2xl space-y-6 relative">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 text-[10px] font-black rounded-xl text-center border border-red-100 dark:border-red-900/30 uppercase tracking-widest animate-in shake">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* USERNAME С ВЫПАДАЮЩИМ СПИСКОМ */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                  <User size={12} /> Логин
                </label>
                {savedAccounts.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setShowSaved(!showSaved)}
                    className="text-[9px] font-black text-blue-500 uppercase hover:underline flex items-center gap-1"
                  >
                    Аккаунты <ChevronDown size={10} className={showSaved ? 'rotate-180' : ''} />
                  </button>
                )}
              </div>
              
              <div className="relative">
                <input 
                  required
                  className="w-full bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] outline-none focus:border-blue-600 transition-all font-bold text-sm text-slate-900 dark:text-[#f1f1f1]"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="Введите логин"
                  autoComplete="off"
                />
                
                {/* ВЫПАДАЮЩИЙ СПИСОК СОХРАНЕННЫХ */}
                {showSaved && savedAccounts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#444444] rounded-xl shadow-2xl z-[100] py-2 animate-in fade-in zoom-in-95 duration-100">
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      {savedAccounts.map((acc) => (
                        <div 
                          key={acc.username}
                          onClick={() => selectAccount(acc)}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-600/10 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <UserCircle size={18} className="text-slate-400 group-hover:text-blue-500" />
                            <span className="text-sm font-bold text-slate-700 dark:text-[#cccccc]">{acc.username}</span>
                          </div>
                          <button 
                            onClick={(e) => removeAccount(e, acc.username)}
                            className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                <Lock size={12} /> Пароль
              </label>
              <input 
                required
                type="password"
                className="w-full bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] outline-none focus:border-blue-600 transition-all font-bold text-sm text-slate-900 dark:text-[#f1f1f1]"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full h-16 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Авторизация"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-4 opacity-30">
           <div className="h-px w-8 bg-slate-400" />
           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em]">Clipsio Access Control</span>
           <div className="h-px w-8 bg-slate-400" />
        </div>
      </div>
    </div>
  );
}