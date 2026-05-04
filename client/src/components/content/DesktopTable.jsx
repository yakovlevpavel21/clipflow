import { memo, cloneElement } from 'react';
import {
  Play, Download, MoreVertical, PlayCircle, ExternalLink,
  Trash2, Edit3, Send, Clock, RefreshCcw, CheckCircle2, UploadCloud 
} from 'lucide-react';
import api from '../../api';
import { StatusBadge, DateInfo, VideoThumbnail } from './Helpers';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const DesktopTable = ({
  tasks, user, isManager, isAdmin, highlightedId,
  setUploadTarget, setEditTarget, setPublishTarget, setActivePreview,
  loadData, handleDownload, activeDropdownId, setActiveDropdownId,
  setHistoryTarget
}) => {

  return (
    <div className="w-full">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="bg-[#f9fafb] dark:bg-[#1f1f1f]">
            {[
              { label: 'Видео', width: 'w-[45%]', align: 'text-left pl-8' },
              ...(isManager ? [{ label: 'Автор', width: 'w-[15%]', align: 'text-center' }] : []),
              { label: 'Канал', width: 'w-[12%]', align: 'text-center' },
              { label: 'Статус', width: 'w-[13%]', align: 'text-center' },
              { label: 'Дата', width: 'w-[15%]', align: 'text-right pr-8' }
            ].map((col, i) => (
              <th
                key={i}
                className={`
                  sticky z-50 p-4 font-bold text-[10px] uppercase tracking-widest
                  text-slate-400 dark:text-[#888888]
                  bg-[#f9fafb] dark:bg-[#1f1f1f] 
                  border-b border-slate-100 dark:border-[#333333]
                  top-[calc(52px+env(safe-area-inset-top))] min-[1150px]:top-0
                  ${col.align} ${col.width}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-[#262626]">
          {tasks.map((task, index) => {
            const isPub = task.status === 'PUBLISHED';
            const isUploaded = task.status === 'REACTION_UPLOADED';
            const isReady = isUploaded || isPub;
            const isMyManagedTask = isAdmin || (user.role === 'MANAGER' && task.managerId === user.id);
            const isLastItems = index >= tasks.length - 3 && tasks.length > 5;
            
            const isMyTask = task.creatorId === user?.id;
            const isNewTask = task.status === 'AWAITING_REACTION' && isMyTask;

            // --- 1. ЛОГИКА ГЛАВНОЙ КНОПКИ (Унификация с мобайлом) ---
            let primaryBtn = null;

            if (isPub) {
              // Кнопка результата для опубликованных (доступна всем)
              primaryBtn = (
                <GhostBtn 
                  label="YouTube" 
                  icon={<PlayCircle size={14} className="text-emerald-500" />} 
                  onClick={() => window.open(task.youtubeUrl, '_blank')} 
                />
              );
            } else if (isManager) {
              if (isUploaded) {
                primaryBtn = <FillBtn label="Выложить" icon={<Send size={14}/>} onClick={() => setPublishTarget(task)} color="bg-blue-600 hover:bg-blue-700" />;
              } else {
                primaryBtn = <GhostBtn label="Изменить" icon={<Edit3 size={14}/>} onClick={() => setEditTarget(task)} />;
              }
            } else if (isMyTask) {
              if (isNewTask) {
                primaryBtn = <FillBtn label="Начать" icon={<Download size={14} />} onClick={(e) => {
                  e.stopPropagation();
                  api.post(`/api/tasks/${task.id}/claim`)
                    .then(() => {
                      toast.success("Задача принята"); // Уведомление
                      handleDownload(task, 'original'); // Запуск скачивания
                    })
                    .catch(() => toast.error("Ошибка при принятии задачи"));
                }} color="bg-indigo-600 hover:bg-indigo-700" />;
              } else if (task.needsFixing) {
                primaryBtn = <FillBtn label="Исправить" icon={<RefreshCcw size={14}/>} onClick={() => setUploadTarget(task)} color="bg-red-600 hover:bg-red-700" />;
              } else if (isUploaded) {
                primaryBtn = <GhostBtn label="Заменить" icon={<RefreshCcw size={14}/>} onClick={() => setUploadTarget(task)} />;
              } else {
                primaryBtn = <FillBtn label="Сдать" icon={<UploadCloud size={14}/>} onClick={() => setUploadTarget(task)} color="bg-amber-600 hover:bg-amber-700" />;
              }
            }

            // --- 2. ЛОГИКА ВЫПАДАЮЩЕГО МЕНЮ ---
            const actions = [
              { id: 'p_orig', label: 'Оригинал', icon: <Play size={16}/>, disabled: !task.originalFileExists, onClick: () => setActivePreview({ url: `/${task.originalVideo.filePath}`, title: task.originalVideo.title, channel: task.channel.name }) },
              { id: 'yt_orig', label: 'YouTube Оригинал', icon: <ExternalLink size={16}/>, onClick: () => window.open(task.originalVideo.url, '_blank') },
              { id: 'dl_orig', label: 'Скачать оригинал', icon: <Download size={16}/>, disabled: !task.originalFileExists, onClick: () => handleDownload(task, 'original') },
              { type: 'divider' },
              { id: 'p_react', label: 'Результат', icon: <PlayCircle size={16} className="text-emerald-500" />, disabled: !task.reactionFileExists, onClick: () => setActivePreview({ url: `/${task.reactionFilePath}`, title: task.originalVideo.title, channel: task.channel.name }) },
              { id: 'yt_res', label: 'YouTube Результат', icon: <ExternalLink size={16} className="text-red-500" />, disabled: !isPub || !task.youtubeUrl, onClick: () => window.open(task.youtubeUrl, '_blank') },
              { id: 'dl_react', label: 'Скачать результат', icon: <Download size={16} className="text-emerald-500" />, disabled: !task.reactionFileExists, onClick: () => handleDownload(task, 'reaction') },
              { type: 'divider' },
              { id: 'history', label: 'История событий', icon: <Clock size={16}/>, onClick: () => setHistoryTarget(task) },
            ];

            if (isMyManagedTask) {
              actions.push({ type: 'divider' });
              actions.push({ 
                id: 'edit', 
                label: 'Настройки задачи', 
                icon: <Edit3 size={16} />, 
                onClick: () => setEditTarget(task) 
              });
              
              actions.push({ 
                id: 'del', 
                label: 'Удалить задачу', 
                icon: <Trash2 size={16} className="text-red-500" />, 
                color: 'text-red-500', 
                onClick: () => { if(confirm("Удалить?")) api.delete(`/api/tasks/${task.id}`).then(() => loadData(0, true)) } 
              });
            }

            return (
              <tr 
                key={task.id} 
                id={`task-${task.id}`}
                className={`
                  /* duration-75 делает смену цвета почти мгновенной */
                  transition-colors duration-75 
                  ${task.id === highlightedId 
                    ? 'bg-blue-600/15 !outline !outline-1 !outline-blue-500/30' 
                    : 'hover:bg-gray-100/50 dark:hover:bg-[#252525]' // Легкая подсветка
                  }
                `}
              >
                <td className="p-4 pl-8">
                  <div className="flex items-start gap-5">
                    <div className="relative group cursor-pointer shrink-0" onClick={() => setActivePreview({ 
                          url: isReady ? `/${task.reactionFilePath}` : `/${task.originalVideo.filePath}`, 
                          title: task.originalVideo.title,
                          channel: task.channel.name 
                        })}>
                      <VideoThumbnail 
                        src={task.originalVideo.thumbnailPath} 
                        duration={task.originalVideo.duration} 
                        className="w-40 h-[90px] rounded-xl"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"><Play size={24} fill="white" className="text-white" /></div>
                    </div>

                    <div className="min-w-0 flex-1 h-[90px] flex flex-col justify-between py-0.5">
                      <h4 className="text-[14px] font-semibold leading-snug line-clamp-2 text-slate-900 dark:text-white uppercase tracking-tight">
                        {task.originalVideo.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {primaryBtn && <div className="w-[140px] shrink-0">{primaryBtn}</div>}
                        <div className="relative">
                          <button 
                            className="dots-menu-button p-1.5 rounded-md transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            onClick={(e) => { e.stopPropagation(); setActiveDropdownId(activeDropdownId === task.id ? null : task.id); }}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {activeDropdownId === task.id && (
                            <div className={`absolute left-0 w-64 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#333333] rounded-xl shadow-2xl z-[100] py-1.5 animate-in fade-in zoom-in-95 duration-75 ${isLastItems ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
                              {actions.map((act, i) => {
                                if (act.type === 'divider') return <div key={i} className="h-px bg-slate-100 dark:bg-[#262626] my-1 mx-2" />;
                                return (
                                  <button key={act.id} disabled={act.disabled} onClick={(e) => { e.stopPropagation(); act.onClick(); }} className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-[#262626] text-[13px] font-medium transition-colors ${act.disabled ? 'opacity-30 cursor-not-allowed' : (act.color || 'text-slate-700 dark:text-[#eeeeee]')}`}>
                                    <span className="opacity-70">{act.icon}</span> <span>{act.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </td>

                {isManager && (
                  <td className="p-4 text-center">
                    <Link to={`/profile/${task.creatorId}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2 text-slate-500 dark:text-[#d1d1d1] hover:text-blue-500 transition-colors group/author">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold group-hover/author:bg-blue-600 group-hover/author:text-white transition-all">
                        {task.creator?.username?.slice(0, 1).toUpperCase() || '?'}
                      </div>
                      <span className="text-[13px] font-medium">{task.creator?.username || '---'}</span>
                    </Link>
                  </td>
                )}

                <td className="p-4 text-center">
                  <span className="text-[13px] font-medium text-slate-500 dark:text-[#d1d1d1]">{task.channel.name}</span>
                </td>
                
                <td className="p-4 text-center overflow-visible">
                  <div className="flex justify-center items-center w-full px-1 overflow-visible">
                    <StatusBadge task={task} />
                  </div>
                </td>
                
                <td className="p-4 pr-8 text-right overflow-visible">
                  <DateInfo task={task} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};

const FillBtn = ({ label, icon, onClick, color }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }} 
    className={`${color} text-white h-8 w-full rounded-md flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all shadow-sm`}
  >
    {icon} <span className="relative top-[-0.5px]">{label}</span>
  </button>
);

const GhostBtn = ({ label, icon, onClick }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(e); }} 
    className="bg-transparent text-slate-600 dark:text-[#d1d1d1] h-8 w-full rounded-md flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-[#333333] hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all"
  >
    {icon} <span className="relative top-[-0.5px]">{label}</span>
  </button>
);

export default memo(DesktopTable);