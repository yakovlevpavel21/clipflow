import { Loader2, AlertCircle, RefreshCcw } from 'lucide-react';

export default function PageStatus({ loading, error, onRetry }) {
  // Состояние загрузки
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-in fade-in duration-500">
        <Loader2 className="animate-spin text-blue-600" size={42} strokeWidth={2} />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Загрузка...
        </span>
      </div>
    );
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center shadow-lg border border-red-100 dark:border-red-900/30">
          <AlertCircle size={32} />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Ошибка загрузки</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto font-medium">
            {error || "Не удалось получить данные с сервера. Проверьте соединение."}
          </p>
        </div>
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-xl"
        >
          <RefreshCcw size={16} /> Повторить попытку
        </button>
      </div>
    );
  }

  return null;
}