import { memo } from 'react';
import { MoreVertical, User } from 'lucide-react';
import { DateInfo, StatusIcon, VideoThumbnail } from './Helpers';
import { Link } from 'react-router-dom';

const MobileList = ({ tasks, isManager, highlightedId, setUploadTarget, setEditTarget, setPublishTarget, setBottomSheetTask, setActivePreview, lastElementRef }) => {
  
  const handleRowClick = (task) => {
    if (task.status === 'PUBLISHED') {
      setActivePreview({ 
        url: `/${task.reactionFilePath}`, 
        title: task.originalVideo.title,
        channel: task.channel.name
      });
    } else if (isManager) {
      if (task.status === 'REACTION_UPLOADED') {
        setPublishTarget(task);
      } else {
        setEditTarget(task);
      }
    } else {
      setUploadTarget(task);
    }
  };

  const formatDuration = (s) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-[850px]:hidden divide-y divide-slate-100 dark:divide-[#333333]">
      {tasks.map((task, index) => (
        <div 
          key={task.id} 
          id={`task-${task.id}`}
          onClick={() => handleRowClick(task)}
          className={`p-4 flex gap-4 active:bg-slate-50 dark:active:bg-[#2a2a2a] relative transition-all ${task.id === highlightedId ? 'bg-blue-500/10' : ''}`}
        >
          <VideoThumbnail 
            src={task.originalVideo.thumbnailPath} 
            duration={task.originalVideo.duration}
            className="w-40 h-[90px] rounded-xl" // Без границ и теней, как просили ранее
          />

          {/* Контентная часть */}
          <div className="flex-1 min-w-0 pr-4 flex flex-col justify-between py-0.5">
            
            <h4 className="text-[15px] font-semibold leading-tight line-clamp-2 text-slate-900 dark:text-white">
              {task.originalVideo.title}
            </h4>

            {/* 2. Иконка статуса + Канал + Автор: Чистый текст без подложек */}
            <div className="flex items-center gap-2 text-[13px]">
                <StatusIcon task={task} size={16} />
                
                {/* Канал: Просто текст, чуть ярче */}
                <span className="font-medium text-slate-600 dark:text-[#eeeeee]">
                  {task.channel.name}
                </span>
                
                {isManager && task.creator && (
                  <>
                    <span className="text-slate-300 dark:text-[#444444] text-[10px]">●</span>
                    <Link 
                      to={`/profile/${task.creatorId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 truncate text-slate-500 dark:text-[#cccccc] hover:text-blue-500 transition-colors"
                    >
                      <User size={13} className="shrink-0 opacity-70" />
                      <span className="truncate max-w-[70px] font-medium">{task.creator.username}</span>
                    </Link>
                  </>
                )}
            </div>

            <div className="mt-0.5">
                {task.needsFixing ? (
                  <div className="text-red-500 font-semibold italic text-[13px] leading-tight">
                    Правки: {task.rejectionReason || "измените видео"}
                  </div>
                ) : (
                  <DateInfo task={task} />
                )}
            </div>
          </div>

          <button onClick={(e) => { e.stopPropagation(); setBottomSheetTask(task); }} className="absolute top-1 right-0 p-4 text-slate-400">
            <MoreVertical size={20}/>
          </button>
        </div>
      ))}
    </div>
  );
};

export default memo(MobileList);