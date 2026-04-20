import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  User, BarChart3, PieChart as PieIcon,
  Calendar, Loader2, ArrowLeft,
  TrendingUp, ChevronLeft, 
  ChevronRight, CalendarDays, Shield
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeRoleTab, setActiveRoleTab] = useState('creator');

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

  const fetchStats = async () => {
    if (!isInitialLoading) setIsRefreshing(true);
    try {
      const res = await api.get(`/api/stats/profile-stats/${id}?month=${selectedMonth}`);
      setData(res.data);
      
      // Логика для Админа: если роль ADMIN, принудительно ставим вкладку менеджера
      if (res.data.user.role === 'ADMIN') {
        setActiveRoleTab('manager');
      } else if (isInitialLoading && res.data.creator.total === 0 && res.data.manager.total > 0) {
        setActiveRoleTab('manager');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [id, selectedMonth, activeRoleTab]);

  const currentStats = useMemo(() => {
    if (!data) return null;
    return activeRoleTab === 'creator' ? data.creator : data.manager;
  }, [data, activeRoleTab]);

  const isFuture = useMemo(() => {
    if (selectedMonth === 'all') return false;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth >= currentMonthStr;
  }, [selectedMonth]);

  const isBeforeRegistration = useMemo(() => {
    if (selectedMonth === 'all' || !data?.user?.createdAt) return false;
    const regDate = new Date(data.user.createdAt);
    const regMonthStr = `${regDate.getFullYear()}-${String(regDate.getMonth() + 1).padStart(2, '0')}`;
    return selectedMonth <= regMonthStr;
  }, [selectedMonth, data]);

  // Скрываем переключатель, если это админ
  const showRoleSwitcher = data?.user.role !== 'ADMIN' && (data?.creator.total > 0 && data?.manager.total > 0);

  if (isInitialLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="animate-spin text-blue-500" size={32} />
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Загрузка аналитики...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter'] transition-colors duration-300">
    
      <div className="flex items-center justify-between py-6 gap-2">
        {/* Кнопка НАЗАД (теперь компактная на мобилке) */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 md:w-auto md:h-auto md:gap-2 text-slate-500 hover:text-blue-500 transition-all shrink-0"
        >
          <ArrowLeft size={20} />
          <span className="hidden md:block text-[10px] font-bold uppercase tracking-widest">Назад</span>
        </button>

        {/* СЕЛЕКТОР ПЕРИОДА (Один ряд всегда) */}
        <div className="flex items-center bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-[#333333] shadow-sm p-1">
          <button
            disabled={isBeforeRegistration}
            onClick={() => handleMonthChange(-1)}
            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-400 hover:text-blue-500 disabled:opacity-10 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="px-2 min-w-[100px] md:min-w-[120px] text-center select-none">
            {selectedMonth === 'all' ? (
              <span className="text-[9px] md:text-[10px] font-black uppercase text-blue-600 tracking-tight">Всё время</span>
            ) : (
              <div className="flex flex-col leading-none">
                <span className="text-[10px] md:text-[11px] font-bold dark:text-white uppercase">
                  {new Date(selectedMonth + '-02').toLocaleString('ru-RU', { month: 'long' })}
                </span>
                <span className="text-[8px] md:text-[9px] font-bold text-slate-400 tabular-nums">
                  {selectedMonth.split('-')[0]}
                </span>
              </div>
            )}
          </div>

          <button
            disabled={isFuture}
            onClick={() => handleMonthChange(1)}
            className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg hover:bg-slate-50 dark:hover:bg-[#262626] text-slate-400 hover:text-blue-500 disabled:opacity-10 disabled:pointer-events-none transition-all"
          >
            <ChevronRight size={18} />
          </button>

          <div className="w-px h-5 bg-slate-200 dark:bg-[#333333] mx-1" />

          <button
            onClick={() => setSelectedMonth('all')}
            className={`h-8 md:h-9 px-2.5 md:px-4 rounded-lg text-[9px] md:text-[10px] font-black uppercase transition-all ${
              selectedMonth === 'all'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-[#262626]'
            }`}
          >
            Все
          </button>
        </div>
      </div>

      {/* 2. USER HEADER */}
      <div className={`transition-all duration-300 ${isRefreshing ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
        
        <header className="mb-6 p-6 md:p-8 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333333] shadow-sm flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
          <div className="relative shrink-0">
            <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
              <User size={40} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-xl border-4 border-white dark:border-[#1a1a1a] flex items-center justify-center text-white">
                <TrendingUp size={16} />
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{data.user.username}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
              <span className="bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[9px] font-black px-2 py-0.5 rounded border border-blue-600/20 uppercase tracking-widest">
                {data.user.role}
              </span>
              <span className="text-slate-400 text-[10px] font-medium flex items-center gap-1.5 ml-2">
                <Calendar size={12} /> в системе с {new Date(data.user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {showRoleSwitcher && (
            <div className="flex bg-slate-100 dark:bg-[#161616] p-1 rounded-xl gap-1 shrink-0">
              <button onClick={() => setActiveRoleTab('creator')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeRoleTab === 'creator' ? 'bg-white dark:bg-[#262626] text-blue-600 shadow-sm dark:text-white' : 'text-slate-400'}`}>Креатор</button>
              <button onClick={() => setActiveRoleTab('manager')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeRoleTab === 'manager' ? 'bg-white dark:bg-[#262626] text-blue-600 shadow-sm dark:text-white' : 'text-slate-400'}`}>Менеджер</button>
            </div>
          )}
        </header>

        {/* 3. VISUAL ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* График выработки */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200 dark:border-[#333333] shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600"><BarChart3 size={20} /></div>
                <h3 className="text-[11px] font-black uppercase tracking-widest dark:text-white">Динамика работы</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold dark:text-white leading-none">{currentStats.total}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Всего сделано</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentStats.byDay}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333333" />
                  <XAxis dataKey="day" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a1a', borderRadius: '12px', border: '1px solid #333333', color: '#fff' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Каналы */}
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl border border-slate-200 dark:border-[#333333] shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-600"><PieIcon size={20} /></div>
              <h3 className="text-[11px] font-black uppercase tracking-widest dark:text-white">По каналам</h3>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="h-44 w-full relative mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={currentStats.byChannel} innerRadius={50} outerRadius={65} paddingAngle={5} dataKey="value" stroke="none">
                      {currentStats.byChannel.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{currentStats.total}</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Done</span>
                </div>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                {currentStats.byChannel.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] font-medium">
                    <div className="flex items-center gap-2 truncate text-slate-500 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}