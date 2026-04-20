import { memo } from 'react';
import { Plus, Trash2, Settings2, ExternalLink, Tv } from 'lucide-react';

const ChannelsTab = ({ channels, onAdd, onEdit, onDelete }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Управление каналами</h3>
        </div>
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-blue-600/20"
        >
          <Plus size={16} />
          <span>Добавить</span>
        </button>
      </div>

      {/* СЕТКА КАНАЛОВ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map(c => (
          <div 
            key={c.id} 
            className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-[#333333] shadow-sm flex flex-col p-5 transition-all hover:border-blue-500/30 group"
          >
            {/* ШАПКА КАРТОЧКИ */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-50 dark:bg-[#222222] border border-slate-100 dark:border-[#333333] shrink-0">
                   <img 
                     src={c.thumbnailPath ? `/${c.thumbnailPath}` : `https://ui-avatars.com/api/?name=${c.name}&background=random`} 
                     className="w-full h-full object-cover" 
                     alt={c.name} 
                   />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-[#f1f1f1] text-[15px] truncate leading-tight mb-1">
                    {c.name}
                  </p>
                  {c.youtubeUrl && (
                    <a 
                      href={c.youtubeUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-[10px] font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors tracking-tight"
                    >
                      YouTube <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
              
              {/* КНОПКА УДАЛЕНИЯ */}
              <button 
                onClick={() => onDelete('channels', c.id)} 
                className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-90"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* КНОПКА НАСТРОЕК (ВЫЗЫВАЕТ МОДАЛКУ В ADMINPAGE) */}
            <button 
              onClick={() => onEdit(c)}
              className="w-full mt-auto py-3 bg-slate-50 dark:bg-[#262626] rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:border-blue-500/20 border border-transparent transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Settings2 size={14} /> 
              Конфигурация
            </button>
          </div>
        ))}
      </div>

      {/* ЗАГЛУШКА, ЕСЛИ ПУСТО */}
      {channels.length === 0 && (
        <div className="py-24 text-center border-2 border-dashed border-slate-100 dark:border-[#262626] rounded-3xl">
          <Tv className="mx-auto text-slate-200 dark:text-[#262626] mb-4 opacity-40" size={48} />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] opacity-60">Список каналов пуст</p>
          <button 
            onClick={onAdd}
            className="mt-6 text-blue-600 font-bold text-[10px] uppercase tracking-widest hover:underline"
          >
            Подключить первый канал
          </button>
        </div>
      )}
    </div>
  );
};

export default memo(ChannelsTab);