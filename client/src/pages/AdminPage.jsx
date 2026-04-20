import { useState, useEffect } from 'react';
import api, { socket } from '../api'; 
import { Loader2 } from 'lucide-react';

// Компоненты вкладок
import UsersTab from '../components/admin/UsersTab';
import ChannelsTab from '../components/admin/ChannelsTab';
import SettingsTab from '../components/admin/SettingsTab';

// Модалки
import UserModal from '../components/admin/UserModal';
import ChannelModal from '../components/admin/ChannelModal';
import PageStatus from '../components/PageStatus';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users'); 
  const [users, setUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [proxy, setProxy] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния модалок (вынесены сюда)
  const [userModal, setUserModal] = useState({ open: false, data: null });
  const [channelModal, setChannelModal] = useState({ open: false, data: null });

  const [now, setNow] = useState(new Date());

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
      const proxySetting = s.data.find(i => i.key === 'proxy_url');
      if (proxySetting) setProxy(proxySetting.value);
    } catch (err) {
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setNow(new Date()), 60000);
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
      if (userModal.data) await api.patch(`/api/admin/users/${userModal.data.id}`, formData);
      else await api.post('/api/admin/users', formData);
      setUserModal({ open: false, data: null });
      fetchData();
    } catch (err) { alert(err.response?.data?.error || "Ошибка"); }
  };

  // --- ЛОГИКА КАНАЛОВ ---
  const handleSaveChannel = async (formData) => {
    try {
      if (channelModal.data) await api.patch(`/api/admin/channels/${channelModal.data.id}`, formData);
      else await api.post('/api/admin/channels', formData);
      setChannelModal({ open: false, data: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || "Ошибка канала");
    }
  };

  const deleteItem = async (type, id) => {
    if (!confirm("Удалить безвозвратно?")) return;
    try {
      const endpoint = type === 'users' ? `/api/admin/users/${id}` : `/api/admin/channels/${id}`;
      await api.delete(endpoint);
      fetchData();
    } catch (err) { alert("Ошибка удаления"); }
  };

  if (isInitialLoading) return <PageStatus loading={true} error={error} onRetry={fetchData} />;

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4 font-['Inter']">
      
      <header className="hidden lg:block pt-10 mb-8 px-1 animate-in fade-in duration-700">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Админ-центр</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Управление доступом и конфигурация каналов.</p>
      </header>

      {/* TABS */}
      <div className="sticky top-[64px] lg:top-0 z-[60] bg-white/80 dark:bg-[#1f1f1f]/80 backdrop-blur-md -mx-4 px-4 py-4 border-b border-slate-100 dark:border-[#333333]">
        <div className="flex bg-slate-100 dark:bg-[#161616] p-1 rounded-xl gap-1 shadow-inner">
          <TabBtn label="Сотрудники" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          <TabBtn label="Каналы" active={activeTab === 'channels'} onClick={() => setActiveTab('channels')} />
          <TabBtn label="Настройки" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </div>

      <div className={`mt-8 ${loading ? 'opacity-40 pointer-events-none' : ''} transition-opacity`}>
        {activeTab === 'users' && (
          <UsersTab 
            users={users} now={now} 
            onEdit={(u) => setUserModal({ open: true, data: u })} 
            onDelete={deleteItem}
            onAdd={() => setUserModal({ open: true, data: null })}
          />
        )}
        {activeTab === 'channels' && (
          <ChannelsTab 
            channels={channels} 
            onEdit={(c) => setChannelModal({ open: true, data: c })}
            onAdd={() => setChannelModal({ open: true, data: null })}
            onDelete={deleteItem}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab 
            proxy={proxy} setProxy={setProxy} 
            onSaveProxy={async () => {
              await api.post('/api/admin/settings', { key: 'proxy_url', value: proxy });
              alert("Прокси обновлен");
            }}
          />
        )}
      </div>

      {/* МОДАЛКИ (В самом конце для правильного наложения) */}
      {userModal.open && (
        <UserModal 
          user={userModal.data} 
          onClose={() => setUserModal({ open: false, data: null })} 
          onSave={handleSaveUser} 
        />
      )}

      {channelModal.open && (
        <ChannelModal 
          channel={channelModal.data} 
          onClose={() => setChannelModal({ open: false, data: null })} 
          onSave={handleSaveChannel} 
        />
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex-1 h-10 rounded-lg text-[13px] font-bold transition-all ${active ? 'bg-white dark:bg-[#262626] text-blue-600 shadow-sm dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>
      {label}
    </button>
  );
}