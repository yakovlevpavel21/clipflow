import { useState, memo } from 'react';
import { Globe, Save, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const SettingsTab = ({ proxy, setProxy, onSaveProxy }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="px-1">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Системная конфигурация</h3>
      </div>

      {/* ОСНОВНАЯ КАРТОЧКА (Во всю ширину) */}
      <div className="bg-white dark:bg-[#1a1a1a] p-6 md:p-10 rounded-2xl border border-slate-100 dark:border-[#333333] shadow-sm space-y-8">
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Globe size={24}/>
          </div>
          <div>
            <h3 className="text-lg font-bold uppercase tracking-tight text-slate-900 dark:text-white">Сеть и Proxy</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Параметры соединения Clipsio Engine</p>
          </div>
        </div>

        {/* СТРОКА ВВОДА И КНОПКА */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-end">
          
          {/* ГРУППА ИНПУТА */}
          <div className="flex-1 space-y-2.5">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Адрес прокси (URL)</label>
            <div className="relative">
              <input 
                type={isVisible ? "text" : "password"}
                value={proxy} 
                onChange={e => setProxy(e.target.value)} 
                placeholder="http://user:pass@host:port" 
                className="w-full h-14 bg-slate-50 dark:bg-[#161616] px-5 pr-14 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-mono outline-none focus:border-blue-600 transition-all dark:text-[#f1f1f1] shadow-inner" 
              />
              <button
                type="button"
                onClick={() => setIsVisible(!isVisible)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 transition-colors"
              >
                {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {/* КНОПКА СОХРАНЕНИЯ */}
          <button 
            onClick={onSaveProxy} 
            className="h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-[0.98] shrink-0"
          >
            <Save size={18}/> 
            <span>Сохранить изменения</span>
          </button>
        </div>
        
        {/* ИНФО-БЛОК */}
        <div className="bg-slate-50 dark:bg-[#161616] p-5 rounded-2xl flex gap-4 items-start border border-slate-100 dark:border-[#333333]">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700 dark:text-[#eeeeee] uppercase tracking-tight">Безопасность данных</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Мы рекомендуем использовать приватные HTTP прокси. Настройки применяются мгновенно ко всем новым процессам скачивания.
            </p>
          </div>
        </div>

      </div>

      <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-[0.4em] opacity-30">
        Clipsio Version 1.0.0
      </p>
    </div>
  );
};

export default memo(SettingsTab);