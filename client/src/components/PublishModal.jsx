import { useState, useEffect } from 'react';
import { 
  X, Copy, RotateCcw, Check, Calendar, ExternalLink, 
  FileVideo, Eye, Loader2, PlayCircle, Download, Type, Clock
} from 'lucide-react';
import api, { getDownloadUrl } from '../api';
import HourlyPicker from './HourlyPicker';
import { toast } from 'sonner';

export default function PublishModal({ task, onClose, onSuccess }) {
  const [view, setView] = useState('reaction'); 
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [scheduledAt, setScheduledAt] = useState(
    task.scheduledAt ? new Date(task.scheduledAt).toISOString().slice(0, 16) : ''
  );

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowHour = now.getHours();

  const TITLE_LIMIT = 100;
  const isTitleTooLong = title.length > TITLE_LIMIT;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    const originalColor = themeMeta?.getAttribute('content');
    if (themeMeta) themeMeta.setAttribute('content', '#000000');

    if (task.scheduledAt) setScheduledAt(formatToDateTimeLocal(task.scheduledAt));
    
    const prefix = task.channel?.titlePrefix ? `${task.channel.titlePrefix}` : '';
    setTitle(`${prefix}${task.originalVideo.title}`.slice(0, 120));

    let desc = "";
    if (task.channel?.showOriginalLink) {
      desc += `${task.channel.originalLinkPrefix || ''}${task.originalVideo.url}\n\n`;
    }
    desc += task.channel?.descriptionFooter || "";
    setDescription(desc);

    if (!task.scheduledAt) {
      api.get(`/api/tasks/next-slot/${task.channelId}`).then(res => {
        const date = new Date(res.data.scheduledAt);
        setScheduledAt(formatToDateTimeLocal(date));
      }).catch(() => {});
    }

    return () => {
      document.body.style.overflow = '';
      if (themeMeta && originalColor) themeMeta.setAttribute('content', originalColor);
    };
  }, [task]);

  const formatToDateTimeLocal = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const handleCopy = (text, field) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Скопировано');
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Копирование даты и времени по отдельности для YouTube
  const copyDateTimePart = (part) => {
    if (!scheduledAt) return;
    const [date, time] = scheduledAt.split('T');
    if (part === 'date') {
      const [y, m, d] = date.split('-');
      handleCopy(`${d}.${m}.${y}`, 's_date');
    } else {
      handleCopy(time, 's_time');
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const fileName = `${task.originalVideo.videoId}_result.mp4`;
    const url = window.location.origin + getDownloadUrl(task.reactionFilePath, fileName);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsDownloading(false);
  };

  const onPublish = async () => {
    if (!youtubeUrl) return toast.error("Введите ссылку на Shorts");
    setLoading(true);
    try {
      await api.post(`/api/tasks/${task.id}/publish`, { youtubeUrl, scheduledAt, title, description });
      toast.success('Видео опубликовано и перенесено в архив');
      onSuccess();
    } catch (err) { 
      toast.error("Ошибка при сохранении данных публикации"); 
    } finally { setLoading(false); }
  };

  const onReject = async () => {
    if (!rejectionReason) return toast.error("Укажите причину для креатора");
    setLoading(true);
    try {
      await api.post(`/api/tasks/${task.id}/reject`, { reason: rejectionReason });
      toast.info('Задача возвращена креатору с правками');
      onSuccess();
    } catch (err) { 
      toast.error("Ошибка при отклонении");
      setLoading(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      {/* Клик по фону НЕ закрывает окно */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-2xl h-full md:h-auto md:max-h-[92vh] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333333] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-[#333333] shrink-0 bg-white dark:bg-[#1f1f1f] z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <PlayCircle size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Публикация</h2>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest leading-none mt-0.5">{task.channel.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-[#333333] rounded-full text-slate-400"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          
          {/* 1. PLAYER & TOGGLE ROW */}
          <div className="p-5 md:p-8 bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-[#333333] flex flex-col items-center">
  
            {/* Панель кнопок: Разнесена по краям */}
            <div className="flex items-center justify-between w-full max-w-2xl mb-5 px-1">
              {/* СЛЕВА: Переключатель */}
              <div className="flex bg-white dark:bg-[#161616] p-1 rounded-xl border border-slate-200 dark:border-[#333333] shadow-inner">
                <button 
                  onClick={() => setView('reaction')} 
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'reaction' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}
                >
                  Результат
                </button>
                <button 
                  onClick={() => setView('original')} 
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${view === 'original' ? 'bg-slate-700 dark:bg-[#333333] text-white shadow-lg' : 'text-slate-500'}`}
                >
                  Оригинал
                </button>
              </div>

              {/* СПРАВА: Скачивание */}
              <button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className="w-10 h-10 bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-600/20 rounded-xl flex items-center justify-center transition-all active:scale-90"
                title="Скачать результат"
              >
                {isDownloading ? <Loader2 size={18} className="animate-spin"/> : <Download size={18}/>}
              </button>
            </div>
            
            {/* ПЛЕЕР: Теперь ширина как у формы (max-w-2xl), строго 16:9 */}
            <div className="relative w-full max-w-2xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#333333]">
              <video key={view} className="w-full h-full object-contain" controls autoPlay playsInline preload="auto">
                <source 
                  src={view === 'reaction' ? `/${task.reactionFilePath}#t=0.001` : `/${task.originalVideo.filePath}#t=0.001`} 
                  type={view === 'reaction' ? (task.reactionFilePath?.endsWith('.mov') ? 'video/quicktime' : 'video/mp4') : 'video/mp4'} 
                />
              </video>
            </div>
          </div>

          {/* 2. FORM SECTION */}
          <div className="p-5 space-y-6">
            
            {/* TITLE */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Название</label>
                  <span className={`text-[10px] font-bold tabular-nums ${isTitleTooLong ? 'text-red-500' : 'text-slate-500'}`}>{title.length}/{TITLE_LIMIT}</span>
                </div>
                <button onClick={() => handleCopy(title, 'title')} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-md transition-colors"><Copy size={14}/></button>
              </div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={`w-full bg-slate-50 dark:bg-[#161616] p-3 rounded-xl border outline-none font-bold text-sm transition-all dark:text-white ${isTitleTooLong ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 dark:border-[#333333] focus:border-blue-600'}`} />
            </div>

            {/* DESCRIPTION */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Описание</label>
                 <button onClick={() => handleCopy(description, 'desc')} className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 rounded-md transition-colors"><Copy size={14}/></button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-32 bg-slate-50 dark:bg-[#161616] p-3 rounded-xl border border-slate-200 dark:border-[#333333] text-xs font-medium leading-relaxed outline-none focus:border-blue-600 resize-none dark:text-white no-scrollbar" />
            </div>

            {/* SCHEDULING ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
  
              {/* ПЛАН ВЫХОДА */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">План выхода</label>
                  <div className="flex gap-1">
                      <button onClick={() => copyDateTimePart('date')} className="p-1.5 bg-slate-100 dark:bg-[#262626] text-slate-400 rounded-md hover:text-blue-500 transition-colors"><Calendar size={12}/></button>
                      <button onClick={() => copyDateTimePart('time')} className="p-1.5 bg-slate-100 dark:bg-[#262626] text-slate-400 rounded-md hover:text-blue-500 transition-colors"><Clock size={12}/></button>
                  </div>
                </div>
                {/* HourlyPicker имеет внутреннюю высоту h-[46px] */}
                <HourlyPicker value={scheduledAt} minDate={today} minHour={0} onChange={(val) => setScheduledAt(val)} />
              </div>

              {/* ССЫЛКА НА ВИДЕО */}
              <div className="space-y-2">
                <div className="flex items-center h-[28px] px-1"> {/* Высота как у блока копирования слева для симметрии */}
                  <label className="text-[10px] font-black uppercase text-red-500 tracking-widest">YouTube Ссылка</label>
                </div>
                <input 
                  placeholder="https://youtube.com/shorts/..." 
                  value={youtubeUrl} 
                  onChange={(e) => setYoutubeUrl(e.target.value)} 
                  className="w-full h-[46px] bg-slate-50 dark:bg-[#161616] px-4 rounded-xl border border-red-200/50 dark:border-red-900/30 text-sm font-bold outline-none focus:border-red-500 dark:text-white transition-all shadow-inner" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS FOOTER */}
        <div className="p-4 border-t border-slate-100 dark:border-[#333333] bg-white dark:bg-[#1f1f1f] shrink-0">
          {isRejecting ? (
            <div className="space-y-3 animate-in slide-in-from-bottom-2">
              <textarea autoFocus placeholder="Причина доработки..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full p-3 bg-red-50 dark:bg-[#1a1515] border border-red-200 dark:border-red-800 rounded-xl text-sm outline-none font-medium min-h-[80px] dark:text-white" />
              <div className="flex gap-2">
                <button onClick={() => setIsRejecting(false)} className="flex-1 h-12 text-[10px] font-black uppercase text-slate-500">Отмена</button>
                <button onClick={onReject} disabled={loading || !rejectionReason} className="flex-[2] h-12 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" size={18}/> : 'На правки'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => setIsRejecting(true)} className="flex-1 h-12 flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase border border-slate-200 dark:border-[#333333] rounded-xl active:scale-95 transition-all">
                <RotateCcw size={16}/> <span>Правки</span>
              </button>
              <button 
                onClick={onPublish} 
                disabled={loading || isTitleTooLong || !youtubeUrl} 
                className="flex-[1.5] h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:grayscale text-white rounded-xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Check size={18} strokeWidth={4} />}
                <span>Опубликовано</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}