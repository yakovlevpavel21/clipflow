import { useState, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Clock } from 'lucide-react';

const HourlyPicker = ({ label, icon: Icon, value, onChange, minDate, minHour }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, openUp: false });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const portalRef = useRef(null);

  const [datePart, timePart] = value ? value.split('T') : ['', '00:00'];
  const currentHour = timePart ? parseInt(timePart.split(':')[0]) : 0;
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuHeight = 190; // Примерная высота выпадающего списка
      const spaceBelow = window.innerHeight - rect.bottom;
      const shouldOpenUp = spaceBelow < menuHeight;

      setCoords({
        // Если открываемся вверх, считаем от верхней границы кнопки минус высота меню
        top: shouldOpenUp ? rect.top - menuHeight - 8 : rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        openUp: shouldOpenUp
      });
    }
  };

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) updateCoords();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current?.contains(e.target) || portalRef.current?.contains(e.target)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updateCoords);
      // Следим за скроллом внутри модалки, чтобы список не отрывался
      window.addEventListener('scroll', updateCoords, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords, true);
    };
  }, [isOpen]);

  const handleHourSelect = (e, h) => {
    e.preventDefault(); e.stopPropagation();
    const hourStr = String(h).padStart(2, '0');
    onChange(`${datePart || minDate}T${hourStr}:00`);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
        {Icon && <Icon size={12} />} {label}
      </label>

      <div className="flex gap-2">
        <input
          type="date"
          min={minDate}
          value={datePart}
          onChange={(e) => {
            let selectedDate = e.target.value;
            // Принудительная проверка для iOS: если дата в прошлом, ставим minDate
            if (minDate && selectedDate < minDate) {
              selectedDate = minDate;
            }
            onChange(`${selectedDate}T${String(currentHour).padStart(2, '0')}:00`);
          }}
          className="flex-1 h-[46px] bg-slate-50 dark:bg-[#161616] px-4 rounded-xl border border-slate-200 dark:border-[#333333] text-[13px] font-bold outline-none focus:border-blue-600 transition-all text-slate-900 dark:text-[#f1f1f1] dark:[color-scheme:dark]"
        />

        <button
          ref={buttonRef} type="button" onClick={toggleDropdown}
          className={`w-28 h-[46px] flex items-center justify-between px-4 rounded-xl border transition-all shrink-0 ${isOpen ? 'bg-white dark:bg-[#1f1f1f] border-blue-600 ring-4 ring-blue-600/10' : 'bg-slate-50 dark:bg-[#161616] border-slate-200 dark:border-[#333333]'
            }`}
        >
          <span className="text-[13px] font-bold text-slate-900 dark:text-[#f1f1f1]">{String(currentHour).padStart(2, '0')}:00</span>
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && createPortal(
          <div
            ref={portalRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 999999
            }}
            className={`bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#444444] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${coords.openUp ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'}`}
          >
            <div className="max-h-[180px] overflow-y-auto py-1 custom-scrollbar">
              {hours.map(h => {
                const isPast = datePart === minDate && h < minHour;
                const isSelected = h === currentHour;
                return (
                  <button
                    key={h} type="button" disabled={isPast} onMouseDown={(e) => handleHourSelect(e, h)}
                    className={`w-full px-4 py-2.5 text-left text-[12px] font-bold transition-all ${isPast ? 'opacity-20 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'} ${isSelected ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-[#bbbbbb]'}`}
                  >
                    <div className="flex items-center justify-between pointer-events-none">
                      <span>{String(h).padStart(2, '0')}:00</span>
                      {isSelected && <Clock size={10} className="opacity-60" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

export default memo(HourlyPicker);