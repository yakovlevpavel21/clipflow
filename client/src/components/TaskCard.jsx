// client/src/components/TaskCard.jsx
import { memo } from 'react';
import { Download, Play, Clock, UserCheck, Undo2, FileVideo, Eye, RotateCcw, AlertCircle, PlayCircle } from 'lucide-react';
import { getDownloadUrl } from '../api';

const TaskCard = ({ task, mode, onClaim, onAbandon, onUpload, onPreview, onCancelUpload }) => {
  const thumbUrl = `/${task.originalVideo?.thumbnailPath}`;
  const isHistory = mode === 'history';
  const isMy = mode === 'my';
  const isAvailable = mode === 'available';

  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  
  const getBorderStyle = () => {
    if (task.needsFixing) return 'border-red-500/40 bg-red-50/5 dark:bg-red-900/5';
    if (isMy) return 'border-blue-500/40 bg-blue-50/5 dark:bg-blue-900/5';
    return 'border-slate-200 dark:border-slate-800';
  };

  return (
    <div className={`bg-white dark:bg-[#0f172a] rounded-2xl border p-3 flex flex-col md:flex-row gap-4 transition-all shadow-sm ${getBorderStyle()}`}>
      
      {/* ПРЕВЬЮ */}
      <div className="relative w-full md:w-44 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-md group/img">
        <img src={thumbUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="" />
        <img src={thumbUrl} className="absolute inset-0 w-full h-full object-contain z-10" />
        
        {/* Время видео прямо на превью */}
        <div className="absolute bottom-2 right-2 z-20 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white tabular-nums border border-white/10">
          {formatDuration(task.originalVideo?.duration)}
        </div>

        <div 
          onClick={(e) => { e.stopPropagation(); onPreview(task, (isHistory || (isMy && task.reactionFilePath)) ? 'reaction' : 'original'); }}
          className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer bg-black/20 md:opacity-0 group-hover/img:opacity-100 transition-opacity"
        >
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30"><Play fill="white" size={16} /></div>
        </div>
      </div>

      {/* ИНФОРМАЦИЯ */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex flex-wrap items-center gap-2">
             <span className="text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">{task.channel?.name}</span>
             {task.needsFixing && isMy && <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 uppercase animate-pulse"><AlertCircle size={12}/> Исправить</span>}
          </div>
          <span className="text-[10px] font-bold text-slate-400 tabular-nums">{new Date(task.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        
        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate uppercase mb-3">{task.originalVideo?.title}</h3>

        {task.needsFixing && isMy && (
          <div className="mb-3 p-2 bg-red-100/30 dark:bg-red-900/10 rounded-lg border border-red-200/50 text-[11px] text-red-800 dark:text-red-200 italic leading-tight">
            «{task.rejectionReason}»
          </div>
        )}

        {/* КНОПКИ (Адаптивные) */}
        <div className="flex flex-wrap items-center gap-2 mt-auto">
          {isAvailable && (
            <button onClick={(e) => { e.stopPropagation(); onClaim(); }} className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase active:scale-95 transition-all">Взять в работу</button>
          )}

          {isMy && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button onClick={(e) => { e.stopPropagation(); onUpload(); }} className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase active:scale-95 transition-all">
                {task.needsFixing ? "Заменить" : "Готово"}
              </button>
              {task.needsFixing && (
                <button onClick={(e) => { e.stopPropagation(); onPreview(task, 'reaction'); }} className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20"><FileVideo size={18}/></button>
              )}
              <a href={getDownloadUrl(task.originalVideo.filePath)} onClick={(e) => e.stopPropagation()} className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:text-blue-500 transition-colors border dark:border-slate-700"><Download size={18}/></a>
              <button onClick={(e) => { e.stopPropagation(); onAbandon(); }} className="p-2.5 text-slate-300 hover:text-red-500"><Undo2 size={18}/></button>
            </div>
          )}

          {isHistory && (
            <div className="flex items-center gap-2 w-full">
              <button onClick={(e) => { e.stopPropagation(); onPreview(task, 'reaction'); }} className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-4 py-2 rounded-xl text-[10px] font-bold uppercase">Мой ответ</button>
              <button onClick={(e) => { e.stopPropagation(); onPreview(task, 'original'); }} className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 px-4 py-2 rounded-xl text-[10px] font-bold uppercase">Оригинал</button>
              {task.status === 'REACTION_UPLOADED' && (
                <button onClick={(e) => { e.stopPropagation(); onCancelUpload(task.id); }} className="text-red-500 font-bold text-[10px] uppercase ml-auto px-2">Отозвать</button>
              )}
              {task.status === 'PUBLISHED' && task.youtubeUrl && (
                <button onClick={(e) => { e.stopPropagation(); window.open(task.youtubeUrl, '_blank'); }} className="p-2 bg-red-500 text-white rounded-xl ml-auto"><PlayCircle size={16}/></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(TaskCard);