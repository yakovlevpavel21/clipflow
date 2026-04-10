import { useEffect, useState, useMemo } from 'react';
import api from '../api';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

// Компоненты
import TaskCard from '../components/TaskCard';
import ChannelFilters from '../components/ChannelFilters';
import UploadModal from '../components/UploadModal';
import VideoModal from '../components/VideoModal';
import PageStatus from '../components/PageStatus';

export default function CreatorPage() {
  const [tasks, setTasks] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('all');
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [uploadTarget, setUploadTarget] = useState(null);
  const [activePreview, setActivePreview] = useState(null); 

  const location = useLocation();
  const navigate = useNavigate();

  // 1. ЗАГРУЗКА ДАННЫХ (Одним разом)
  const loadData = async () => {
    if (!isInitialLoading) setIsRefreshing(true);
    setError(null);

    try {
      // Запрашиваем текущие задачи креатора (my-work)
      // Берем с запасом take=100, так как активных задач обычно немного
      const url = `/api/tasks/my-work?channelId=${selectedChannel}&take=100`;
      
      const [tasksRes, chanRes] = await Promise.all([
        api.get(url),
        api.get('/api/channels')
      ]);

      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setChannels(Array.isArray(chanRes.data) ? chanRes.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Не удалось загрузить ваши задачи");
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChannel]);

  // 2. СКРОЛЛ К ЗАДАЧЕ ИЗ УВЕДОМЛЕНИЙ + ОЧИСТКА STATE
  useEffect(() => {
    const taskId = location.state?.scrollToTaskId;
    if (taskId && tasks.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`task-${taskId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'transition-all');
          
          // Очищаем стейт навигации, чтобы не скроллило при обновлении
          navigate(location.pathname, { replace: true, state: {} });
          
          setTimeout(() => element.classList.remove('ring-4', 'ring-blue-500'), 3000);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [tasks, location.state, navigate, location.pathname]); 

  // 3. ОБРАБОТЧИКИ
  const handleCancelUpload = async (id) => {
    if (!confirm("Отозвать видео с проверки?")) return;
    try {
      await api.post(`/api/tasks/${id}/cancel-upload`);
      loadData();
    } catch (err) { alert("Ошибка при отзыве файла"); }
  };

  const handleOpenPreview = (task, type) => {
    const url = type === 'original' ? `/${task.originalVideo.filePath}` : `/${task.reactionFilePath}`;
    setActivePreview({ url, title: task.originalVideo.title, channel: task.channel?.name });
  };

  // 4. ГРУППИРОВКА ПО ДАТАМ
  const groupedTasks = useMemo(() => {
    const groups = {};
    tasks.forEach(task => {
      const date = new Date(task.updatedAt).toLocaleDateString('ru-RU', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(task);
    });
    return groups;
  }, [tasks]);

  if (isInitialLoading) return <PageStatus loading={true} error={error} onRetry={loadData} />;

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">
      
      {/* HEADER */}
      <header className="pt-10 mb-8 px-1 animate-in fade-in duration-700">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Текущие задачи
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
            Ваши активные проекты. Подготовьте реакции и отправьте их на проверку менеджеру.
          </p>
        </div>
      </header>

      {/* FILTERS (Sticky) */}
      <ChannelFilters 
        channels={channels} 
        selectedChannel={selectedChannel} 
        onSelect={setSelectedChannel} 
      />

      {/* --- CONTENT LIST --- */}
      <div className={`mt-10 space-y-12 transition-all duration-300 ${isRefreshing ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
        {tasks.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <LayoutGrid className="text-slate-300 dark:text-slate-700" size={32} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] opacity-60">У вас нет активных задач</p>
          </div>
        ) : (
          Object.keys(groupedTasks).map(date => (
            <div key={date} className="space-y-6">
              <div className="flex items-center gap-4 px-2 opacity-60">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">{date}</span>
                <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />
              </div>
              <div className="space-y-4">
                {groupedTasks[date].map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    role="creator" // Важно для отображения кнопок креатора
                    onPreview={handleOpenPreview}
                    onUpload={() => setUploadTarget(task)}
                    onCancelUpload={handleCancelUpload}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODALS --- */}
      {activePreview && (
        <VideoModal {...activePreview} onClose={() => setActivePreview(null)} />
      )}
      
      {uploadTarget && (
        <UploadModal 
          task={uploadTarget} 
          onClose={() => setUploadTarget(null)} 
          onSuccess={() => { setUploadTarget(null); loadData(); }} 
        />
      )}
    </div>
  );
}