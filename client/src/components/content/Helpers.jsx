import { Clock, CheckCircle2, AlertCircle, Zap, List, Info, Film, ImageOff, Sparkles } from 'lucide-react';
import { useState } from 'react';

// Иконки (для мобилок и Dashboards)
export function StatusIcon({ task, size = 16 }) {
  if (task.status === 'PUBLISHED') return <CheckCircle2 size={size} className="text-emerald-500" />;
  if (task.needsFixing) return <AlertCircle size={size} className="text-red-500 animate-pulse" />;
  if (task.status === 'REACTION_UPLOADED') return <Clock size={size} className="text-blue-500" />;
  if (task.status === 'AWAITING_REACTION' && task.creatorId) {
    return <Sparkles size={size} className="text-indigo-500 dark:text-indigo-400" />;
  }
  if (task.status === 'IN_PROGRESS') return <Zap size={size} className="text-amber-500" />;
  return <List size={size} className="text-slate-400" />;
}

// Профессиональные бейджи для ПК (с поддержкой троеточия)
export function StatusBadge({ task }) {
  const baseClass = "flex items-center justify-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border w-[120px] shrink-0 overflow-hidden whitespace-nowrap";

  const renderBadge = (config) => (
    <div className={`${baseClass} ${config.bg} ${config.text} ${config.border}`} title={config.label}>
      <config.icon size={12} className="shrink-0" />
      <span className="truncate">{config.label}</span>
    </div>
  );

  if (task.status === 'AWAITING_REACTION' && task.creatorId) {
    return renderBadge({
      label: 'Новое',
      icon: Sparkles,
      bg: 'bg-indigo-50 dark:bg-indigo-500/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-500/20'
    });
  }

  if (task.status === 'PUBLISHED') {
    return renderBadge({
      label: 'Готово',
      icon: CheckCircle2,
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-500/20'
    });
  }

  if (task.needsFixing) {
    return (
      <div className="relative group/status inline-flex w-[120px] shrink-0 justify-center">
        {/* Бейдж внутри теперь на 100% ширины обертки */}
        <div className={`${baseClass} w-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20 animate-pulse cursor-help`}>
          <AlertCircle size={12} className="shrink-0" />
          <span className="truncate">Правки</span>
        </div>

        {task.rejectionReason && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/status:block w-64 p-3 bg-white dark:bg-[#282828] border border-slate-200 dark:border-[#444444] text-slate-700 dark:text-white text-[11px] rounded-xl shadow-2xl z-[100] text-center italic leading-relaxed animate-in fade-in zoom-in-95 whitespace-normal">
            <div className="not-italic font-black text-[9px] text-red-500 uppercase mb-1 opacity-80">Причина правок:</div>
            «{task.rejectionReason}»
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white dark:border-t-[#282828]"></div>
          </div>
        )}
      </div>
    );
  }

  if (task.status === 'REACTION_UPLOADED') {
    return renderBadge({
      label: 'Проверка',
      icon: Clock,
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-500/20'
    });
  }

  if (task.status === 'IN_PROGRESS') {
    return renderBadge({
      label: 'В работе',
      icon: Zap,
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-500/20'
    });
  }

  return renderBadge({
    label: 'В очереди',
    icon: List,
    bg: 'bg-slate-50 dark:bg-slate-500/10',
    text: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-100 dark:border-slate-500/20'
  });
}

export function getRelativeTime(date) {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000); // в секундах

  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} д. назад`;
  if (diff < 2592000) return `${Math.floor(diff / 604800)} нед. назад`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} мес. назад`;
  return `${Math.floor(diff / 31536000)} г. назад`;
}

export function DateInfo({ task, relative = false }) {
  const dateToDisplay = task.updatedAt;
  
  if (!dateToDisplay) return <span className="text-[11px] text-slate-500">---</span>;

  if (relative) {
    return (
      <span className="text-[12px] text-slate-900 dark:text-[#ffffff] tabular-nums whitespace-nowrap">
        {getRelativeTime(dateToDisplay)}
      </span>
    );
  }

  const d = new Date(dateToDisplay);
  const formattedDate = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <span className="text-[13px] min-[1150px]:text-[11px] text-slate-500 dark:text-[#cccccc] whitespace-nowrap font-medium">
      {formattedDate}, {formattedTime}
    </span>
  );
}

export function VideoThumbnail({ src, duration, className = "" }) {
  const [isError, setIsError] = useState(false);

  const formatDuration = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-black flex items-center justify-center shrink-0 overflow-hidden ${className}`}>
      {(!src || isError) ? (
        <div className="flex flex-col items-center gap-1 opacity-20 text-white">
          <Film size={24} />
          <span className="text-[8px] font-black uppercase tracking-tighter">No Preview</span>
        </div>
      ) : (
        <img 
          src={src.startsWith('http') ? src : `/${src}`} 
          className="w-full h-full object-cover transition-opacity duration-300" 
          alt=""
          onError={() => setIsError(true)}
        />
      )}
      
      {/* Длительность */}
      <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-[2px] px-1.5 py-0.5 rounded text-[10px] font-bold text-white tabular-nums border border-white/10">
        {formatDuration(duration)}
      </div>
    </div>
  );
}