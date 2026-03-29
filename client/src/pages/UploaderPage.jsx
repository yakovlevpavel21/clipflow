import { useEffect, useState } from 'react';
import axios from 'axios';
import { Zap, Loader2, PlayCircle, CheckCircle2, RotateCcw, Calendar, Youtube } from 'lucide-react';
import TaskCardUploader from '../components/TaskCardUploader'; 
import PublishModal from '../components/PublishModal';
import PageStatus from '../components/PageStatus';

export default function UploaderPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // 1. Загрузка очереди публикации
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/api/uploader/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error("Ошибка очереди:", err);
      setError("Не удалось загрузить список видео для публикации");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  // Обработка состояний загрузки всей страницы
  if (loading || error) {
    return <PageStatus loading={loading} error={error} onRetry={fetchTasks} />;
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">
      
      <header className="pt-10 mb-10 px-1 animate-in fade-in duration-700">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Публикация роликов
        </h1>
        <p className="text-sm md:text-base text-slate-500 font-medium mt-2">
          Проверьте готовые реакции и выложите их на соответствующие каналы.
        </p>
      </header>

      {tasks.length === 0 ? (
        <div className="py-24 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
            Очередь пуста 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCardUploader 
              key={task.id} 
              task={task} 
              onReview={() => setSelectedTask(task)} 
            />
          ))}
        </div>
      )}

      {/* Модалка открытия управления публикацией */}
      {selectedTask && (
        <PublishModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          onSuccess={() => {
            setSelectedTask(null);
            fetchTasks(); // Обновляем список после публикации
          }} 
        />
      )}
    </div>
  );
}