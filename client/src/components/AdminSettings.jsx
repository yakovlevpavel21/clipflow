import { Globe, Info, Save, ShieldCheck } from 'lucide-react';

export default function AdminSettings({ 
  proxy, 
  setProxy, 
  onSaveProxy 
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- БЛОК: СЕТЬ И PROXY --- */}
      <div className="p-6 md:p-10 bg-white dark:bg-[#1a1f2e] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-8">
        
        {/* Заголовок секции */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Globe size={24}/>
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Конфигурация сети</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Параметры соединения</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Адрес прокси (URL)</label>
            <input 
              value={proxy} 
              onChange={e => setProxy(e.target.value)} 
              placeholder="http://username:password@host:port" 
              className="w-full bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-inner" 
            />
          </div>

          <button 
            onClick={onSaveProxy} 
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-[0.98]"
          >
            <Save size={18}/> Сохранить настройки
          </button>
        </div>
        
        {/* Инфо-плашка */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-[1.8rem] flex gap-4 items-start border border-slate-100 dark:border-slate-800">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">Безопасность и форматы</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Мы рекомендуем использовать приватные HTTP или SOCKS5 прокси. Изменения вступят в силу мгновенно для всех новых задач скачивания.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}