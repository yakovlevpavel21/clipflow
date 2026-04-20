import { useState, useEffect } from 'react';
import { X, UploadCloud, Loader2, Check, RefreshCcw, Film, PlayCircle, AlertCircle } from 'lucide-react';
import api from '../api';

export default function UploadModal({ task, onClose, onSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showUploadZone, setShowUploadZone] = useState(!task.reactionFilePath);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = (file) => {
    if (!file) return;
    const allowed = ['.mp4', '.mov', '.avi'];
    if (!allowed.some(ext => file.name.toLowerCase().endsWith(ext))) {
      return alert("Ошибка: Допустимы только MP4, MOV или AVI.");
    }
    if (file.size > 50 * 1024 * 1024) {
      return alert("Ошибка: Файл слишком большой (макс. 50 МБ).");
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    setShowUploadZone(false);
  };

  const onDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleFinalUpload = async () => {
    if (!selectedFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('video', selectedFile);
    try {
      await api.post(`/api/tasks/${task.id}/upload`, formData);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка при загрузке");
      setLoading(false);
    }
  };

  const resetSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setShowUploadZone(true);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={!loading ? onClose : undefined} />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-2xl h-full md:h-auto md:max-h-[95vh] md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-[#333333]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 dark:border-[#333333] shrink-0 bg-white dark:bg-[#1f1f1f] z-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
               <UploadCloud size={18} />
             </div>
             <div>
               <h2 className="text-sm md:text-base font-bold uppercase tracking-tight dark:text-white">Работа над видео</h2>
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{task.channel?.name}</p>
             </div>
          </div>
          <button onClick={onClose} disabled={loading} className="p-2 hover:bg-slate-100 dark:hover:bg-[#333333] rounded-full text-slate-400 transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 no-scrollbar bg-white dark:bg-[#1f1f1f]">
          
          {/* 1. СЕКЦИЯ: ОРИГИНАЛ */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <PlayCircle size={14} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Оригинальный ролик</span>
            </div>
            {/* Исправленный фон: bg-slate-50 dark:bg-black */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#333333] shadow-sm">
              <video 
                src={`/${task.originalVideo?.filePath}`} 
                className="w-full h-full object-contain" 
                controls 
                playsInline 
              />
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-[#aaaaaa] italic px-1 line-clamp-1">
              {task.originalVideo.title}
            </p>
          </div>

          {/* 2. СЕКЦИЯ: ВАША РЕАКЦИЯ */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-[#333333]">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Film size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ваш результат</span>
              </div>
              
              {/* КНОПКА УДАЛИТЬ / ЗАМЕНИТЬ (Вынесена из плеера) */}
              {!showUploadZone && !loading && (
                <button 
                  onClick={resetSelection}
                  className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-red-100 dark:hover:bg-red-900/40"
                >
                  <RefreshCcw size={12} /> Заменить файл
                </button>
              )}
            </div>

            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#333333] flex items-center justify-center group">
              {showUploadZone ? (
                <label 
                  onDragEnter={onDrag} onDragOver={onDrag} onDragLeave={onDrag} onDrop={onDrop}
                  className={`absolute inset-0 flex flex-col items-center justify-center transition-all cursor-pointer ${dragActive ? 'bg-blue-50 dark:bg-blue-600/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                >
                  <input type="file" accept=".mp4,.mov,.avi" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                  <UploadCloud size={40} className={`mb-3 ${dragActive ? 'text-blue-500' : 'text-slate-400'}`} />
                  <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center px-4">
                    Перетащите реакцию сюда <br/> 
                    <span className="text-[9px] text-blue-500 mt-1 block">MP4 / MOV / AVI до 50 МБ</span>
                  </p>
                </label>
              ) : (
                <video 
                  key={previewUrl || task.reactionFilePath}
                  src={previewUrl || `/${task.reactionFilePath}`} 
                  className="w-full h-full object-contain" 
                  controls 
                  playsInline 
                />
              )}
            </div>
          </div>

          {/* Блок предупреждения если нужны правки */}
          {task.needsFixing && !selectedFile && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-3 animate-in slide-in-from-top-2">
               <AlertCircle className="text-red-500 shrink-0" size={18} />
               <div>
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-tight mb-1">Причина правок:</p>
                  <p className="text-xs text-red-800 dark:text-red-300 font-medium leading-relaxed italic">«{task.rejectionReason}»</p>
               </div>
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 md:p-6 border-t border-slate-100 dark:border-[#333333] bg-slate-50 dark:bg-black/20 shrink-0">
          {loading ? (
             <div className="flex flex-col items-center py-2 gap-2">
                <Loader2 className="animate-spin text-blue-600" size={24} />
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Загрузка на сервер...</p>
             </div>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedFile && (
                <button 
                  onClick={handleFinalUpload}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Check size={20} /> Отправить работу
                </button>
              )}
              
              <button 
                onClick={onClose}
                className="w-full py-3 text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors"
              >
                Закрыть окно
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}