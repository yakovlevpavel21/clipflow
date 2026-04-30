import { useEffect } from 'react';
import { X, Clock, Plus, UploadCloud, CheckCircle2, Calendar, Zap, Play } from 'lucide-react';
import { VideoThumbnail } from './Helpers';

export default function TaskHistoryModal({ task, onClose }) {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!task) return null;

  // Опеределяем, вышло ли видео уже по времени
  const isLive = task.publishedAt && task.scheduledAt && new Date() >= new Date(task.scheduledAt);

  const phases = [
    {
      id: 'created',
      label: 'Задача создана',
      date: task.createdAt,
      icon: <Plus size={16} />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      description: 'Ролик добавлен в систему'
    },
    {
      id: 'claimed',
      label: 'Принято в работу',
      date: task.claimedAt,
      icon: <Zap size={16} />,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      description: 'Креатор подтвердил начало'
    },
    {
      id: 'uploaded',
      label: 'Реакция готова',
      date: task.reactionUploadedAt,
      icon: <UploadCloud size={16} />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      description: task.creator ? `Автор: ${task.creator.username}` : 'Файл загружен'
    },
    {
      id: 'published',
      label: 'Загружено на YouTube',
      date: task.publishedAt, // Менеджер нажал "Опубликовано"
      icon: <CheckCircle2 size={16} />,
      color: 'text-blue-600',
      bg: 'bg-blue-600/10',
      description: 'Менеджер подтвердил готовность'
    },
    {
      id: 'scheduled',
      label: 'Выход в эфир',
      // Показываем дату, даже если еще не вышло (для информации)
      date: isLive ? task.scheduledAt : (task.publishedAt ? task.scheduledAt : null), 
      icon: <Play size={16} fill={isLive ? "currentColor" : "none"} />,
      color: isLive ? 'text-indigo-500' : 'text-slate-400',
      bg: isLive ? 'bg-indigo-500/10' : 'bg-slate-50 dark:bg-[#262626]',
      description: isLive ? 'Видео доступно зрителям' : 'Ожидание времени публикации',
      // Специальный флаг для этого этапа
      forceDone: isLive 
    }
  ];

  const formatFullDate = (date) => {
    const d = new Date(date);
    return {
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    };
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 md:p-4 font-['Inter'] overflow-hidden">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-lg h-full md:h-auto md:max-h-[85vh] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333333] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#333333] shrink-0 bg-white dark:bg-[#1f1f1f]">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600/10 text-blue-600 rounded-lg flex items-center justify-center">
               <Clock size={18} />
             </div>
             <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Лог активности</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 no-scrollbar space-y-10">
          
          {/* КОНТЕКСТ */}
          <div className="flex gap-4 p-4 bg-slate-50 dark:bg-[#161616] rounded-2xl border border-slate-100 dark:border-[#333333]">
             <VideoThumbnail 
                src={task.originalVideo?.thumbnailPath} 
                duration={task.originalVideo?.duration}
                className="w-24 h-[54px] rounded-lg shadow-sm"
             />
             <div className="flex-1 min-w-0 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter mb-0.5">{task.channel?.name}</p>
                <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight truncate">
                  {task.originalVideo?.title}
                </h4>
             </div>
          </div>

          {/* ТАЙМЛАЙН */}
          <div className="flex flex-col">
            {phases.map((phase, i) => {
              const isDone = phase.id === 'scheduled' ? isLive : !!phase.date;
              const isLast = i === phases.length - 1;
              const dateInfo = isDone ? formatFullDate(phase.date) : (phase.id === 'scheduled' && task.scheduledAt ? formatFullDate(task.scheduledAt) : null);

              return (
                <div key={phase.id} className="flex gap-5">
                  
                  {/* ЛИНИЯ И ИКОНКА */}
                  <div className="flex flex-col items-center">
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 ${
                      isDone 
                        ? phase.bg + ' ' + phase.color + ' border-transparent' 
                        : 'bg-slate-50 dark:bg-[#262626] text-slate-300 border-dashed border-slate-200 dark:border-[#333333]'
                    }`}>
                      {phase.icon}
                    </div>
                    
                    {!isLast && (
                      <div className={`w-px h-10 my-1 transition-colors ${
                        isDone && !!phases[i+1].date ? 'bg-blue-500' : 'bg-slate-100 dark:bg-[#333333]'
                      }`} />
                    )}
                  </div>

                  {/* ТЕКСТ */}
                  <div className={`flex-1 flex justify-between items-start pt-1 min-w-0 ${!isDone ? 'opacity-40' : ''}`}>
                    <div className="min-w-0">
                      <h4 className="text-[14px] font-bold text-slate-900 dark:text-white truncate">
                          {phase.label}
                      </h4>
                      <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                          {isDone ? phase.description : (phase.id === 'scheduled' && task.scheduledAt ? 'Запланировано' : 'Ожидание...')}
                      </p>
                    </div>
                    
                    {/* Дату показываем, если этап готов ИЛИ если это запланированное время на будущее */}
                    {dateInfo && (
                      <div className={`text-right shrink-0 ml-4 ${!isDone ? 'opacity-50' : ''}`}>
                        <p className="text-[12px] font-bold text-slate-900 dark:text-white tabular-nums leading-none mb-1">
                            {dateInfo.time}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter opacity-70">
                            {dateInfo.date}
                        </p>
                      </div>
                    )}
                </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-[#333333] bg-slate-50/50 dark:bg-black/20 text-center">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Lifecycle Analytics</span>
        </div>
      </div>
    </div>
  );
}