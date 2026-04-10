import { useState, useEffect } from 'react';
import api, { socket } from '../api';
import { 
  X, Sparkles, Clock, AlertCircle, CheckCircle2, 
  Loader2, LayoutGrid, Play, Zap, Globe, User, Calendar, Copy,
  AlertTriangle 
} from 'lucide-react';
import VideoModal from './VideoModal';

export default function AddTaskModal({ onClose, onSuccess, channels }) {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [useProxy, setUseProxy] = useState(false);
  const [creators, setCreators] = useState([]);
  const [localPreview, setLocalPreview] = useState(null);
  const [taskConfigs, setTaskConfigs] = useState({});

  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await api.get('/api/tasks/creators');
        setCreators(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Ошибка загрузки креаторов:", err);
      }
    };
    fetchCreators();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  useEffect(() => {
    socket.on('downloadProgress', (data) => {
      if (videoInfo && data.videoId === videoInfo.videoId) {
        if (data.status === 'DOWNLOADING') setDownloadProgress(data.progress);
        if (data.status === 'READY' || data.status === 'ERROR') refreshStatus();
      }
    });
    return () => socket.off('downloadProgress');
  }, [videoInfo?.videoId]);

  const refreshStatus = async () => {
    try {
      const res = await api.post('/api/tasks/fetch-info', { url, useProxy });
      setVideoInfo(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCheckVideo = async () => {
    if (!url.trim()) return;
    setIsChecking(true);
    setVideoInfo(null);
    setDownloadProgress(0);
    setTaskConfigs({});
    try {
      const isRetry = videoInfo && videoInfo.status === 'ERROR';
      const res = await api.post('/api/tasks/fetch-info', { url, force: isRetry, useProxy });
      setVideoInfo(res.data);
    } catch (err) {
      setVideoInfo({ status: 'ERROR', errorMessage: err.response?.data?.error || "Ошибка сервера" });
    } finally { setIsChecking(false); }
  };

  const formatToDateTimeLocal = (date) => {
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const toggleChannel = (channelId) => {
    setTaskConfigs(prev => {
      const newConfigs = { ...prev };
      if (newConfigs[channelId]) {
        delete newConfigs[channelId];
      } else {
        newConfigs[channelId] = { creatorId: '', scheduledAt: '', deadline: '' };
      }
      return newConfigs;
    });
  };

  const applyFirstToAll = () => {
    const ids = Object.keys(taskConfigs);
    if (ids.length < 2) return;
    const firstId = ids[0];
    const baseConfig = taskConfigs[firstId];
    const updatedConfigs = {};
    ids.forEach(id => { updatedConfigs[id] = { ...baseConfig }; });
    setTaskConfigs(updatedConfigs);
  };

  const updateConfigField = (channelId, field, value) => {
    setTaskConfigs(prev => {
      const newConfig = { ...prev[channelId], [field]: value };
      if (field === 'scheduledAt' && value) {
        const pubDate = new Date(value);
        pubDate.setHours(pubDate.getHours() - 1);
        newConfig.deadline = formatToDateTimeLocal(pubDate);
      }
      return { ...prev, [channelId]: newConfig };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedIds = Object.keys(taskConfigs);
    
    if (!videoInfo || videoInfo.status !== 'READY') return;
    if (selectedIds.length === 0) return alert("Выберите хотя бы один канал!");

    // Проверка: назначен ли креатор (так как мы решили, что это обязательно)
    const hasUnassigned = selectedIds.some(id => !taskConfigs[id].creatorId);
    if (hasUnassigned) {
      return alert("Ошибка: Необходимо назначить исполнителя для каждого канала!");
    }

    setIsSubmitting(true);
    try {
      const tasksArray = selectedIds.map(id => {
        const config = taskConfigs[id];
        return {
          channelId: parseInt(id),
          creatorId: config.creatorId ? parseInt(config.creatorId) : null,
          // Если строка пустая, отправляем null, чтобы сервер не ругался
          deadline: config.deadline || null,
          scheduledAt: config.scheduledAt || null
        };
      });

      await api.post('/api/tasks/bulk', { 
        originalVideoId: videoInfo.id, 
        tasks: tasksArray 
      });
      
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Ошибка при создании задач");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isChecking || videoInfo?.status === 'DOWNLOADING';
  const selectedCount = Object.keys(taskConfigs).length;

  return (
    <div className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-0 md:p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={!isSubmitting ? onClose : undefined} />
      
      <div className="relative bg-white dark:bg-[#0f172a] w-full max-w-3xl h-full md:h-auto md:max-h-[92vh] md:rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b dark:border-slate-800 bg-white dark:bg-[#0f172a] z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Zap size={20} className="text-white" fill="currentColor" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Новая задача</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8 no-scrollbar">
          
          {/* URL INPUT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Globe size={14} /> Ссылка на ролик
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={useProxy} onChange={() => setUseProxy(!useProxy)} />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full peer-checked:translate-x-4 transition-all"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Proxy Mode</span>
              </label>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium outline-none focus:border-blue-500 transition-all shadow-inner"
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="https://youtube.com/shorts/..." 
                  disabled={isBusy}
                />
                {url && !isBusy && (
                  <button 
                    onClick={() => { setUrl(''); setVideoInfo(null); setDownloadProgress(0); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
              <button 
                onClick={() => handleCheckVideo()} 
                disabled={isBusy || !url}
                className="h-14 sm:h-auto px-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 shrink-0"
              >
                {isChecking ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                {isChecking ? 'Проверка...' : 'Проверить'}
              </button>
            </div>
          </div>

          {videoInfo && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-6">
              
              {/* STATUS: DOWNLOADING */}
              {videoInfo.status === 'DOWNLOADING' && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-3xl border border-blue-100 dark:border-blue-800 text-center space-y-4">
                  <Loader2 className="animate-spin text-blue-500 mx-auto" size={32} />
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">Обработка: {downloadProgress.toFixed(0)}%</p>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* STATUS: ERROR */}
              {(videoInfo.status === 'ERROR' || videoInfo.status === 'TOO_LONG') && (
                <div className="p-8 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/50 text-center space-y-4 animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <AlertCircle className="text-red-500" size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-red-600 uppercase tracking-tight">
                      {videoInfo.status === 'TOO_LONG' ? 'Видео слишком длинное' : 'Произошла ошибка'}
                    </p>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-[250px] mx-auto">
                      {videoInfo.errorMessage || 'Не удалось обработать ссылку. Попробуйте еще раз или используйте другое видео.'}
                    </p>
                  </div>
                  <button 
                    onClick={() => { setUrl(''); setVideoInfo(null); setDownloadProgress(0); }}
                    className="px-6 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-200 dark:border-red-800 hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                  >
                    Попробовать другую ссылку
                  </button>
                </div>
              )}

              {/* STATUS: READY */}
              {videoInfo.status === 'READY' && (
                <div className="space-y-8">
                  {/* PREVIEW */}
                  <div onClick={() => setLocalPreview({ url: `/${videoInfo.filePath}`, title: videoInfo.title })} className="bg-slate-50 dark:bg-[#1a1f2e] p-3 rounded-2xl border dark:border-slate-800 flex gap-4 items-center cursor-pointer group hover:border-blue-500/30 transition-all shadow-sm">
                    <div className="w-24 md:w-32 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative">
                      <img src={`/${videoInfo.thumbnailPath}`} className="w-full h-full object-cover group-hover:opacity-70 transition-opacity" alt="" />
                      <Play fill="white" size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-white uppercase leading-tight line-clamp-2">{videoInfo.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">ID: {videoInfo.videoId}</p>
                    </div>
                  </div>

                  {/* CHANNELS */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest px-1 flex items-center gap-2">
                      1. Выберите каналы
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {channels.map(ch => {
                        const isSelected = taskConfigs[ch.id];
                        const isDup = videoInfo.existingChannelIds?.includes(ch.id);
                        return (
                          <button key={ch.id} onClick={() => toggleChannel(ch.id)} className={`px-4 py-2.5 rounded-xl text-[11px] font-bold border transition-all relative ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : isDup ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'}`}>
                            {ch.name}
                            {isDup && !isSelected && <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white dark:border-[#0f172a]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* CONFIGS */}
                  {selectedCount > 0 && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2">
                           2. Назначьте исполнителей <span className="text-red-500 font-black">*</span>
                        </label>
                        {selectedCount > 1 && (
                          <button onClick={applyFirstToAll} className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hover:underline active:opacity-50">
                            <Copy size={12} /> Для всех как в первом
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {Object.keys(taskConfigs).map((id, index) => {
                          const ch = channels.find(c => c.id === parseInt(id));
                          const config = taskConfigs[id];
                          const hasError = !config.creatorId; // Валидация
                          
                          return (
                            <div key={id} className={`bg-slate-50 dark:bg-[#1a1f2e] p-4 rounded-2xl border transition-all shadow-sm space-y-4 ${hasError ? 'border-amber-200 dark:border-amber-900/30' : 'border-slate-200 dark:border-slate-800'}`}>
                              <div className="flex items-center justify-between border-b dark:border-slate-700/50 pb-2">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                                  <span className="w-5 h-5 bg-blue-600 text-white rounded-md flex items-center justify-center text-[10px]">{index + 1}</span>
                                  {ch?.name}
                                </div>
                                <button onClick={() => toggleChannel(id)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={14}/></button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                {/* ИСПОЛНИТЕЛЬ */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 flex items-center gap-1.5 h-4">
                                    Исполнитель
                                    {hasError && <AlertTriangle size={12} className="text-amber-500 animate-pulse" />}
                                  </label>
                                  <div className="relative">
                                    <select 
                                      value={config.creatorId} 
                                      onChange={(e) => updateConfigField(id, 'creatorId', e.target.value)}
                                      className={`w-full appearance-none bg-white dark:bg-slate-900 p-3.5 pr-10 rounded-xl border text-[13px] font-bold outline-none transition-all ${
                                        hasError 
                                          ? 'border-amber-400 dark:border-amber-900 shadow-[0_0_15px_rgba(245,158,11,0.08)]' 
                                          : 'border-slate-200 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5'
                                      }`}
                                    >
                                      <option value="">Выберите</option>
                                      {creators.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                      <User size={16} />
                                    </div>
                                  </div>
                                </div>

                                {/* ПЛАН ПУБЛИКАЦИИ */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 h-4 flex items-center">
                                    Публикация
                                  </label>
                                  <input 
                                    type="datetime-local" 
                                    value={config.scheduledAt} 
                                    onChange={(e) => updateConfigField(id, 'scheduledAt', e.target.value)} 
                                    className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[12px] font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                                  />
                                </div>

                                {/* ДЕДЛАЙН */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-extrabold text-slate-400 uppercase ml-1 h-4 flex items-center">
                                    Дедлайн
                                  </label>
                                  <input 
                                    type="datetime-local" 
                                    value={config.deadline} 
                                    onChange={(e) => updateConfigField(id, 'deadline', e.target.value)} 
                                    className="w-full bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-[12px] font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" 
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 md:p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-black/20 shrink-0">
          <button 
            onClick={handleSubmit}
            disabled={selectedCount === 0 || isSubmitting || !videoInfo || videoInfo.status !== 'READY'}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 disabled:grayscale text-white rounded-2xl font-bold uppercase tracking-[0.1em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
            <span>{isSubmitting ? 'Подготовка...' : `Создать задачи (${selectedCount})`}</span>
          </button>
        </div>
      </div>

      {localPreview && (
        <VideoModal url={localPreview.url} title={localPreview.title} channel="Предпросмотр" onClose={() => setLocalPreview(null)} />
      )}
    </div>
  );
}