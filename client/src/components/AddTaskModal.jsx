import { useState, useEffect, useRef } from 'react';
import api, { socket } from '../api';
import { 
  X, Sparkles, AlertCircle, CheckCircle2, 
  Loader2, Play, Zap, Globe, User, Copy,
  AlertTriangle, StopCircle 
} from 'lucide-react';
import VideoModal from './VideoModal';
import { toast } from 'sonner';

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
  const [hasProxyConfig, setHasProxyConfig] = useState(false);
  
  // Реф для отмены запроса
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Загрузка настроек прокси
    api.get('/api/admin/settings')
      .then(res => {
        const proxy = res.data.find(s => s.key === 'proxy_url');
        setHasProxyConfig(!!proxy?.value);
      })
      .catch(() => setHasProxyConfig(false));

    // Загрузка креаторов
    const fetchCreators = async () => {
      try {
        const res = await api.get('/api/tasks/creators');
        setCreators(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Ошибка загрузки креаторов:", err);
      }
    };
    fetchCreators();

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  // Слушатель прогресса загрузки оригинала на сервер
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
    
    // Инициализируем контроллер отмены
    abortControllerRef.current = new AbortController();
    setIsChecking(true);
    setVideoInfo(null);
    setDownloadProgress(0);
    setTaskConfigs({});

    try {
      const res = await api.post('/api/tasks/fetch-info', 
        { url, force: false, useProxy },
        { signal: abortControllerRef.current.signal }
      );
      setVideoInfo(res.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        toast.info('Проверка отменена');
      } else {
        setVideoInfo({ status: 'ERROR', errorMessage: err.response?.data?.error || "Ошибка сервера" });
      }
    } finally { 
      setIsChecking(false); 
    }
  };

  const cancelChecking = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const toggleChannel = (channelId) => {
    setTaskConfigs(prev => {
      const newConfigs = { ...prev };
      if (newConfigs[channelId]) {
        delete newConfigs[channelId];
      } else {
        // Автоматически ставим первого креатора из списка
        const firstCreatorId = creators.length > 0 ? String(creators[0].id) : '';
        newConfigs[channelId] = { creatorId: firstCreatorId };
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

  const updateConfigField = (channelId, value) => {
    setTaskConfigs(prev => ({
      ...prev,
      [channelId]: { ...prev[channelId], creatorId: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedIds = Object.keys(taskConfigs);
    
    if (!videoInfo || videoInfo.status !== 'READY') return;
    if (selectedIds.length === 0) return toast.error("Выберите каналы");

    const hasUnassigned = selectedIds.some(id => !taskConfigs[id].creatorId);
    if (hasUnassigned) return toast.error("Назначьте исполнителей");

    setIsSubmitting(true);
    try {
      const tasksArray = selectedIds.map(id => ({
        channelId: parseInt(id),
        creatorId: parseInt(taskConfigs[id].creatorId),
        deadline: null, // Теперь даты ставит система при публикации
        scheduledAt: null
      }));

      await api.post('/api/tasks/bulk', { 
        originalVideoId: videoInfo.id, 
        tasks: tasksArray 
      });
      
      toast.success('Задачи добавлены в очередь');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || "Ошибка при создании");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isChecking || videoInfo?.status === 'DOWNLOADING';
  const selectedCount = Object.keys(taskConfigs).length;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={!isSubmitting ? onClose : undefined} />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-3xl h-full md:h-auto md:max-h-[92vh] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333333] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 dark:border-[#333333] shrink-0 bg-white dark:bg-[#1f1f1f] z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Zap size={18} fill="currentColor" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Новая задача</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-[#333333] rounded-full transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-8 no-scrollbar bg-white dark:bg-[#1f1f1f]">
          
          {/* URL INPUT */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                <Globe size={14} /> Ссылка на ролик
              </label>
              <label className={`flex items-center gap-2 group transition-opacity ${!hasProxyConfig ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className="relative">
                  <input type="checkbox" className="sr-only peer" checked={useProxy} onChange={() => hasProxyConfig && setUseProxy(!useProxy)} disabled={!hasProxyConfig} />
                  <div className={`w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full transition-all ${hasProxyConfig ? 'peer-checked:bg-blue-600' : ''}`}></div>
                  <div className={`absolute left-1 top-1 w-2 h-2 bg-white rounded-full transition-all ${useProxy && hasProxyConfig ? 'translate-x-4' : 'translate-x-0'}`}></div>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Proxy Mode</span>
              </label>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 items-stretch">
              <div className="relative flex-1">
                <input 
                  className="w-full h-14 bg-slate-50 dark:bg-[#161616] px-4 pr-12 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-bold outline-none focus:border-blue-600 transition-all dark:text-white shadow-inner"
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="Вставьте ссылку на Shorts..." 
                  disabled={isBusy}
                />
                {url && !isBusy && (
                  <button onClick={() => { setUrl(''); setVideoInfo(null); setDownloadProgress(0); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={18} />
                  </button>
                )}
              </div>
              
              {isChecking ? (
                <button 
                  onClick={cancelChecking}
                  className="h-14 px-8 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shrink-0 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Loader2 className="animate-spin" size={18} />
                  <span>Отмена</span>
                </button>
              ) : (
                <button 
                  onClick={handleCheckVideo} 
                  disabled={isBusy || !url} 
                  className="h-14 px-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shrink-0 flex items-center justify-center gap-2 whitespace-nowrap active:scale-95 shadow-lg shadow-blue-500/20"
                >
                  <Sparkles size={18} />
                  <span>Проверить</span>
                </button>
              )}
            </div>
          </div>

          {videoInfo && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-8">
              
              {/* ЗАГРУЗКА НА СЕРВЕР (yt-dlp) */}
              {videoInfo.status === 'DOWNLOADING' && (
                <div className="bg-slate-50 dark:bg-[#161616] p-6 rounded-2xl border border-slate-200 dark:border-[#333333] text-center space-y-4">
                  <Loader2 className="animate-spin text-blue-500 mx-auto" size={24} />
                  <p className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Обработка: {downloadProgress.toFixed(0)}%</p>
                  <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* ОШИБКИ */}
              {(videoInfo.status === 'ERROR' || videoInfo.status === 'TOO_LONG') && (
                <div className="p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 text-center space-y-3">
                  <AlertCircle className="text-red-500 mx-auto" size={32} />
                  <p className="text-xs font-bold text-red-600 uppercase tracking-tight">
                    {videoInfo.status === 'TOO_LONG' ? 'Видео слишком длинное' : 'Ошибка данных'}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">{videoInfo.errorMessage || 'Попробуйте другую ссылку'}</p>
                </div>
              )}

              {/* РЕЗУЛЬТАТ НАЙДЕН */}
              {videoInfo.status === 'READY' && (
                <div className="space-y-8">
                  <div onClick={() => setLocalPreview({ url: `/${videoInfo.filePath}`, title: videoInfo.title })} className="bg-slate-50 dark:bg-[#161616] p-3 rounded-2xl border border-slate-200 dark:border-[#333333] flex gap-4 items-center cursor-pointer hover:border-blue-600 transition-all group">
                    <div className="w-24 aspect-video rounded-lg overflow-hidden bg-black shrink-0 relative">
                      <img src={`/${videoInfo.thumbnailPath}`} className="w-full h-full object-cover opacity-60" alt="" />
                      <Play fill="white" size={16} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-bold text-slate-900 dark:text-[#f1f1f1] truncate uppercase">{videoInfo.title}</h4>
                      <p className="text-[10px] text-blue-500 font-black uppercase mt-1">{videoInfo.videoId}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">1. Выберите каналы</label>
                    <div className="flex flex-wrap gap-2">
                      {channels.map(ch => {
                        const isSelected = taskConfigs[ch.id];
                        const isDup = videoInfo.existingChannelIds?.includes(ch.id);
                        return (
                          <button key={ch.id} onClick={() => toggleChannel(ch.id)} className={`px-4 py-2.5 rounded-xl text-[11px] font-black uppercase border transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : isDup ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-500/30 text-amber-600' : 'bg-white dark:bg-[#161616] border-slate-200 dark:border-[#333333] text-slate-500 dark:text-[#aaaaaa] hover:border-slate-400'}`}>
                            {ch.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedCount > 0 && (
                    <div className="space-y-5 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">2. Назначьте исполнителей</label>
                        {selectedCount > 1 && (
                          <button onClick={applyFirstToAll} className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 hover:underline">
                            <Copy size={12} /> Для всех как в 1-м
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {Object.keys(taskConfigs).map((id, index) => {
                          const ch = channels.find(c => c.id === parseInt(id));
                          const config = taskConfigs[id];
                          const hasError = !config.creatorId;
                          
                          return (
                            <div key={id} className={`bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border transition-all flex items-center justify-between ${hasError ? 'border-amber-500/50' : 'border-slate-200 dark:border-[#333333]'}`}>
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-[10px] font-black">{index + 1}</span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">{ch?.name}</span>
                              </div>

                              <div className="relative w-48">
                                <select 
                                  value={config.creatorId} onChange={(e) => updateConfigField(id, e.target.value)}
                                  className="w-full appearance-none bg-white dark:bg-[#1f1f1f] p-2.5 rounded-lg border border-slate-200 dark:border-[#333333] text-[12px] font-bold outline-none focus:border-blue-600 dark:text-white transition-all pr-8"
                                >
                                  <option value="">Выбрать автора</option>
                                  {creators.map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                                </select>
                                <User size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
        <div className="p-5 border-t border-slate-100 dark:border-[#333333] bg-slate-50/50 dark:bg-black/20 shrink-0">
          <button 
            onClick={handleSubmit} disabled={selectedCount === 0 || isSubmitting || !videoInfo || videoInfo.status !== 'READY'}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-20 text-white rounded-xl font-bold uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
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