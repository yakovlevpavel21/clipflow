import { useState, useEffect } from 'react';
import { X, Tv, Link2, Save, Search, Loader2, FileText, Type, AlertCircle, Clock, Plus } from 'lucide-react';
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
    showOriginalLink: true,
    publishSlots: []
  });

  useEffect(() => {
    if (channel) {
      let slots = [];
      try {
        if (typeof channel.publishSlots === 'string') slots = JSON.parse(channel.publishSlots);
        else if (Array.isArray(channel.publishSlots)) slots = channel.publishSlots;
      } catch (e) { console.error(e); }

      setFormData({
        ...channel,
        thumbnail: channel.thumbnailPath ? `/${channel.thumbnailPath}` : '',
        publishSlots: slots,
        showOriginalLink: channel.showOriginalLink ?? true,
        originalLinkPrefix: channel.originalLinkPrefix
      });
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [channel]);

  const fetchMetadata = async () => {
    if (!formData.youtubeUrl) return;
    setFetching(true);
    setError('');
    try {
      const res = await api.post('/api/admin/channels/fetch-metadata', { url: formData.youtubeUrl });
      setFormData(prev => ({ ...prev, name: res.data.name, thumbnail: res.data.thumbnail }));
    } catch (e) { setError("Канал не найден"); }
    finally { setFetching(false); }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-2xl h-full md:h-auto md:max-h-[95vh] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333333] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#333333] bg-white dark:bg-[#1f1f1f] shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Tv size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                {channel ? 'Настройки' : 'Подключение'}
              </h2>
              <p className="text-[10px] text-blue-500 font-black uppercase mt-1 tracking-widest opacity-80">канал</p>
            </div>
          </div>

          {/* КРЕСТИК: Теперь он привязан к хедеру */}
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-[#333333] rounded-full transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white shrink-0"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-8 no-scrollbar bg-white dark:bg-[#1f1f1f]">

            <div className="space-y-6">
              {/* 1. ПОИСК */}
              {!channel && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">1. Ссылка на канал</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input className="flex-1 bg-slate-50 dark:bg-[#161616] p-3.5 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-medium outline-none focus:border-blue-500 transition-all dark:text-white" placeholder="https://youtube.com/@..." value={formData.youtubeUrl} onChange={e => setFormData({...formData, youtubeUrl: e.target.value})} />
                    <button type="button" onClick={fetchMetadata} disabled={fetching} className="px-6 bg-slate-100 dark:bg-[#262626] text-slate-600 dark:text-white rounded-xl font-bold text-xs uppercase hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95 h-12 sm:h-auto">
                      {fetching ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                      Найти
                    </button>
                  </div>
                  {error && <div className="text-red-500 text-[11px] bg-red-50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20 flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
                </div>
              )}

              {/* 2. ИМЯ И АВАТАР */}
              {(channel || formData.name) && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-[#161616] rounded-xl border border-slate-100 dark:border-[#333333]">
                  <img src={formData.thumbnail || `https://ui-avatars.com/api/?name=${formData.name}`} className="w-14 h-14 rounded-full object-cover border-2 border-blue-600 shadow-md" alt="" />
                  <div className="flex-1 min-w-0">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Отображаемое имя</label>
                    <input className="bg-transparent text-lg font-semibold text-slate-900 dark:text-white outline-none w-full focus:text-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                </div>
              )}

              {/* 3. ПРЕФИКС ЗАГОЛОВКА */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                  <Type size={12} /> Префикс названия (Title)
                </label>
                <input value={formData.titlePrefix} onChange={e => setFormData({...formData, titlePrefix: e.target.value})} className="w-full bg-slate-50 dark:bg-[#161616] p-3.5 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-medium dark:text-[#f1f1f1] outline-none focus:border-blue-500" placeholder="Реакция на ..." />
              </div>

              {/* 5. ССЫЛКА НА ОРИГИНАЛ (С ТУМБЛЕРОМ В ЗАГОЛОВКЕ) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                   <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                      <Link2 size={12} /> Текст перед ссылкой
                   </label>
                   {/* Тумблер справа от заголовка */}
                   <button
                    type="button"
                    onClick={() => setFormData({...formData, showOriginalLink: !formData.showOriginalLink})}
                    className={`w-9 h-5 rounded-full relative transition-colors ${formData.showOriginalLink ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${formData.showOriginalLink ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
                
                {formData.showOriginalLink && (
                  <input 
                    value={formData.originalLinkPrefix}
                    onChange={e => setFormData({...formData, originalLinkPrefix: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-[#161616] p-3.5 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-medium dark:text-[#f1f1f1] outline-none focus:border-blue-600 animate-in fade-in slide-in-from-top-1"
                    placeholder="Оригинал - ..."
                  />
                )}
              </div>

              {/* 4. ФУТЕР ОПИСАНИЯ */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-[0.2em] ml-1 flex items-center gap-2">
                  <FileText size={12} /> Футер описания (Description)
                </label>
                <textarea value={formData.descriptionFooter} onChange={e => setFormData({...formData, descriptionFooter: e.target.value})} className="w-full h-24 bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-medium dark:text-[#f1f1f1] outline-none focus:border-blue-500 resize-none custom-scrollbar" placeholder="Остальное описание..." />
              </div>

              {/* 6. РАСПИСАНИЕ СЛОТОВ */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 px-1 text-blue-500">
                  <Clock size={16} />
                  <h3 className="text-[11px] font-black uppercase tracking-widest">Активные слоты публикаций</h3>
                </div>

                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-[#161616] rounded-2xl border border-slate-200 dark:border-[#333333]">
                  {formData.publishSlots.map((hour, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-blue-600 text-white pl-3 pr-1 py-1.5 rounded-lg shadow-sm">
                      <span className="text-xs font-bold tabular-nums">{String(hour).padStart(2, '0')}:00</span>
                      <button type="button" onClick={() => setFormData({...formData, publishSlots: formData.publishSlots.filter(h => h !== hour)})} className="p-1 hover:bg-white/20 rounded-md transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  <div className="relative">
                    {/* Исправленный селектор: только одна иконка Plus справа */}
                    <select 
                      onChange={(e) => {
                        const h = parseInt(e.target.value);
                        if(!formData.publishSlots.includes(h)) setFormData({...formData, publishSlots: [...formData.publishSlots, h].sort((a,b) => a-b)});
                      }}
                      className="bg-white dark:bg-[#222222] border border-slate-200 dark:border-[#333333] pl-3 pr-8 h-8 rounded-lg text-[11px] font-bold outline-none cursor-pointer appearance-none hover:border-blue-500 transition-all dark:text-white" value=""
                    >
                      <option value="" disabled>Добавить час</option>
                      {Array.from({length: 24}, (_, i) => i).map(h => (<option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>))}
                    </select>
                    <Plus size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER: Кнопка сохранена в правый угол на ПК */}
          <div className="p-5 md:p-8 border-t border-slate-100 dark:border-[#333333] bg-white dark:bg-[#1f1f1f] flex justify-center md:justify-end shrink-0">
            <button 
              type="submit" disabled={loading || !formData.name}
              className="w-full md:w-[200px] h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{channel ? 'Сохранить' : 'Подключить'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}