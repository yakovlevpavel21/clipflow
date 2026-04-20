import { useState, useEffect } from 'react';
import { X, Tv, Link2, Save, Search, Loader2, FileText, Type, AlertCircle } from 'lucide-react';
import api from '../../api';

export default function ChannelModal({ channel, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    youtubeUrl: '',
    thumbnail: '',
    titlePrefix: '',
    descriptionFooter: '',
    originalLinkPrefix: '',
    showOriginalLink: true
  });

  useEffect(() => {
    if (channel) {
      setFormData({
        ...channel,
        thumbnail: channel.thumbnailPath ? `/${channel.thumbnailPath}` : ''
      });
    }
    // Блокируем скролл фона как в UserModal
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [channel]);

  const fetchMetadata = async () => {
    if (!formData.youtubeUrl) return;
    setFetching(true);
    setError('');
    try {
      const res = await api.post('/api/admin/channels/fetch-metadata', { url: formData.youtubeUrl });
      setFormData(prev => ({
        ...prev,
        name: res.data.name,
        thumbnail: res.data.thumbnail
      }));
    } catch (e) {
      setError(e.response?.data?.error || "Ошибка поиска");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    onSave(formData);
  };

  return (
    /* Структура 1 в 1 как в UserModal */
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-2xl h-full md:h-auto md:max-h-[90vh] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333333] animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col">
        
        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-all z-10">
          <X size={20} />
        </button>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar">
            
            {/* ЗАГОЛОВОК */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <Tv size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  {channel ? 'Настройки канала' : 'Новое подключение'}
                </h2>
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mt-0.5">Конфигурация YouTube</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* 1. ПОИСК (если создаем) */}
              {!channel && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">1. Ссылка на канал</label>
                  <div className="flex gap-2">
                    <input 
                      className="flex-1 bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-sm outline-none focus:border-blue-600 transition-all dark:text-[#f1f1f1]"
                      placeholder="https://youtube.com/@..."
                      value={formData.youtubeUrl}
                      onChange={e => setFormData({...formData, youtubeUrl: e.target.value})}
                    />
                    <button 
                      type="button" onClick={fetchMetadata} disabled={fetching}
                      className="px-6 bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-white rounded-xl font-bold text-xs uppercase hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2"
                    >
                      {fetching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                      Найти
                    </button>
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 text-red-500 text-[11px] font-medium bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20 animate-in slide-in-from-top-1">
                      <AlertCircle size={14} /> {error}
                    </div>
                  )}
                </div>
              )}

              {/* 2. ИДЕНТИЧНОСТЬ (Имя + Аватар) */}
              {(channel || formData.name) && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#161616] rounded-xl border border-slate-100 dark:border-[#333333]">
                  <img 
                    src={formData.thumbnail || `https://ui-avatars.com/api/?name=${formData.name}`} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-600" 
                    alt="" 
                  />
                  <div className="flex-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Название канала</label>
                    <input 
                      className="bg-transparent text-lg font-bold text-slate-900 dark:text-white outline-none w-full focus:text-blue-500"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* 3. ШАБЛОНЫ ТЕКСТА */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Type size={12} /> Префикс заголовка
                  </label>
                  <input 
                    value={formData.titlePrefix}
                    onChange={e => setFormData({...formData, titlePrefix: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-bold outline-none focus:border-blue-600 transition-all dark:text-[#f1f1f1]"
                    placeholder="Введите префикс..."
                  />
                </div>

                {/* ССЫЛКА */}
                <div className="p-4 bg-slate-50 dark:bg-[#161616] rounded-xl border border-slate-100 dark:border-[#333333] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${formData.showOriginalLink ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-[#262626] text-slate-400'}`}>
                        <Link2 size={16} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">Ссылка на оригинал</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, showOriginalLink: !formData.showOriginalLink})}
                      className={`w-10 h-5 rounded-full relative transition-colors ${formData.showOriginalLink ? 'bg-blue-600' : 'bg-slate-300 dark:bg-[#333333]'}`}
                    >
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.showOriginalLink ? 'left-6' : 'left-1'}`} />
                    </button>
                  </div>

                  {formData.showOriginalLink && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Текст перед ссылкой</label>
                      <input 
                        value={formData.originalLinkPrefix}
                        onChange={e => setFormData({...formData, originalLinkPrefix: e.target.value})}
                        className="w-full bg-white dark:bg-[#1f1f1f] p-3 rounded-lg border border-slate-200 dark:border-[#333333] text-sm font-bold dark:text-white outline-none focus:border-blue-600"
                        placeholder='Введите текст...'
                      />
                    </div>
                  )}
                </div>

                {/* ФУТЕР */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                    <FileText size={12} /> Описание (Footer)
                  </label>
                  <textarea 
                    value={formData.descriptionFooter}
                    onChange={e => setFormData({...formData, descriptionFooter: e.target.value})}
                    className="w-full h-32 bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-medium outline-none focus:border-blue-600 transition-all dark:text-[#f1f1f1] resize-none"
                    placeholder="Введите описание..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* КНОПКА (Всегда прижата вниз) */}
          <div className="p-6 md:p-10 border-t border-slate-100 dark:border-[#333333] bg-white dark:bg-[#1f1f1f]">
            <button 
              type="submit"
              disabled={loading || !formData.name}
              className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              <span>{channel ? 'Сохранить изменения' : 'Подключить канал'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}