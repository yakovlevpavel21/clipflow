import { useState, useEffect } from 'react';
import api from '../../api';
import { X, Calendar, User, Save, Loader2, Info } from 'lucide-react';
import HourlyPicker from '../HourlyPicker';
import { toast } from 'sonner';

export default function EditTaskModal({ task, creators, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduledAt: '',
    creatorId: ''
  });

  // Логика: менять автора можно только если задача еще "Новая"
  const canEditCreator = task.status === 'AWAITING_REACTION';

  const formatToDateTimeLocal = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (task) {
      setFormData({
        scheduledAt: task.scheduledAt ? formatToDateTimeLocal(task.scheduledAt) : '',
        creatorId: task.creatorId ? String(task.creatorId) : ''
      });
    }
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [task]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        scheduledAt: formData.scheduledAt || null,
      };

      // Шлем creatorId только если его разрешено было редактировать
      if (canEditCreator) {
        payload.creatorId = parseInt(formData.creatorId);
      }

      await api.patch(`/api/tasks/${task.id}`, payload);
      toast.success('Изменения сохранены');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-0 md:p-4 overflow-hidden font-['Inter']">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-[#1f1f1f] w-full max-w-lg h-full md:h-auto md:max-h-[90vh] md:rounded-2xl shadow-2xl border border-slate-200 dark:border-[#333333] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#333333] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Calendar size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">Правка задачи</h2>
              <p className="text-[10px] text-blue-500 font-black uppercase mt-1 tracking-widest">{task.channel?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-[#333333] rounded-full text-slate-400"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-white dark:bg-[#1f1f1f]">
          <form id="edit-form" onSubmit={handleSave} className="space-y-6">
            
            {/* ВЫБОР ИСПОЛНИТЕЛЯ */}
            <div className={`space-y-2 ${!canEditCreator ? 'opacity-50' : ''}`}>
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                  <User size={12} /> Исполнитель
                </label>
                {!canEditCreator && (
                  <span className="text-[9px] font-bold text-amber-500 uppercase flex items-center gap-1">
                    <Info size={10} /> Только для новых задач
                  </span>
                )}
              </div>
              <div className="relative">
                <select 
                  disabled={!canEditCreator}
                  value={formData.creatorId}
                  onChange={(e) => setFormData({...formData, creatorId: e.target.value})}
                  className={`w-full appearance-none bg-slate-50 dark:bg-[#161616] p-4 rounded-xl border border-slate-200 dark:border-[#333333] text-sm font-bold outline-none focus:border-blue-600 transition-all ${!canEditCreator ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <option value="">Без автора</option>
                  {creators.map(c => (
                    <option key={c.id} value={c.id}>{c.username}</option>
                  ))}
                </select>
                <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* ПУБЛИКАЦИЯ */}
            <HourlyPicker 
              label="Дата и время публикации"
              icon={Calendar}
              value={formData.scheduledAt}
              minDate={today}
              minHour={0}
              onChange={(val) => setFormData({...formData, scheduledAt: val})}
            />
            <p className="text-[11px] text-slate-400 italic px-1">
              * Если оставить дату пустой, ролик будет в очереди без плана выхода.
            </p>
          </form>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-[#333333] bg-slate-50/50 dark:bg-black/20 shrink-0 flex justify-end">
          <button 
            form="edit-form"
            type="submit"
            disabled={loading}
            className="w-full md:w-auto md:min-w-[180px] h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-[11px] uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>Применить</span>
          </button>
        </div>
      </div>
    </div>
  );
}