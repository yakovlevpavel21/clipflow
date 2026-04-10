import { memo } from 'react';

const ChannelFilters = ({ channels, selectedChannel, onSelect }) => {
  return (
    <div className="sticky top-0 lg:top-0 max-lg:top-[64px] z-40 bg-slate-50 dark:bg-[#0a0f1c] -mx-4 px-4 border-b dark:border-slate-800 transition-all">
      {/* py-3 достаточно для очень мягкой тени */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3 px-1">
        
        {/* Кнопка ВСЕ */}
        <button
          onClick={() => onSelect('all')}
          className={`px-5 py-2 rounded-xl text-[11px] font-extrabold whitespace-nowrap border transition-all active:scale-95 ${
            selectedChannel === 'all'
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/15' 
              : 'bg-white dark:bg-[#1a1f2e] border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'
          }`}
        >
          ВСЕ КАНАЛЫ
        </button>

        {/* Список каналов */}
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelect(ch.id)}
            className={`px-5 py-2 rounded-xl text-[11px] font-extrabold whitespace-nowrap border transition-all active:scale-95 ${
              selectedChannel === ch.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/15'
                : 'bg-white dark:bg-[#1a1f2e] border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'
            }`}
          >
            {ch.name.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default memo(ChannelFilters);