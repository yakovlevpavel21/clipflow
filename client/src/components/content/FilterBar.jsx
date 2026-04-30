import { memo, useState, useEffect } from 'react';
import { ChevronDown, Layers, Activity, Users, Plus, X, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import FilterBottomSheet from './FilterBottomSheet';

const STATUS_OPTIONS = [
  {id: 'AWAITING_REACTION', name: 'Новые'},
  {id: 'IN_PROGRESS', name: 'В работе'},
  {id: 'REACTION_UPLOADED', name: 'На проверке'},
  {id: 'FIXING', name: 'Правки'},
  {id: 'PUBLISHED', name: 'Опубликовано'}
];

const FilterBar = ({ filters, setFilters, channels, creators, isManager, onAddTask }) => {
  const [activeMenu, setActiveMenu] = useState(null);
  const [tempValues, setTempValues] = useState([]); // Временные значения для шторки
  const isMobile = window.innerWidth < 850;

  // При открытии меню копируем текущие фильтры во временное состояние
  const handleOpen = (key) => {
    setTempValues(filters[key]);
    setActiveMenu(key);
  };

  // Переключение внутри шторки (только временное состояние)
  const toggleTemp = (id) => {
    setTempValues(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  // Применить — отправляем временные данные в основной фильтр
  const applyFilters = () => {
    setFilters(prev => ({ ...prev, [activeMenu]: tempValues }));
    setActiveMenu(null);
  };

  // Сброс конкретного фильтра (X на кнопке)
  const clearFilter = (e, key) => {
    e.stopPropagation();
    setFilters(prev => ({ ...prev, [key]: [] }));
  };

  // Хелпер для текста на кнопке
  const getLabel = (key, defaultLabel, options, labelKey = 'name') => {
    const selected = filters[key];
    if (selected.length === 0) return defaultLabel;
    
    // Находим имена выбранных объектов
    const names = options
      .filter(opt => selected.includes(opt.id))
      .map(opt => opt[labelKey] || opt.name);
    
    return names.join(', ');
  };

  return (
    <div className="sticky top-[calc(51px+env(safe-area-inset-top))] min-[1150px]:top-0 z-[60] h-[56px] mt-[-1px] flex items-center justify-between gap-4 px-4 md:px-8 bg-[#f9fafb] dark:bg-[#1f1f1f] transition-colors">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1 overflow-y-visible">
        
        <FilterBtn 
          label={getLabel('channelId', 'Каналы', channels)} 
          icon={<Layers size={14}/>} 
          isActive={filters.channelId.length > 0}
          isOpen={activeMenu === 'channelId'}
          onClick={() => handleOpen('channelId')}
          onClear={(e) => clearFilter(e, 'channelId')}
        />

        <FilterBtn 
          label={getLabel('status', 'Статусы', STATUS_OPTIONS)} 
          icon={<Activity size={14}/>} 
          isActive={filters.status.length > 0}
          isOpen={activeMenu === 'status'}
          onClick={() => handleOpen('status')}
          onClear={(e) => clearFilter(e, 'status')}
        />

        {isManager && (
          <FilterBtn 
            label={getLabel('creatorId', 'Авторы', creators, 'username')} 
            icon={<Users size={14}/>} 
            isActive={filters.creatorId.length > 0}
            isOpen={activeMenu === 'creatorId'}
            onClick={() => handleOpen('creatorId')}
            onClear={(e) => clearFilter(e, 'creatorId')}
          />
        )}
      </div>

      {isManager && (
        <button onClick={onAddTask} className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3 rounded-lg flex items-center gap-2 shadow-lg active:scale-95 shrink-0"><Plus size={18} /></button>
      )}

      <AnimatePresence>
        {activeMenu && (
          isMobile ? (
            <FilterBottomSheet 
              title={activeMenu === 'channelId' ? 'Каналы' : activeMenu === 'status' ? 'Статусы' : 'Авторы'}
              options={activeMenu === 'channelId' ? channels : activeMenu === 'status' ? STATUS_OPTIONS : creators}
              labelKey={activeMenu === 'creatorId' ? 'username' : 'name'}
              selectedValues={tempValues}
              onToggle={toggleTemp}
              onApply={applyFilters}
              onClose={() => setActiveMenu(null)}
            />
          ) : (
            <DesktopPopover 
              title={activeMenu === 'channelId' ? 'Каналы' : activeMenu === 'status' ? 'Статусы' : 'Авторы'}
              options={activeMenu === 'channelId' ? channels : activeMenu === 'status' ? STATUS_OPTIONS : creators}
              labelKey={activeMenu === 'creatorId' ? 'username' : 'name'}
              selectedValues={tempValues}
              onToggle={toggleTemp}
              onApply={applyFilters}
              onClose={() => setActiveMenu(null)}
              position={activeMenu === 'channelId' ? 'left-[32px]' : activeMenu === 'status' ? 'left-[140px]' : 'left-[250px]'}
            />
          )
        )}
      </AnimatePresence>
    </div>
  );
};

// Компонент для ПК с ГАЛОЧКОЙ
function DesktopPopover({ title, options, selectedValues, onToggle, onApply, onClose, labelKey, position }) {
  return (
    <>
      {/* Фон для ПК: прозрачный, только для закрытия по клику вне */}
      <div className="fixed inset-0 z-[110]" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        className={`absolute top-full mt-2 w-64 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#333333] rounded-xl shadow-2xl z-[120] py-2 overflow-hidden ${position}`}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b dark:border-[#262626] mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
          <button 
            onClick={onApply} 
            className="p-1.5 bg-blue-600/10 text-blue-600 rounded-md hover:bg-blue-600 hover:text-white transition-colors"
          >
            <Check size={14} strokeWidth={4} />
          </button>
        </div>
        
        {/* space-y-1 для одинакового расстояния как на мобилке */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar px-1 space-y-1">
          {options.map(opt => {
            const isSel = selectedValues.includes(opt.id);
            return (
              <button 
                key={opt.id} 
                onClick={() => onToggle(opt.id)} 
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isSel ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-[#cccccc] hover:bg-slate-50 dark:hover:bg-[#262626]'
                }`}
              >
                <span className={isSel ? 'font-bold' : ''}>{opt[labelKey] || opt.name}</span>
                {isSel && <Check size={16} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

function FilterBtn({ label, icon, isActive, onClick, onClear, isOpen }) {
  return (
    <button 
      onClick={onClick}
      /* rounded-lg для кнопок фильтров в баре */
      className={`flex items-center gap-1.5 pl-3 pr-1 py-1.5 rounded-lg border text-[13px] font-semibold transition-all shrink-0 max-w-[200px]
        ${isActive || isOpen
          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
          : 'bg-gray-200/50 dark:bg-[#2a2a2a] border-transparent text-slate-700 dark:text-[#ffffff]'}`}
    >
      <div className={(isActive || isOpen) ? 'text-white' : 'text-slate-400'}>{icon}</div>
      <span className="truncate leading-none">{label}</span>
      
      {isActive ? (
        <div onClick={onClear} className="ml-1 p-2 -my-1 -mr-1 hover:bg-black/10 active:bg-black/20 rounded-md transition-colors flex items-center justify-center">
          <X size={15} strokeWidth={3} />
        </div>
      ) : (
        <div className="p-1 px-1.5 opacity-40">
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      )}
    </button>
  );
}

export default memo(FilterBar);