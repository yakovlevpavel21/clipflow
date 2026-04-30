import { memo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const FilterBottomSheet = ({ title, options, selectedValues, onToggle, onApply, onClose, labelKey = 'name' }) => {
  
  // Блокировка скролла фона
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100000] pointer-events-none flex items-end justify-center">
      {/* Фон: только затемнение, без размытия */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
        onClick={onClose} 
        className="absolute inset-0 bg-black/60 pointer-events-auto" 
      />

      {/* Шторка */}
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className="relative w-[calc(100%-32px)] max-w-sm bg-white dark:bg-[#1c1c1c] rounded-3xl p-3 pb-6 mb-6 pointer-events-auto shadow-2xl border border-slate-100 dark:border-[#333333] flex flex-col max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Хэндл */}
        <div className="w-10 h-1 bg-slate-200 dark:bg-[#444444] rounded-full mx-auto my-2 mb-4 shrink-0" />

        {/* HEADER: Заголовок + Галочка (без кнопки сброса) */}
        <div className="flex items-center justify-between px-4 mb-4 shrink-0">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{title}</h3>
          
          <button 
            onClick={onApply}
            className="w-8 h-8 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 rounded-lg flex items-center justify-center transition-all active:scale-90"
          >
            <Check size={18} strokeWidth={3} />
          </button>
        </div>

        {/* Список элементов с небольшим расстоянием */}
        <div className="overflow-y-auto custom-scrollbar flex-1 px-1 space-y-1">
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => onToggle(opt.id)}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-xl transition-all active:scale-[0.98] ${
                  isSelected 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-700 dark:text-[#eeeeee]'
                }`}
              >
                <span className={`text-[14px] truncate pr-4 ${isSelected ? 'font-bold' : 'font-medium'}`}>
                  {opt[labelKey] || opt.name}
                </span>
                {isSelected && <Check size={16} strokeWidth={4} />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>,
    document.body
  );
};

export default memo(FilterBottomSheet);