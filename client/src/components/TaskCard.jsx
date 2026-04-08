import { memo, useState } from 'react';
import { Download, Play, Clock, Undo2, FileVideo, AlertCircle, PlayCircle, Loader2 } from 'lucide-react';
import { getDownloadUrl, fetchFileAsBlob } from '../api';

const TaskCard = ({ task, mode, onClaim, onAbandon, onUpload, onPreview, onCancelUpload }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // ... (форматирование времени и дедлайнов оставляем как было) ...
  const thumbUrl = `/${task.originalVideo?.thumbnailPath}`;
  const isHistory = mode === 'history';
  const isMy = mode === 'my';
  const isAvailable = mode === 'available';

  const handleDownload = async (e) => {
    e.stopPropagation();
    
    const videoFileName = `${task.originalVideo?.videoId || 'video'}.mp4`;
    const url = window.location.origin + getDownloadUrl(task.originalVideo?.filePath, videoFileName);

    // Если это iOS PWA, используем Share API (самый надежный способ)
    const isPWA = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;

    if (isPWA && navigator.share) {
      setIsDownloading(true);
      try {
        const blob = await fetchFileAsBlob(url);
        const file = new File([blob], videoFileName, { type: 'video/mp4' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: videoFileName,
          });
        } else {
          // Если Share API не потянул файл, просто открываем в новом окне (как фоллбек)
          window.open(url, '_blank');
        }
      } catch (err) {
        console.error("Download error:", err);
        window.open(url, '_blank');
      } finally {
        setIsDownloading(false);
      }
    } else {
      // Для обычного ПК и Android просто качаем
      const link = document.createElement('a');
      link.href = url;
      link.download = videoFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`bg-white dark:bg-[#0f172a] rounded-2xl border p-3 flex flex-col md:flex-row gap-4 transition-all hover:shadow-md ${task.needsFixing ? 'border-red-500/40 bg-red-50/5' : 'border-slate-200 dark:border-slate-800'}`}>
      
      {/* ПРЕВЬЮ */}
      <div className="relative w-full md:w-44 aspect-video rounded-xl overflow-hidden bg-black shrink-0 shadow-sm border dark:border-white/5">
        <img src={thumbUrl} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <img src={thumbUrl} className="absolute inset-0 w-full h-full object-contain z-10" />
        <div 
          onClick={(e) => { e.stopPropagation(); onPreview(task, (isHistory || (isMy && task.reactionFilePath)) ? 'reaction' : 'original'); }}
          className="absolute inset-0 z-30 flex items-center justify-center cursor-pointer bg-black/20"
        >
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 transition-transform active:scale-90">
            <Play fill="white" size={16} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 py-0.5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
            {task.channel?.name}
          </span>
          <span className="text-[10px] font-bold text-slate-400 tabular-nums">
            {new Date(task.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </span>
        </div>
        
        <h3 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate uppercase mb-2">
          {task.originalVideo?.title}
        </h3>

        {task.needsFixing && isMy && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50 flex gap-2 items-start text-[11px] text-red-800 dark:text-red-300 italic">
            <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
            <p>{task.rejectionReason}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
          {isAvailable && (
            <button onClick={(e) => { e.stopPropagation(); onClaim(); }} className="w-full md:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase active:scale-95 transition-all shadow-md shadow-blue-500/10">Взять в работу</button>
          )}

          {isMy && (
            <div className="flex items-center gap-2 w-full">
              <button onClick={(e) => { e.stopPropagation(); onUpload(); }} className="flex-1 md:flex-none md:min-w-[140px] bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase active:scale-95 transition-all shadow-md">Загрузить ответ</button>
              <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                <button 
                  disabled={isDownloading}
                  onClick={handleDownload} 
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-center min-w-[42px] ${isDownloading ? 'bg-slate-50 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                >
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18}/>}
                </button>
                <button onClick={(e) => { e.stopPropagation(); onAbandon(); }} className="p-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-400 hover:text-red-500 transition-colors rounded-xl border dark:border-slate-800"><Undo2 size={18}/></button>
              </div>
            </div>
          )}

          {isHistory && (
            <div className="flex items-center gap-2 w-full">
              <button onClick={(e) => { e.stopPropagation(); onPreview(task, 'reaction'); }} className="flex-1 md:flex-none bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase border dark:border-slate-700">Мой ответ</button>
              <button onClick={(e) => { e.stopPropagation(); onPreview(task, 'original'); }} className="flex-1 md:flex-none bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase border dark:border-slate-700">Оригинал</button>
              <div className="flex items-center gap-1.5 ml-auto">
                <button disabled={isDownloading} onClick={handleDownload} className="p-2 text-slate-400 hover:text-blue-500">
                  {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18}/>}
                </button>
                {task.status === 'PUBLISHED' && task.youtubeUrl && (
                  <button onClick={(e) => { e.stopPropagation(); window.open(task.youtubeUrl, '_blank'); }} className="p-2 bg-red-500 text-white rounded-xl active:scale-90 transition-all shadow-lg shadow-red-500/20"><PlayCircle size={18}/></button>
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