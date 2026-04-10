import { useState } from 'react';
import { Plus, Trash2, Tv, Link2, FileText, Info } from 'lucide-react';

export default function AdminChannels({ channels, onAdd, onDelete, onUpdate }) {
  const [newName, setNewName] = useState('');

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName);
    setNewName('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. ФОРМА ДОБАВЛЕНИЯ */}
      <div className="bg-white dark:bg-[#1a1f2e] p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            value={newName} 
            onChange={e => setNewName(e.target.value)} 
            placeholder="Название нового канала..." 
            className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-inner" 
          />
          <button 
            onClick={handleAdd}
            className="h-14 px-8 bg-blue-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20 shrink-0"
          >
            <Plus size={18}/> Добавить
          </button>
        </div>
      </div>

      {/* 2. СПИСОК КАНАЛОВ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {channels.map(c => (
          <div key={c.id} className="bg-white dark:bg-[#1a1f2e] p-6 md:p-7 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 group hover:border-blue-500/20 transition-all">
            
            {/* Название и удаление */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Название</label>
                <input 
                  className="w-full bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-transparent focus:border-blue-500 dark:text-white font-black uppercase text-[13px] outline-none transition-all shadow-sm"
                  defaultValue={c.name}
                  onBlur={(e) => onUpdate(c.id, { name: e.target.value })}
                />
              </div>
              <button 
                onClick={() => onDelete('channels', c.id)} 
                className="mt-6 p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all"
              >
                <Trash2 size={20}/>
              </button>
            </div>

            {/* YouTube Title Prefix */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Префикс перед названием</label>
              <input 
                placeholder="Введите префикс..."
                className="w-full bg-slate-50 dark:bg-slate-900/30 p-3.5 rounded-xl border border-transparent focus:border-blue-500 text-xs font-bold outline-none transition-all"
                defaultValue={c.titlePrefix}
                onBlur={(e) => onUpdate(c.id, { titlePrefix: e.target.value })}
              />
            </div>

            {/* Конструктор описания */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Генератор описания</label>
                
                <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[1.8rem] border border-slate-100 dark:border-slate-800 space-y-5">
                  
                  {/* Переключатель ссылки */}
                  <div className="flex items-center justify-between group/toggle py-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg transition-colors ${c.showOriginalLink ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                        <Link2 size={14} />
                      </div>
                      <span className="text-[11px] font-black uppercase text-slate-500 transition-colors">
                        Ссылка на оригинал
                      </span>
                    </div>
                    
                    {/* САМ ПЕРЕКЛЮЧАТЕЛЬ */}
                    <button
                      type="button"
                      onClick={() => onUpdate(c.id, { showOriginalLink: !c.showOriginalLink })}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out outline-none border-2 border-transparent ${
                        c.showOriginalLink ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          c.showOriginalLink ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Поля ссылки */}
                  {c.showOriginalLink && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Текст перед ссылкой</label>
                        <input 
                          className="w-full bg-white dark:bg-slate-800 p-3 text-xs font-bold rounded-xl border border-slate-100 dark:border-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
                          defaultValue={c.originalLinkPrefix}
                          onBlur={(e) => onUpdate(c.id, { originalLinkPrefix: e.target.value })}
                          placeholder="Введите текст..."
                        />
                      </div>

                      {/* Разделитель */}
                      <div className="flex items-center gap-3 px-2">
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 opacity-50" />
                        <span className="text-[8px] font-black uppercase text-slate-300 dark:text-slate-500 tracking-widest">Авто-отступ</span>
                        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1 opacity-50" />
                      </div>
                    </div>
                  )}

                  {/* Footer: всегда виден */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 ml-1">
                      <FileText size={12} className="text-slate-400" />
                      <label className="text-[9px] font-black uppercase text-slate-400">Текст в конце (Footer)</label>
                    </div>
                    <textarea 
                      className="w-full bg-white dark:bg-slate-800 p-4 text-xs font-bold rounded-xl border dark:border-slate-700 outline-none resize-none h-32 focus:border-blue-500 transition-all leading-relaxed"
                      defaultValue={c.descriptionFooter}
                      onBlur={(e) => onUpdate(c.id, { descriptionFooter: e.target.value })}
                      placeholder="Введите основное описание..."
                    />
                  </div>
                </div>
              </div>
          </div>
        ))}
      </div>

      {channels.length === 0 && (
        <div className="py-32 text-center border-2 border-dashed dark:border-slate-800 rounded-[3rem]">
          <Tv className="mx-auto text-slate-200 dark:text-slate-800 mb-4" size={48} />
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.3em] opacity-60">Список каналов пуст</p>
        </div>
      )}
    </div>
  );
}