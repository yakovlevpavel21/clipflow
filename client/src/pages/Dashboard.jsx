import { useState, useEffect, useMemo } from 'react';
import api, { socket } from '../api';
import { 
  Activity, Clock, User, Shield, Play, 
  CheckCircle2, Loader2, Layers, Users, ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom'; 
import VideoModal from '../components/VideoModal';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [channels, setChannels] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePreview, setActivePreview] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);

  // Фильтры
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterCreator, setFilterCreator] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    try {
      const [tRes, cRes, uRes] = await Promise.all([
        api.get('/api/admin/dashboard-tasks'),
        api.get('/api/channels'),
        api.get('/api/tasks/creators')
      ]);
      setTasks(tRes.data);
      setChannels(cRes.data);
      setCreators(uRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();

    socket.on('task_updated', (updatedTask) => {
      setTasks(prev => {
        if (updatedTask.status === 'PUBLISHED') {
          return prev.filter(t => t.id !== updatedTask.id);
        }
        const exists = prev.find(t => t.id === updatedTask.id);
        if (exists) {
          return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
        }
        return [updatedTask, ...prev];
      });

      setHighlightedId(updatedTask.id);
      setTimeout(() => setHighlightedId(null), 3000);
    });

    return () => socket.off('task_updated');
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchChan = filterChannel === 'all' || t.channelId === Number(filterChannel);
      const matchUser = filterCreator === 'all' || t.creatorId === Number(filterCreator);
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchChan && matchUser && matchStatus;
    });
  }, [tasks, filterChannel, filterCreator, filterStatus]);

  const formatDate = (date) => {
    if (!date) return '---';
    return new Date(date).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).replace('.', '');
  };

  const getStatusBadge = (status) => {
    const configs = {
      AWAITING_REACTION: { label: 'Ожидает', color: 'bg-slate-100 text-slate-500' },
      IN_PROGRESS: { label: 'В работе', color: 'bg-amber-100 text-amber-600' },
      REACTION_UPLOADED: { label: 'Готово', color: 'bg-emerald-500 text-white' }
    };
    const config = configs[status] || configs.AWAITING_REACTION;
    return <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${config.color}`}>{config.label}</span>;
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">
      
      {/* HEADER - Тот же стиль */}
      <header className="pt-10 mb-8 px-1 animate-in fade-in duration-700">
        <div className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Дашборд
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              Централизованное отслеживание активных процессов системы в реальном времени.
            </p>
          </div>

          {/* ПЛАШКА LIVE СПРАВА */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1 md:mt-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Live</span>
          </div>
        </div>
      </header>

      {/* FILTERS - Горизонтальный скролл на мобилках */}
      <div className="sticky top-0 lg:top-0 max-lg:top-[64px] z-40 bg-slate-50 dark:bg-[#0a0f1c] -mx-4 px-4 border-b dark:border-slate-800 transition-all">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-4 px-1">
          <FilterSelect 
            icon={<Layers size={14}/>} 
            value={filterChannel} 
            onChange={setFilterChannel}
            options={[{id: 'all', name: 'Все каналы'}, ...channels]} 
          />
          <FilterSelect 
            icon={<Users size={14}/>} 
            value={filterCreator} 
            onChange={setFilterCreator}
            options={[{id: 'all', username: 'Все авторы'}, ...creators]} 
            labelKey="username"
          />
          <FilterSelect 
            icon={<Activity size={14}/>} 
            value={filterStatus} 
            onChange={setFilterStatus}
            options={[
              {id: 'all', name: 'Все статусы'},
              {id: 'AWAITING_REACTION', name: 'Ожидают'},
              {id: 'IN_PROGRESS', name: 'В работе'},
              {id: 'REACTION_UPLOADED', name: 'Готово'}
            ]} 
          />
        </div>
      </div>

      {/* TABLE SECTION - Прокрутка на мобилках */}
      <div className="mt-8 bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-black/20 border-b dark:border-slate-800">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Контент / Канал</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Команда</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Статус</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Дедлайн</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Создано</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-800">
              {filteredTasks.map((task) => (
                <tr 
                  key={task.id} 
                  className={`transition-all duration-700 group ${task.id === highlightedId ? 'bg-blue-500/10' : 'hover:bg-slate-50/50 dark:hover:bg-white/5'}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-11 rounded-lg overflow-hidden bg-black shrink-0 border dark:border-white/5">
                        <img src={`/${task.originalVideo.thumbnailPath}`} className="w-full h-full object-cover opacity-60" />
                        <button 
                          onClick={() => setActivePreview({ url: `/${task.status === 'REACTION_UPLOADED' ? task.reactionFilePath : task.originalVideo.filePath}`, title: task.originalVideo.title })}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play size={14} className="text-white fill-white" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter mb-0.5">{task.channel.name}</p>
                        <h4 className="text-[12px] font-bold text-slate-900 dark:text-white truncate max-w-[200px] uppercase leading-tight">{task.originalVideo.title}</h4>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-2">
                      {/* Менеджер */}
                      <div className="flex items-center gap-2 group/m">
                        <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100 dark:border-amber-800/50 shadow-sm">
                          <Shield size={12} />
                        </div>
                        <Link 
                          to={`/profile/${task.managerId}`} 
                          className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors truncate max-w-[120px] uppercase tracking-tight"
                        >
                          {task.manager?.username || '---'}
                        </Link>
                      </div>

                      {/* Креатор */}
                      <div className="flex items-center gap-2 group/c">
                        <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100 dark:border-blue-800/50 shadow-sm">
                          <User size={12} />
                        </div>
                        <Link 
                          to={`/profile/${task.creatorId}`} 
                          className="text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-500 transition-colors truncate max-w-[120px] uppercase tracking-tight"
                        >
                          {task.creator?.username || '---'}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {getStatusBadge(task.status)}
                    {task.needsFixing && <div className="mt-1 text-[8px] font-black text-red-500 uppercase animate-pulse">Нужны правки</div>}
                  </td>
                  <td className="p-4">
                    <div className={`flex flex-col ${task.deadline && new Date(task.deadline) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                      <span className="text-[11px] font-black tabular-nums">{formatDate(task.deadline)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right tabular-nums text-[11px] font-bold text-slate-400 uppercase">
                    {formatDate(task.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTasks.length === 0 && (
          <div className="py-24 text-center opacity-30 uppercase text-[10px] font-black tracking-widest">
            Нет активных задач для отображения
          </div>
        )}
      </div>

      {activePreview && (
        <VideoModal {...activePreview} onClose={() => setActivePreview(null)} />
      )}
    </div>
  );
}

function FilterSelect({ icon, value, onChange, options, labelKey = 'name' }) {
  return (
    <div className="relative group shrink-0">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="bg-white dark:bg-[#1a1f2e] pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase outline-none focus:border-blue-500 appearance-none cursor-pointer shadow-sm transition-all"
      >
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>{String(opt[labelKey]).toUpperCase()}</option>
        ))}
      </select>
      <ChevronDown size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}