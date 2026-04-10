import { useState, useEffect } from 'react';
import api, { socket } from '../api'; 
import { Shield, Loader2, Plus, Users, Radio, Settings2 } from 'lucide-react';

// Компоненты
import AdminUsers from '../components/AdminUsers';
import AdminChannels from '../components/AdminChannels';
import AdminSettings from '../components/AdminSettings';
import UserModal from '../components/UserModal';
import PageStatus from '../components/PageStatus';

export default function AdminPage() {
  // --- СОСТОЯНИЯ ДАННЫХ ---
  const [activeTab, setActiveTab] = useState('users'); 
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [proxy, setProxy] = useState('');
  
  // --- ИНТЕРФЕЙС ---
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userModal, setUserModal] = useState({ open: false, data: null });
  const [now, setNow] = useState(new Date());

  // --- ЗАГРУЗКА ДАННЫХ ---
  const fetchData = async () => {
    if (!isInitialLoading) setLoading(true);
    setError(null);
    try {
      const [u, c, s] = await Promise.all([
        api.get('/api/admin/users'),
        api.get('/api/channels'),
        api.get('/api/admin/settings')
      ]);
      
      setUsers(u.data);
      setChannels(c.data);
      
      // Ищем прокси в настройках
      const proxySetting = s.data.find(i => i.key === 'proxy_url');
      if (proxySetting) setProxy(proxySetting.value);
      
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError("Не удалось загрузить данные администратора");
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const timer = setInterval(() => setNow(new Date()), 60000);

    // Статусы "В сети" в реальном времени
    socket.on('status_change', (data) => {
      setUsers(prev => prev.map(u => 
        u.id === Number(data.userId) 
          ? { ...u, isOnline: data.online, lastActive: data.lastActive || u.lastActive } 
          : u
      ));
    });

    return () => {
      clearInterval(timer);
      socket.off('status_change');
    };
  }, []);

  // --- ЛОГИКА ПОЛЬЗОВАТЕЛЕЙ ---
  const handleSaveUser = async (formData) => {
    try {
      if (userModal.data) {
        await api.patch(`/api/admin/users/${userModal.data.id}`, formData);
      } else {
        await api.post('/api/admin/users', formData);
      }
      setUserModal({ open: false, data: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка сохранения");
    }
  };

  // --- ЛОГИКА КАНАЛОВ ---
  const handleAddChannel = async (name) => {
    try {
      await api.post('/api/admin/channels', { name });
      fetchData();
    } catch (err) { alert("Ошибка создания канала"); }
  };

  const updateChannel = async (id, data) => {
    // 1. Мгновенно обновляем локальный стейт, чтобы кнопка переключилась
    setChannels(prev => prev.map(ch => 
      ch.id === id ? { ...ch, ...data } : ch
    ));

    try {
      // 2. Отправляем запрос на сервер
      await api.patch(`/api/admin/channels/${id}`, data);
    } catch (err) {
      console.error("Update channel error");
      // Если сервер выдал ошибку, возвращаем данные из базы для синхронизации
      fetchData(); 
    }
  };

  // --- ЛОГИКА НАСТРОЕК ---
  const saveProxy = async () => {
    try {
      await api.post('/api/admin/settings', { key: 'proxy_url', value: proxy });
      alert("Настройки прокси сохранены");
    } catch (err) { alert("Ошибка сохранения прокси"); }
  };

  const deleteItem = async (type, id) => {
    if (!confirm("Удалить безвозвратно?")) return;
    try {
      const endpoint = type === 'users' ? `/api/admin/users/${id}` : `/api/admin/channels/${id}`;
      await api.delete(endpoint);
      fetchData();
    } catch (err) { alert("Ошибка при удалении"); }
  };

  if (isInitialLoading) return <PageStatus loading={true} error={error} onRetry={fetchData} />;

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">
      
      {/* HEADER */}
      <header className="pt-10 mb-8 px-1 animate-in fade-in duration-700">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Админ-центр
          </h1>
          <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">
            Управление доступом сотрудников, конфигурация каналов и системные настройки Clipsio.
          </p>
        </div>
      </header>

      {/* TABS (Sticky) */}
      <div className="sticky top-0 lg:top-0 max-lg:top-[64px] z-40 bg-slate-50/95 dark:bg-[#0a0f1c]/95 backdrop-blur-md -mx-4 px-4 pt-4 pb-4 border-b dark:border-slate-800 transition-all">
        <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1.5 rounded-2xl gap-1 shadow-inner">
          <TabBtn 
            label="Сотрудники" 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')} 
          />
          <TabBtn 
            label="Каналы" 
            active={activeTab === 'channels'} 
            onClick={() => setActiveTab('channels')} 
          />
          <TabBtn 
            label="Настройки" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className={`mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500 ${loading ? 'opacity-40 pointer-events-none' : ''}`}>
        {activeTab === 'users' && (
          <AdminUsers 
            users={users} 
            now={now} 
            onEdit={(u) => setUserModal({ open: true, data: u })} 
            onDelete={deleteItem}
            onAdd={() => setUserModal({ open: true, data: null })}
          />
        )}

        {activeTab === 'channels' && (
          <AdminChannels 
            channels={channels} 
            onAdd={handleAddChannel} 
            onDelete={deleteItem} 
            onUpdate={updateChannel} 
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettings 
            proxy={proxy}
            setProxy={setProxy}
            onSaveProxy={saveProxy}
          />
        )}
      </div>

      {/* USER MODAL */}
      {userModal.open && (
        <UserModal 
          user={userModal.data} 
          onClose={() => setUserModal({ open: false, data: null })} 
          onSave={handleSaveUser} 
        />
      )}
    </div>
  );
}

// Унифицированный компонент кнопки вкладок
function TabBtn({ label, active, onClick }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-all ${
        active 
          ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' 
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
      }`}
    >
      <span>{label}</span>
    </button>
  );
}