import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  User, Video, BarChart3, PieChart as PieIcon,
  Calendar, Layers, Play, Loader2, ArrowLeft,
  ExternalLink, TrendingUp, Award, ChevronLeft, 
  ChevronRight, CalendarDays, PlayCircle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import VideoModal from '../components/VideoModal';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Данные профиля и графиков
  const [data, setData] = useState(null);
  // Список истории (пагинация)
  const [history, setHistory] = useState([]);
  
  // Состояния загрузки
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  // Фильтры и пагинация
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeRoleTab, setActiveRoleTab] = useState('creator');
  const [hasMore, setHasMore] = useState(true);
  const ITEMS_PER_PAGE = 10;

  const [activePreview, setActivePreview] = useState(null);

  // --- ЛОГИКА ПЕРЕКЛЮЧЕНИЯ МЕСЯЦЕВ ---
  const handleMonthChange = (direction) => {
    if (selectedMonth === 'all') {
      const now = new Date();
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
      return;
    }
    let [year, month] = selectedMonth.split('-').map(Number);
    month += direction;
    if (month > 12) { month = 1; year += 1; } 
    else if (month < 1) { month = 12; year -= 1; }
    setSelectedMonth(`${year}-${String(month).padStart(2, '0')}`);
  };

  const isFuture = useMemo(() => {
    if (selectedMonth === 'all') return false;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth >= currentMonthStr;
  }, [selectedMonth]);

  const isBeforeRegistration = useMemo(() => {
    if (selectedMonth === 'all' || !data?.user.createdAt) return false;
    const regDate = new Date(data.user.createdAt);
    const regMonthStr = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth <= regMonthStr;
  }, [selectedMonth, data]);

  // --- ЗАГРУЗКА ДАННЫХ ---
  
  // 1. Загрузка статистики (Графики)
  const fetchStats = async () => {
    if (!isInitialLoading) setIsRefreshing(true);
    try {
      const res = await api.get(`/api/stats/profile-stats/${id}?month=${selectedMonth}`);
      setData(res.data);
      
      // Авто-переключение роли только если зашли на пустую вкладку при ПЕРВОМ входе
      if (isInitialLoading && activeRoleTab === 'creator' && res.data.creator.total === 0 && res.data.manager.total > 0) {
        setActiveRoleTab('manager');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitialLoading(false);
      // setIsRefreshing(false); // Убираем отсюда, его выключит loadHistory
    }
  };

  // 2. Загрузка истории (Таблица с пагинацией)
  const loadHistory = async (skip = 0, reset = false) => {
    if (isFetchingMore) return;
    
    if (reset) {
      setIsRefreshing(true); // Включаем прозрачность для всей таблицы
      setHasMore(true);
    } else {
      setIsFetchingMore(true); // Включаем лоадер только для кнопки внизу
    }
    
    try {
      const res = await api.get(`/api/tasks/user-history/${id}`, {
        params: {
          skip,
          take: ITEMS_PER_PAGE,
          role: activeRoleTab,
          month: selectedMonth
        }
      });
      
      const newItems = res.data;
      setHasMore(newItems.length === ITEMS_PER_PAGE);
      setHistory(prev => reset ? newItems : [...prev, ...newItems]);
    } catch (e) {
      console.error("History load error:", e);
    } finally {
      setIsFetchingMore(false);
      setIsRefreshing(false); // Выключаем прозрачность
    }
  };

  useEffect(() => {
    fetchStats();
    loadHistory(0, true); // Всегда сбрасываем историю при смене месяца или роли
  }, [id, selectedMonth, activeRoleTab]);

  const currentStats = useMemo(() => {
    if (!data) return null;
    return activeRoleTab === 'creator' ? data.creator : data.manager;
  }, [data, activeRoleTab]);

  const showRoleSwitcher = data?.user.role === 'ADMIN' || (data?.creator.total > 0 && data?.manager.total > 0);

  if (isInitialLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Загрузка профиля...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">

      {/* 1. TOP BAR / PERIOD SELECTOR */}
      <div className="flex flex-col sm:flex-row items-center justify-between py-8 gap-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-500 font-bold text-[10px] uppercase tracking-[0.2em] transition-all"
        >
          <ArrowLeft size={16} /> Назад
        </button>

        <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-1 h-12">
          <button
            disabled={isBeforeRegistration}
            onClick={() => handleMonthChange(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 disabled:opacity-10 transition-all"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="px-2 min-w-[130px] h-10 flex items-center justify-center text-center select-none">
            {selectedMonth === 'all' ? (
              <span className="text-[11px] font-black uppercase text-blue-600 tracking-widest leading-none">Весь период</span>
            ) : (
              <div className="flex flex-col items-center justify-center gap-0.5">
                <span className="text-[11px] font-black uppercase dark:text-white leading-none">
                  {new Date(selectedMonth + '-02').toLocaleString('ru-RU', { month: 'long' })}
                </span>
                <span className="text-[9px] font-bold text-slate-400 tabular-nums uppercase tracking-tighter leading-none">
                  {selectedMonth.split('-')[0]}
                </span>
              </div>
            )}
          </div>

          <button
            disabled={isFuture}
            onClick={() => handleMonthChange(1)}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 disabled:opacity-10 transition-all"
          >
            <ChevronRight size={20} />
          </button>

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          <button
            onClick={() => setSelectedMonth('all')}
            className={`h-10 px-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${selectedMonth === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
          >
            <CalendarDays size={14} className="shrink-0" />
            <span className="leading-none mt-0.5">Всё</span>
          </button>
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className={`transition-all duration-300 ${isRefreshing ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
        
        {/* USER HEADER */}
        <header className="mb-8 p-6 md:p-10 bg-white dark:bg-[#1a1f2e] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="hidden md:block absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <Award size={180} />
          </div>

          <div className="relative">
            <div className="w-28 h-28 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-600/30">
              <User size={56} />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-2xl border-4 border-white dark:border-[#1a1f2e] flex items-center justify-center text-white shadow-lg">
                <TrendingUp size={20} />
            </div>
          </div>

          <div className="text-center md:text-left flex-1 space-y-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{data.user.username}</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Personal Achievement Profile</p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-md">{data.user.role}</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold px-3 py-1 rounded-lg uppercase flex items-center gap-1.5">
                <Calendar size={12} /> с {new Date(data.user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {showRoleSwitcher && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-1 shadow-inner shrink-0">
              <button onClick={() => setActiveRoleTab('creator')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeRoleTab === 'creator' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-400'}`}>Креатор</button>
              <button onClick={() => setActiveRoleTab('manager')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeRoleTab === 'manager' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-400'}`}>Менеджер</button>
            </div>
          )}
        </header>

        {/* 3. VISUAL ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-white dark:bg-[#1a1f2e] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600"><BarChart3 size={20} /></div>
                <h3 className="text-sm font-black uppercase tracking-widest dark:text-white">Динамика выработки</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black dark:text-white leading-none">{currentStats.total}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Всего за период</p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentStats.byDay}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="day" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a1f2e] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600"><PieIcon size={20} /></div>
              <h3 className="text-sm font-black uppercase tracking-widest dark:text-white">Каналы</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-48 w-full relative mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={currentStats.byChannel} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                      {currentStats.byChannel.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{currentStats.total}</span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Done</span>
                </div>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar pr-2">
                {currentStats.byChannel.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] font-bold uppercase">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                    </div>
                    <span className="text-slate-900 dark:text-white tabular-nums">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. HISTORY TABLE WITH PAGINATION */}
        <div className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <Layers size={18} className="text-blue-500" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Архив публикаций</span>
            <div className="h-px bg-slate-200 dark:bg-slate-800 w-full opacity-50" />
          </div>

          <div className="bg-white dark:bg-[#1a1f2e] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-black/20 border-b dark:border-slate-800">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-24">Видео</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Информация о ролике</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-32">YouTube</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-800">
                  {history.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="relative w-20 h-12 rounded-xl overflow-hidden bg-black shadow-md border dark:border-white/5 mx-auto group/vid">
                          <img src={`/${task.originalVideo.thumbnailPath}`} className="w-full h-full object-cover opacity-60" />
                          <button
                            onClick={() => setActivePreview({ url: `/${task.reactionFilePath}`, title: task.originalVideo.title, channel: task.channel.name })}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/vid:opacity-100 transition-opacity"
                          >
                            <Play size={16} className="text-white fill-white" />
                          </button>
                          <div className="absolute bottom-1 right-1 bg-black/70 px-1 rounded text-[8px] text-white font-bold tabular-nums">
                            {formatDuration(task.originalVideo.duration)}
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{task.channel.name}</p>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase leading-tight truncate max-w-[350px]">{task.originalVideo.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                          Выложено: {new Date(task.publishedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="p-6 text-right">
                        {task.youtubeUrl && (
                          <a
                            href={task.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20 active:scale-90 transition-all"
                          >
                            <PlayCircle size={20} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION BUTTON */}
            {hasMore && history.length > 0 && (
              <div className="p-8 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-black/10 flex justify-center">
                <button
                  onClick={() => loadHistory(history.length)}
                  disabled={isFetchingMore}
                  className="flex items-center gap-3 px-10 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isFetchingMore ? <Loader2 className="animate-spin" size={18} /> : "Загрузить больше"}
                </button>
              </div>
            )}

            {history.length === 0 && !isFetchingMore && !isRefreshing && (
              <div className="py-24 text-center">
                <Video className="text-slate-300 dark:text-slate-600 mx-auto mb-4" size={40} />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Архив пуст</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {activePreview && <VideoModal {...activePreview} onClose={() => setActivePreview(null)} />}
    </div>
  );
}

// Хелпер для времени ролика
const formatDuration = (s) => {
  if (!s) return '0:00';
  const m = Math.floor(s / 60);
  const secs = s % 60;
  return `${m}:${secs.toString().padStart(2, '0')}`;
};