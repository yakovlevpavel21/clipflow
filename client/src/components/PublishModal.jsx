import { useState, useEffect } from 'react';
import { 
  X, Copy, RotateCcw, Check, Calendar, ExternalLink, 
  FileVideo, Eye, Loader2, PlayCircle, Download, Type, AlertTriangle 
} from 'lucide-react';
import api, { getDownloadUrl } from '../api';
import HourlyPicker from './HourlyPicker';

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

  // Валидация заголовка
  const TITLE_LIMIT = 100;
  const isTitleTooLong = title.length > TITLE_LIMIT;

  useEffect(() => {
    if (task.scheduledAt) setScheduledAt(formatToDateTimeLocal(task.scheduledAt));
    
    const prefix = task.channel?.titlePrefix ? `${task.channel.titlePrefix} ` : '';
    setTitle(`${prefix}${task.originalVideo.title}`.slice(0, 120)); // Позволяем чуть больше для редактирования

    let desc = "";
    if (task.channel?.showOriginalLink) {
      desc += `${task.channel.originalLinkPrefix || ''}${task.originalVideo.url}\n\n`;
    }
    desc += task.channel?.descriptionFooter || "";
    setDescription(desc);

    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [task]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Формируем имя файла: [YouTube_ID]_result.mp4
      const fileName = `${task.originalVideo.videoId}_result.mp4`;
      
      // Генерируем URL через наш API хелпер
      const url = window.location.origin + getDownloadUrl(task.reactionFilePath, fileName);
      
      // Создаем временную ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      alert("Ошибка при скачивании файла");
    } finally {
      setIsDownloading(false);
    }
  };

  const onPublish = async () => {
    if (!youtubeUrl) return alert("Введите ссылку на YouTube!");
    if (isTitleTooLong) return alert("Название слишком длинное!");
    setLoading(true);
    try {
      await api.post(`/api/tasks/${task.id}/publish`, { youtubeUrl, scheduledAt });
      onSuccess();
    } catch (err) { alert("Ошибка при сохранении"); }
    finally { setLoading(false); }
  };

  const onReject = async () => {
    if (!rejectionReason) return alert("Укажите причину доработки!");
    setLoading(true);
    try {
      await api.post(`/api/tasks/${task.id}/reject`, { reason: rejectionReason });
      onSuccess();
    } catch (err) { setLoading(false); }
  };

  const formatToDateTimeLocal = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[100000] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-6xl h-full md:h-auto md:max-h-[95vh] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333333] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-[#333333] shrink-0 bg-white dark:bg-[#1f1f1f] z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <PlayCircle size={20} />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight">Публикация</h2>
              <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">{task.channel.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-[#333333] rounded-full text-slate-400"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row no-scrollbar">
          
          {/* LEFT: PLAYER SECTION */}
          <div className="lg:w-[45%] p-4 md:p-8 bg-slate-50 dark:bg-black/20 border-r border-slate-100 dark:border-[#333333] flex flex-col gap-6">
            <div className="flex bg-white dark:bg-[#161616] p-1 rounded-xl border border-slate-200 dark:border-[#333333]">
              <button onClick={() => setView('reaction')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${view === 'reaction' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>
                <FileVideo size={14} /> Результат
              </button>
              <button onClick={() => setView('original')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${view === 'original' ? 'bg-slate-700 dark:bg-[#333333] text-white shadow-lg' : 'text-slate-500 dark:text-slate-400'}`}>
                <Eye size={14} /> Оригинал
              </button>
            </div>
            
            <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-[#333333]">
              <video key={view} src={view === 'reaction' ? `/${task.reactionFilePath}` : `/${task.originalVideo.filePath}`} controls autoPlay className="w-full h-full object-contain" playsInline />
            </div>

            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full min-h-[52px] bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-600/20 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={16} className="animate-spin"/>
              ) : (
                <Download size={16}/>
              )}
              <span>Скачать результат (.mp4)</span>
            </button>
          </div>

          {/* RIGHT: FORM SECTION */}
          <div className="flex-1 p-5 md:p-8 space-y-8">
            
            <div className="space-y-6">
              {/* TITLE SECTION */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1 mb-1.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-1.5 shrink-0">
                      <Type size={12}/> Название ролика
                    </label>
                    {/* Счетчик лимита в одну строку с заголовком */}
                    <span className={`text-[10px] font-bold tabular-nums shrink-0 ${isTitleTooLong ? 'text-red-500 animate-pulse' : 'text-slate-500'}`}>
                      {title.length}/{TITLE_LIMIT}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleCopy(title, 'title')} 
                    className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all shrink-0 ${
                      copiedField === 'title' 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                    }`}
                  >
                    {copiedField === 'title' ? 'Готово!' : 'Копировать'}
                  </button>
                </div>

                <input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Введите название..."
                  className={`w-full bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border outline-none font-bold text-sm transition-all dark:text-[#f1f1f1] ${
                    isTitleTooLong 
                      ? 'border-red-500 ring-4 ring-red-500/10' 
                      : 'border-slate-200 dark:border-[#333333] focus:border-blue-600 shadow-inner'
                  }`} 
                />
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Описание</label>
                   <button 
                      onClick={() => handleCopy(description, 'desc')}
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md transition-all shrink-0 ${
                        copiedField === 'desc' 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                          : 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                      }`}
                    >
                      {copiedField === 'desc' ? 'Готово!' : 'Копировать'}
                    </button>
                </div>
                <textarea 
                  value={description} onChange={(e) => setDescription(e.target.value)} 
                  className="w-full h-40 bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-xs font-medium leading-relaxed outline-none focus:border-blue-600 resize-none dark:text-white" 
                />
              </div>

              {/* SCHEDULING ROW: Perfectly Aligned */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <HourlyPicker 
                  label="План публикации" icon={Calendar} value={scheduledAt}
                  minDate={today} minHour={nowHour}
                  onChange={(val) => setScheduledAt(val)}
                />
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em] ml-1">YouTube Ссылка</label>
                  <input 
                    placeholder="https://youtube.com/shorts/..." 
                    value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} 
                    className="w-full h-[46px] bg-red-50/20 dark:bg-red-950/10 px-4 rounded-xl border border-red-200 dark:border-red-900/30 text-sm font-bold outline-none focus:border-red-500 dark:text-white transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* ACTIONS FOOTER */}
            <div className="pt-8 border-t border-slate-100 dark:border-[#333333] mt-auto">
              {isRejecting ? (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                  <textarea 
                    autoFocus 
                    placeholder="Укажите причину для креатора..." 
                    value={rejectionReason} 
                    onChange={(e) => setRejectionReason(e.target.value)} 
                    className="w-full p-4 bg-slate-50 dark:bg-[#161616] border border-slate-200 dark:border-[#333333] rounded-xl text-sm outline-none font-medium min-h-[120px] dark:text-[#f1f1f1]" 
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsRejecting(false)} 
                      className="flex-1 min-h-[56px] text-[11px] font-black uppercase tracking-widest text-slate-500 active:opacity-50"
                    >
                      Отмена
                    </button>
                    <button 
                      onClick={onReject} 
                      disabled={loading || !rejectionReason} 
                      className="flex-[2] min-h-[56px] flex items-center justify-center gap-2 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 active:scale-[0.98] disabled:opacity-50 transition-all"
                    >
                      {loading ? <Loader2 className="animate-spin" size={18}/> : 'Вернуть на правки'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Кнопка "На доработку" */}
                  <button 
                    onClick={() => setIsRejecting(true)} 
                    className="w-full sm:flex-1 min-h-[56px] md:min-h-[64px] flex items-center justify-center gap-3 text-slate-500 dark:text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] transition-all border border-slate-200 dark:border-[#333333] rounded-2xl active:scale-[0.98] bg-slate-50 dark:bg-transparent flex-shrink-0"
                  >
                    <RotateCcw size={18} className="opacity-70" />
                    <span>На доработку</span>
                  </button>
                  
                  {/* Кнопка "Опубликовано" */}
                  <button 
                    onClick={onPublish} 
                    disabled={loading || isTitleTooLong || !youtubeUrl} 
                    className="w-full sm:flex-[1.5] min-h-[56px] md:min-h-[64px] flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 disabled:grayscale text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex-shrink-0"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20}/>
                    ) : (
                      <Check size={20} strokeWidth={4} />
                    )}
                    <span>Опубликовано</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}