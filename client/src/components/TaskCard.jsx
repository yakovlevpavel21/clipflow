import { memo, useState } from 'react';
import { 
  Download, Play, Clock, Trash2, Edit3,
  AlertCircle, Loader2, User, Send, CheckCircle2 
} from 'lucide-react';
import { getDownloadUrl } from '../api';

const TaskCard = ({ 
  task, 
  role = 'creator', 
  onUpload, 
  onPreview, 
  onPublish,
  onEdit,
  onDelete
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!task || !task.originalVideo) return null;

  const thumbUrl = `/${task.originalVideo.thumbnailPath}`;
  const isManager = role === 'manager';
  const isUploaded = task.status === 'REACTION_UPLOADED';

  const statusStyles = {
    AWAITING_REACTION: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30',
    IN_PROGRESS: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30',
    REACTION_UPLOADED: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    PUBLISHED: 'bg-emerald-500 text-white',
  };

  // --- ФОРМАТИРОВАНИЕ ---
  const formatDuration = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  const deadline = (() => {
    if (!task.deadline) return null;
    const d = new Date(task.deadline);
    const now = new Date();
    return {
      text: `${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      isOverdue: d < now && task.status !== 'PUBLISHED'
    };
  })();

  const handleDownload = async (e) => {
    e.stopPropagation();
    if (isDownloading) return;
    const videoFileName = `${task.originalVideo.videoId || 'video'}.mp4`;
    const url = window.location.origin + getDownloadUrl(task.originalVideo.filePath, videoFileName);
    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone && /iPhone|iPad|iPod/i.test(navigator.userAgent) && navigator.share) {
      setIsDownloading(true);
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], videoFileName, { type: 'video/mp4' });
        setIsDownloading(false);
        await navigator.share({ files: [file] });
      } catch (err) {
        setIsDownloading(false);
        if (err.name !== 'AbortError') window.open(url, '_blank');
      }
    } else {
      const link = document.createElement('a'); link.href = url; link.download = videoFileName;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }
  };

  return (
    <div id={`task-${task.id}`} className={`group relative bg-white dark:bg-[#0f172a] rounded-[2rem] border p-3 flex flex-col md:flex-row gap-4 transition-all hover:shadow-md ${task.needsFixing ? 'border-red-500/30 ring-1 ring-red-500/5' : 'border-slate-200 dark:border-slate-800 shadow-sm'}`}>
      
      {/* 1. ПРЕВЬЮ */}
      <div className="relative w-full md:w-48 aspect-video rounded-2xl overflow-hidden bg-black shrink-0 border dark:border-white/5">
        <img src={thumbUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="" />
        <img src={thumbUrl} className="absolute inset-0 w-full h-full object-contain z-10" alt="" />
        
        <div className="absolute bottom-2 right-2 z-20 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-white tabular-nums border border-white/10">
          {formatDuration(task.originalVideo.duration)}
        </div>

        {/* Кнопки Менеджера ПОВЕРХ превью */}
        {isManager && (
          <div className="absolute top-2 right-2 z-30 flex gap-1.5 md:hidden">
            <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white border border-white/20"><Edit3 size={16}/></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-2 bg-red-500/80 backdrop-blur-md rounded-xl text-white border border-red-400/20"><Trash2 size={16}/></button>
          </div>
        )}

        <div onClick={(e) => { e.stopPropagation(); onPreview(task, isUploaded ? 'reaction' : 'original'); }} className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer bg-black/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 hover:scale-110 transition-transform">
            <Play fill="white" size={20} className="ml-1" />
          </div>
        </div>
      </div>

      {/* 2. ИНФОРМАЦИЯ */}
      <div className="flex-1 flex flex-col min-w-0 py-0.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-2 py-0.5 rounded-lg shadow-sm">
              {task.channel?.name || 'Clipsio'}
            </span>
            
            {/* СТАТУС ДЛЯ КРЕАТОРА (Зеленый) */}
            {!isManager && isUploaded && (
              <span className="text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                <CheckCircle2 size={12} /> На проверке
              </span>
            )}

            {/* СТАТУС ДЛЯ МЕНЕДЖЕРА (Берется из statusStyles) */}
            {isManager && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${statusStyles[task.status] || statusStyles.AWAITING_REACTION}`}>
                {isUploaded ? 'ГОТОВО' : 'АКТИВНО'}
              </span>
            )}

            {deadline && !isUploaded && (
              <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg ${deadline.isOverdue ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                <Clock size={12} /> <span className="tabular-nums uppercase">До: {deadline.text}</span>
              </div>
            )}
          </div>

          <span className="text-[10px] font-bold text-slate-400 tabular-nums shrink-0 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
            {new Date(isManager ? task.createdAt : task.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </span>
        </div>
        
        <h3 className="text-[14px] md:text-[15px] font-bold text-slate-900 dark:text-white leading-tight truncate uppercase mb-2">
          {task.originalVideo.title}
        </h3>

        {!isManager && task.needsFixing && (
          <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-100 dark:border-red-900/50 flex gap-2 items-start animate-in slide-in-from-left-2">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-red-800 dark:text-red-300 italic leading-snug">{task.rejectionReason || "Нужны правки"}</p>
          </div>
        )}

        {/* 3. КНОПКИ ДЕЙСТВИЙ */}
        <div className="flex flex-wrap items-center gap-3 mt-auto pt-2 border-t border-slate-50 dark:border-slate-800/50">
          {!isManager ? (
            <div className="flex items-center gap-2 w-full">
              <button onClick={(e) => { e.stopPropagation(); onUpload(); }} className="flex-1 md:flex-none md:min-w-[140px] bg-blue-600 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase active:scale-95 shadow-md transition-all">
                {isUploaded || task.needsFixing ? "Заменить" : "Загрузить"}
              </button>
              <button disabled={isDownloading} onClick={handleDownload} className={`p-2.5 rounded-xl border flex items-center justify-center min-w-[42px] ${isDownloading ? 'bg-slate-50 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-transparent'}`}>
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18}/>}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase">
                <User size={14} className="text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">{task.creator?.username || '---'}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border dark:border-slate-700">
                   <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1.5 text-slate-400 hover:text-blue-500"><Edit3 size={15}/></button>
                   <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1.5 text-slate-400 hover:text-red-500"><Trash2 size={15}/></button>
                </div>
                {isUploaded && (
                  <button onClick={(e) => { e.stopPropagation(); onPublish(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                    <Send size={12}/> Выложить
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(TaskCard);