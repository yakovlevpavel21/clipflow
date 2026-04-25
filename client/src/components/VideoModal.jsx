import { X, Film, PlayCircle, CheckCircle2, FileX } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';

export default function VideoModal({ url, title, channel, onClose }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Блокируем скролл фона
    document.body.style.overflow = 'hidden';

    // МЕНЯЕМ ЦВЕТ СТАТУС-БАРА на глубокий черный
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    const originalThemeColor = themeMeta?.getAttribute('content');
    
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', '#000000'); 

    return () => {
      document.body.style.overflow = '';
      if (originalThemeColor) {
        themeMeta.setAttribute('content', originalThemeColor);
      } else {
        themeMeta.setAttribute('content', '#ffffff'); 
      }
    };
  }, []);

  const videoType = useMemo(() => {
    if (!url) return null;
    if (url.includes('/originals/')) return { label: 'Оригинал', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
    return { label: 'Результат', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
  }, [url]);

  const getCleanUrl = (rawUrl) => {
    if (!rawUrl) return '';
    let cleanPath = rawUrl.replace(/\\/g, '/');
    return cleanPath.startsWith('http') ? cleanPath : window.location.origin + (cleanPath.startsWith('/') ? '' : '/') + cleanPath;
  };

  if (!url) return null;
  const fullUrl = getCleanUrl(url);

  return (
    <div className="fixed inset-0 w-screen h-screen z-[100000] flex items-center justify-center p-3 md:p-6 overflow-hidden bg-black/80 backdrop-blur-[2px]">
      
      {/* КОНТЕЙНЕР: Ограничен по высоте для ландшафтного режима */}
      <div className="relative w-full max-w-5xl max-h-full flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ИНФО-БЛОК */}
        <div className="flex items-start justify-between px-1 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {/* Канал */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-600/20 border border-blue-500/30 rounded text-blue-400 text-[10px] font-black uppercase tracking-wider">
                <PlayCircle size={10} />
                {channel || 'Clipsio'}
              </div>
              {/* Тип контента */}
              {videoType && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 border rounded text-[10px] font-black uppercase tracking-wider ${videoType.color}`}>
                  {videoType.label === 'Результат' ? <CheckCircle2 size={10} /> : <Film size={10} />}
                  {videoType.label}
                </div>
              )}
            </div>
            <h2 className="text-sm md:text-base font-bold text-white leading-tight truncate">
              {title}
            </h2>
          </div>

          {/* Кнопка закрытия */}
          <button 
            onClick={onClose}
            className="ml-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white border border-white/10 transition-all active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        {/* ПЛЕЕР С ОБРАБОТКОЙ ОШИБКИ */}
        <div className="w-full flex justify-center items-center overflow-hidden">
          <div className="w-full aspect-video bg-[#0a0a0a] rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center relative">
            
            {hasError ? (
              <div className="flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                  <FileX className="text-red-500" size={32} />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Файл не найден</h3>
                <p className="text-slate-500 text-sm max-w-[280px]">
                  Видео отсутствует на сервере или формат не поддерживается вашим устройством.
                </p>
              </div>
            ) : (
              <video 
                key={fullUrl}
                className="w-full h-full object-contain"
                controls 
                autoPlay 
                playsInline 
                preload="auto"
                onError={() => setHasError(true)}
              >
                <source 
                  src={fullUrl} 
                  type={fullUrl.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4'} 
                />
                Ваш браузер не поддерживает видео.
              </video>
            )}
          </div>
        </div>

        {/* НИЖНЯЯ ПОДПИСЬ */}
        <div className="flex items-center justify-center opacity-10 pointer-events-none shrink-0">
           <span className="text-[8px] text-white font-black uppercase tracking-[0.6em]">Clipsio Media</span>
        </div>
      </div>
    </div>
  );
}