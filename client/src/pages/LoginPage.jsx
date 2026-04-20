import { useState } from 'react';
import api from '../api';
import { Zap, Loader2, Lock, User } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Неверные данные доступа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#1f1f1f] px-4 font-['Inter'] transition-colors duration-300">
      <div className="w-full max-w-[400px] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* LOGO & TITLE */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/20 mx-auto transform hover:rotate-6 transition-transform">
            <Zap size={32} className="text-white" fill="currentColor" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
              Clipsio
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em]">
              Content Management System
            </p>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-white dark:bg-[#1a1a1a] p-6 md:p-10 rounded-2xl border border-slate-200 dark:border-[#333333] shadow-2xl space-y-6"
        >
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-500 text-[10px] font-black rounded-xl text-center border border-red-100 dark:border-red-900/30 uppercase tracking-widest animate-in shake duration-300">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* USERNAME */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                <User size={12} /> Логин
              </label>
              <input 
                required
                className="w-full bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] outline-none focus:border-blue-600 transition-all font-bold text-sm text-slate-900 dark:text-[#f1f1f1]"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
                placeholder="Ваше имя"
              />
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

        {/* FOOTER */}
        <div className="flex items-center justify-center gap-4 opacity-30">
           <div className="h-px w-8 bg-slate-400" />
           <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.4em]">
             Authorized Personnel Only
           </span>
           <div className="h-px w-8 bg-slate-400" />
        </div>
      </div>
    </div>
  );
}