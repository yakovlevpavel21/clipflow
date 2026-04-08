import { X, Film } from 'lucide-react';
import { useEffect } from 'react';

export default function VideoModal({ url, title, channel, onClose }) {
  
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (!url) return null;

  // ФУНКЦИЯ КОРРЕКЦИИ ПУТИ:
  // 1. Заменяет все обратные слэши \ на прямые / (важно для iOS)
  // 2. Убирает двойные слэши //
  // 3. Делает путь абсолютным
  const getCleanUrl = (rawUrl) => {
    let cleanPath = rawUrl.replace(/\\/g, '/'); // Фикс слэшей Windows
    if (!cleanPath.startsWith('/') && !cleanPath.startsWith('http')) {
      cleanPath = '/' + cleanPath;
    }
    // Если это относительный путь, добавляем домен
    return cleanPath.startsWith('http') ? cleanPath : window.location.origin + cleanPath;
  };

  const fullUrl = getCleanUrl(url);

  return (
    <div className="fixed inset-0 w-screen h-screen z-[100000] flex items-center justify-center p-2 sm:p-6 overflow-hidden">
      {/* Фон */}
      <div 
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl h-fit flex flex-col gap-2 md:gap-4 animate-in fade-in zoom-in-95 duration-300">
        
        {/* ИНФО-СТРОКА */}
        <div className="flex items-center justify-between px-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 md:mb-1">
              <span className="bg-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider shrink-0">
                {channel || 'Clipsio'}
              </span>
              <span className="hidden xs:flex text-[9px] text-slate-500 font-bold uppercase tracking-widest items-center gap-1">
                <Film size={10} /> Player
              </span>
            </div>
            <h2 className="text-[11px] md:text-sm font-medium text-white/90 truncate uppercase">
              {title}
            </h2>
          </div>

          <button 
            onClick={onClose}
            className="ml-4 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white/40 hover:text-white border border-white/5 active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* ПЛЕЕР */}
        <div className="relative w-full mx-auto aspect-video max-h-[calc(100vh-120px)] bg-black rounded-xl md:rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
          <video 
            key={fullUrl} // Заставляет плеер перезагрузиться при смене URL
            src={fullUrl} 
            className="w-full h-full object-contain"
            controls 
            autoPlay
            muted // КРИТИЧНО ДЛЯ IOS
            playsInline // КРИТИЧНО ДЛЯ IOS
            preload="auto"
          >
            {/* Дополнительный фоллбек для типов файлов */}
            <source src={fullUrl} type="video/mp4" />
            Ваш браузер не поддерживает видео.
          </video>
        </div>

        <p className="hidden md:block text-center text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em] opacity-50">
          Clipsio Cinema Mode
        </p>
      </div>
    </div>
  );
}