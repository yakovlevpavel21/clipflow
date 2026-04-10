import { useState, useEffect } from 'react';
import api from '../api';
import { X, Calendar, Clock, User, Save, Loader2, AlertTriangle } from 'lucide-react';

export default function EditTaskModal({ task, creators, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    deadline: '',
    scheduledAt: '',
    creatorId: ''
  });

  // Приведение даты к формату input datetime-local
  const formatToDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (task) {
      setFormData({
        deadline: task.deadline ? formatToDateTimeLocal(task.deadline) : '',
        scheduledAt: task.scheduledAt ? formatToDateTimeLocal(task.scheduledAt) : '',
        creatorId: task.creatorId ? String(task.creatorId) : ''
      });
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [task]);

  // УМНАЯ ЛОГИКА ДАТ
  const handleDateChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Если меняем время публикации и есть значение
      if (field === 'scheduledAt' && value) {
        const pubDate = new Date(value);
        pubDate.setHours(pubDate.getHours() - 1);
        newData.deadline = formatToDateTimeLocal(pubDate);
      }
      
      return newData;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Валидация: креатор обязателен
    if (!formData.creatorId) {
      return alert("Необходимо выбрать исполнителя!");
    }

    setLoading(true);
    try {
      await api.patch(`/api/tasks/${task.id}`, {
        deadline: formData.deadline || null,
        scheduledAt: formData.scheduledAt || null,
        creatorId: parseInt(formData.creatorId)
      });
      onSuccess();
    } catch (err) {
      alert("Не удалось сохранить изменения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-[99999] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#0f172a] w-full max-w-lg h-full md:h-auto md:max-h-[90vh] md:rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* ХЕДЕР */}
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Правка задачи</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{task.channel.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* ТЕЛО ФОРМЫ */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          <form id="edit-form" onSubmit={handleSave} className="space-y-6">
            
            {/* ИСПОЛНИТЕЛЬ */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                <User size={12} /> Назначить автора <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select 
                  required
                  value={formData.creatorId}
                  onChange={(e) => setFormData({...formData, creatorId: e.target.value})}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="" disabled>-- Выберите из списка --</option>
                  {creators.map(c => (
                    <option key={c.id} value={c.id}>{c.username}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
              </div>
            </div>

            {/* ПУБЛИКАЦИЯ */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} /> План публикации
              </label>
              <input 
                type="datetime-local" 
                value={formData.scheduledAt}
                onChange={(e) => handleDateChange('scheduledAt', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>

            {/* ДЕДЛАЙН */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 flex items-center gap-2">
                <Clock size={12} /> Дедлайн креатора (-1ч от плана)
              </label>
              <input 
                type="datetime-local" 
                value={formData.deadline}
                onChange={(e) => handleDateChange('deadline', e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </form>
        </div>

        {/* ФУТЕР */}
        <div className="p-6 border-t dark:border-slate-800 bg-slate-50 dark:bg-black/20 shrink-0">
          <button 
            form="edit-form"
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span>{loading ? 'Сохранение...' : 'Обновить задачу'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}