import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { Plus, LayoutGrid, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

// Компоненты
import PageStatus from '../components/PageStatus';
import TaskCard from '../components/TaskCard'; // Универсальная карточка
import ChannelFilters from '../components/ChannelFilters';
import AddTaskModal from '../components/AddTaskModal';
import PublishModal from '../components/PublishModal';
import VideoModal from '../components/VideoModal';
import EditTaskModal from '../components/EditTaskModal';

export default function ManagerPage() {
  // --- СОСТОЯНИЯ ДАННЫХ ---
  const [tasks, setTasks] = useState([]);
  const [channels, setChannels] = useState([]);
  const [creators, setCreators] = useState([]);
  
  // --- СОСТОЯНИЯ ЗАГРУЗКИ ---
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // --- ФИЛЬТРЫ ---
  const [selectedChannel, setSelectedChannel] = useState('all');

  // --- МОДАЛЬНЫЕ ОКНА ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTaskForEdit, setSelectedTaskForEdit] = useState(null);
  const [selectedTaskForPublish, setSelectedTaskForPublish] = useState(null);
  const [activePreview, setActivePreview] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // 1. ЗАГРУЗКА ДАННЫХ (Одним разом)
  const loadData = async () => {
    if (!isInitialLoading) setIsRefreshing(true);
    setError(null);

    try {
      // Грузим только активные задачи (tab=active) без пагинации (take=100)
      const url = `/api/tasks/managed?channelId=${selectedChannel}&take=100&tab=active`;
      
      const [tasksRes, chanRes, creatorsRes] = await Promise.all([
        api.get(url),
        api.get('/api/channels'),
        api.get('/api/tasks/creators')
      ]);

      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setChannels(Array.isArray(chanRes.data) ? chanRes.data : []);
      setCreators(Array.isArray(creatorsRes.data) ? creatorsRes.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Не удалось загрузить данные сервера");
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedChannel]);

  // 2. СКРОЛЛ К ЗАДАЧЕ И ОЧИСТКА STATE
  useEffect(() => {
    const taskId = location.state?.scrollToTaskId;
    if (taskId && tasks.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`task-${taskId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-blue-500', 'ring-offset-4', 'transition-all');
          
          // ОЧИСТКА: удаляем scrollToTaskId из истории, чтобы не скроллило повторно
          navigate(location.pathname, { replace: true, state: {} });
          
          setTimeout(() => element.classList.remove('ring-4', 'ring-blue-500'), 3000);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [tasks, location.state, navigate, location.pathname]);

  // 3. УДАЛЕНИЕ ЗАДАЧИ
  const handleDeleteTask = async (id) => {
    if (!window.confirm("Удалить задачу безвозвратно?")) return;
    try {
      await api.delete(`/api/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Ошибка при удалении");
    }
  };

  // 4. ГРУППИРОВКА ПО ДАТАМ
  const groupedTasks = useMemo(() => {
    const groups = {};
    tasks.forEach(task => {
      const date = new Date(task.createdAt).toLocaleDateString('ru-RU', {
        weekday: 'long', day: 'numeric', month: 'long'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(task);
    });
    return groups;
  }, [tasks]);

  const handleOpenPreview = (task, type) => {
    const url = type === 'original' ? `/${task.originalVideo.filePath}` : `/${task.reactionFilePath}`;
    setActivePreview({ url, title: task.originalVideo.title, channel: task.channel?.name });
  };

  if (isInitialLoading) return <PageStatus loading={true} error={error} onRetry={loadData} />;

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">
      
      {/* HEADER */}
      <header className="pt-10 mb-8 px-1 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Очередь задач
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
              Управление активным контентом и проверка входящих реакций от креаторов.
            </p>
          </div>
          
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 shrink-0"
          >
            <Plus size={18} /> Добавить видео
          </button>
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
                    role="manager" // Важно для отображения кнопок менеджера
                    onPreview={handleOpenPreview}
                    onPublish={() => setSelectedTaskForPublish(task)}
                    onEdit={(t) => { setSelectedTaskForEdit(t); setIsEditModalOpen(true); }}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODALS --- */}
      {isAddModalOpen && (
        <AddTaskModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSuccess={() => { setIsAddModalOpen(false); loadData(); }} 
          channels={channels} 
        />
      )}

      {isEditModalOpen && (
        <EditTaskModal 
          task={selectedTaskForEdit} 
          creators={creators} 
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={() => { setIsEditModalOpen(false); loadData(); }} 
        />
      )}
      
      {selectedTaskForPublish && (
        <PublishModal 
          task={selectedTaskForPublish} 
          onClose={() => setSelectedTaskForPublish(null)} 
          onSuccess={() => { setSelectedTaskForPublish(null); loadData(); }} 
        />
      )}
      
      {activePreview && (
        <VideoModal {...activePreview} onClose={() => setActivePreview(null)} />
      )}
    </div>
  );
}