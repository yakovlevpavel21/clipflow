import { memo } from 'react';
import { MoreVertical, Play, PlayCircle, Download, Send, Edit3, CheckCircle2, RefreshCcw, UploadCloud } from 'lucide-react';
import { DateInfo, StatusIcon, VideoThumbnail } from './Helpers';
import api from '../../api';
import { toast } from 'sonner';

const MobileList = ({ 
  tasks, user, isManager, highlightedId, 
  setUploadTarget, setEditTarget, setPublishTarget, 
  setBottomSheetTask, setActivePreview, handleDownload 
}) => {

  const onThumbnailClick = (e, task) => {
    e.stopPropagation();
    const isReady = task.status === 'PUBLISHED' || task.status === 'REACTION_UPLOADED';
    setActivePreview({ 
      url: isReady ? `/${task.reactionFilePath}` : `/${task.originalVideo.filePath}`, 
      title: task.originalVideo.title,
      channel: task.channel.name
    });
  };

  return (
    <div className="min-[850px]:hidden divide-y divide-slate-100 dark:divide-[#333333]">
      {tasks.map((task) => {
        const isPub = task.status === 'PUBLISHED';
        const isUploaded = task.status === 'REACTION_UPLOADED';
        const isNewForMe = task.status === 'AWAITING_REACTION' && task.creatorId === user?.id;
        const isMyTask = task.creatorId === user?.id;

        // --- ЛОГИКА КНОПОК ---
        let primaryBtn = null;

        if (isPub) {
          // Кнопка результата для мобилки
          primaryBtn = (
            <GhostBtn 
              label="YouTube" 
              icon={<PlayCircle size={14} className="text-emerald-500" />} 
              onClick={() => window.open(task.youtubeUrl, '_blank')} 
            />
          );
        } else if (isManager) {
          if (isUploaded) {
            primaryBtn = <FillBtn label="Выложить" icon={<Send size={14}/>} onClick={() => setPublishTarget(task)} color="bg-blue-600" />;
          } else {
            primaryBtn = <GhostBtn label="Изменить" icon={<Edit3 size={14}/>} onClick={() => setEditTarget(task)} />;
          }
        } else if (isMyTask) {
          if (isNewForMe) {
            primaryBtn = (
              <FillBtn 
                label="Начать" 
                icon={<Download size={14} />} 
                onClick={() => {
                  api.post(`/api/tasks/${task.id}/claim`)
                    .then(() => {
                      toast.success("Задача принята в работу");
                      handleDownload(task, 'original');
                    })
                    .catch(() => toast.error("Не удалось принять задачу"));
                }} 
                color="bg-indigo-600" 
              />
            );
          } else if (task.needsFixing) {
            primaryBtn = <FillBtn label="Исправить" icon={<RefreshCcw size={14}/>} onClick={() => setUploadTarget(task)} color="bg-red-600" />;
          } else if (isUploaded) {
            primaryBtn = <GhostBtn label="Заменить" icon={<RefreshCcw size={14}/>} onClick={() => setUploadTarget(task)} />;
          } else {
            // Я поставил синий цвет для "Сдать", так как это основное действие в работе
            primaryBtn = <FillBtn label="Сдать" icon={<UploadCloud size={14} />} onClick={() => setUploadTarget(task)} color="bg-amber-600" />;
          }
        }

        return (
          <div 
            key={task.id} 
            id={`task-${task.id}`} 
            className={`p-4 flex gap-4 transition-all ${task.id === highlightedId ? 'bg-blue-500/10' : ''}`}
          >
            {/* Слева: Увеличенное превью (176x99 = ровно 16:9) */}
            <div className="shrink-0 cursor-pointer active:opacity-80 transition-opacity" onClick={(e) => onThumbnailClick(e, task)}>
              <VideoThumbnail 
                src={task.originalVideo.thumbnailPath} 
                duration={task.originalVideo.duration}
                className="w-44 h-[99px] rounded-xl" 
              />
            </div>

            {/* Справа: Информация (Контейнер растянут по высоте превью) */}
            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
              <div className="relative pr-6">
                <h4 className="text-[14px] font-semibold leading-tight line-clamp-2 text-slate-900 dark:text-white mb-1.5">
                  {task.originalVideo.title}
                </h4>
                
                <div className="flex items-center gap-1.5 text-[12px] text-slate-900 dark:text-[#ffffff]">
                  <StatusIcon task={task} size={14} />
                  <span className="font-medium truncate max-w-[70px]">{task.channel.name}</span>
                  <span className="opacity-70">•</span>
                  <DateInfo task={task} relative={true} />
                </div>

                {/* Меню три точки */}
                <button 
                  onClick={(e) => { e.stopPropagation(); setBottomSheetTask(task); }} 
                  className="absolute -top-1.5 -right-2 p-2 text-slate-400 active:text-blue-500 transition-colors"
                >
                  <MoreVertical size={18}/>
                </button>
              </div>

              {/* КНОПКА ДЕЙСТВИЯ (Всегда одной ширины и внизу) */}
              <div className="mt-auto">
                {primaryBtn}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Вспомогательные компоненты кнопок (фиксированная ширина 140px)
const FillBtn = ({ label, icon, onClick, color }) => (
  <button 
    // Важно: передаем 'e' в onClick
    onClick={(e) => { e.stopPropagation(); onClick(e); }} 
    className={`${color} text-white h-8 w-[140px] rounded-md flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider active:scale-95 transition-all shadow-md shrink-0`}
  >
    {icon} <span className="relative top-[-0.5px]">{label}</span>
  </button>
);

const GhostBtn = ({ label, icon, onClick, color = "text-slate-600 dark:text-[#d1d1d1]" }) => (
  <button 
    // Важно: передаем 'e' в onClick
    onClick={(e) => { e.stopPropagation(); onClick(e); }} 
    className={`${color} h-8 w-[140px] rounded-md flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-[#333333] active:bg-slate-50 dark:active:bg-white/5 transition-all shrink-0`}
  >
    {icon} <span className="relative top-[-0.5px]">{label}</span>
  </button>
);

export default memo(MobileList);