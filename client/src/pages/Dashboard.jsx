import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { 
  BarChart3, Video, Clock, CheckCircle2, 
  ArrowRight, Users, Trophy, Play, Layers 
} from 'lucide-react';
import { StatusIcon } from '../components/content/Helpers';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/stats/dashboard-summary')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin text-blue-600"><Loader2 size={32} /></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 font-['Inter']">
      
      {/* ПРИВЕТСТВИЕ */}
      <header className="py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          Привет, {user.username}! 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Вот что происходит в Clipsio сегодня.
        </p>
      </header>

      {/* ОСНОВНЫЕ ПОКАЗАТЕЛИ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard 
          icon={<CheckCircle2 className="text-emerald-500" />} 
          label="Опубликовано" 
          value={data?.summary.totalPublished} 
          subtext="Всего за время работы"
        />
        <StatCard 
          icon={<Clock className="text-amber-500" />} 
          label="В очереди" 
          value={data?.summary.activeQueue} 
          subtext="Активные задачи"
        />
        <StatCard 
          icon={<Video className="text-blue-500" />} 
          label="За сегодня" 
          value={data?.summary.publishedToday} 
          subtext="Новых видео вышло"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА: КАНАЛЫ И ТОП */}
        <div className="lg:col-span-1 space-y-8">
          <section>
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 flex items-center gap-2">
              <Layers size={14} /> Каналы
            </h3>
            <div className="space-y-2">
              {data?.channels.map((ch, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-100 dark:border-[#333333]">
                  <div className="flex items-center gap-3">
                    <img 
                      src={ch.thumb ? `/${ch.thumb}` : `https://ui-avatars.com/api/?name=${ch.name}`} 
                      className="w-8 h-8 rounded-full object-cover" 
                      alt="" 
                    />
                    <span className="text-sm font-semibold dark:text-[#f1f1f1]">{ch.name}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{ch.count} видео</span>
                </div>
              ))}
            </div>
          </section>

          <div className="p-5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-600/20 relative overflow-hidden group">
             <Trophy className="absolute -right-2 -bottom-2 w-24 h-24 opacity-10 transform group-hover:scale-110 transition-transform" />
             <h4 className="text-sm font-bold uppercase tracking-wider opacity-80">Твой профиль</h4>
             <p className="text-2xl font-black mt-2">Статистика</p>
             <Link to={`/profile/${user.id}`} className="mt-4 inline-flex items-center gap-2 text-xs font-bold bg-white/20 hover:bg-white/30 p-2 px-4 rounded-lg transition-all">
                Открыть <ArrowRight size={14} />
             </Link>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ПОСЛЕДНИЕ ЗАДАЧИ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
              <Play size={14} /> Свежая активность
            </h3>
            <button 
              onClick={() => navigate('/content')}
              className="text-[11px] font-bold text-blue-500 uppercase hover:underline flex items-center gap-1"
            >
              Весь контент <ArrowRight size={14} />
            </button>
          </div>

          <div className="space-y-3">
            {data?.recentTasks.map(task => (
              <div key={task.id} className="flex items-center gap-4 p-3 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-[#333333] hover:border-blue-500/30 transition-all">
                <div className="w-20 h-12 rounded-lg overflow-hidden shrink-0 bg-black">
                   <img src={`/${task.originalVideo.thumbnailPath}`} className="w-full h-full object-cover opacity-60" alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-blue-500 uppercase leading-none mb-1">{task.channel.name}</p>
                  <h4 className="text-sm font-medium text-slate-900 dark:text-[#f1f1f1] truncate">{task.originalVideo.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <StatusIcon task={task} size={12} />
                     <span className="text-[10px] text-slate-400 font-medium">
                       {task.creator?.username || 'Без автора'} • {new Date(task.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                     </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }) {
  return (
    <div className="p-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-100 dark:border-[#333333] shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-slate-50 dark:bg-[#262626] rounded-xl">
          {icon}
        </div>
        <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{label}</span>
      </div>
      <div className="space-y-0.5">
        <p className="text-3xl font-bold dark:text-white tabular-nums">{value || 0}</p>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight opacity-60">{subtext}</p>
      </div>
    </div>
  );
}

const Loader2 = ({ size }) => <BarChart3 size={size} className="animate-pulse" />;