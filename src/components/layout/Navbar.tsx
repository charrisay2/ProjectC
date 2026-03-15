import { FC, useState, useEffect } from 'react';
import { Menu, Bell, Search, Megaphone } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { io, Socket } from 'socket.io-client';
import api from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { Module } from '../../App';

interface Notification {
  id: number;
  message: string;
  type: string;
  targetRole: string;
  targetUserId?: number;
  isRead: boolean;
  createdAt: string;
}

interface NavbarProps {
  toggleSidebar: () => void;
  setActiveModule: (module: Module) => void;
}

const Navbar: FC<NavbarProps> = ({ toggleSidebar, setActiveModule }) => {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        const readBroadcasts = JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || '[]');
        
        const markedNotifs = res.data.map((n: Notification) => {
          if (n.type === 'BROADCAST' && readBroadcasts.includes(n.id)) {
            return { ...n, isRead: true };
          }
          return n;
        });
        
        setNotifications(markedNotifs);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifs();

    const newSocket = io((import.meta as any).env.VITE_API_URL || 'http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('notification', (newNotif: any) => {
      const isForMe = newNotif.targetRole === 'ALL' || 
                      newNotif.targetRole === user.role || 
                      newNotif.targetUserId === user.id ||
                      user.role === 'ADMIN';
      if (isForMe) {
        setNotifications(prev => [newNotif, ...prev]);
        
        // If it's a class update, refetch courses
        if (newNotif.type === 'CLASS_UPDATE') {
          dispatch(fetchCourses());
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, dispatch]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      const notif = notifications.find(n => n.id === id);
      if (notif?.type === 'BROADCAST') {
        const readBroadcasts = JSON.parse(localStorage.getItem(`read_notifs_${user.id}`) || '[]');
        if (!readBroadcasts.includes(id)) {
          readBroadcasts.push(id);
          localStorage.setItem(`read_notifs_${user.id}`, JSON.stringify(readBroadcasts));
        }
      } else {
        await api.put(`/notifications/${id}/read`);
      }
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg w-64 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-800 text-sm">Thông báo</h3>
                  {user?.role === 'ADMIN' && (
                    <button 
                      onClick={() => {
                        setIsNotifOpen(false);
                        setActiveModule('notifications');
                      }}
                      className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                    >
                      <Megaphone size={12} /> Tạo thông báo
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500">Không có thông báo nào</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`p-3 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${!notif.isRead ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                          <div>
                            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(notif.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-8 w-[1px] bg-slate-200 hidden sm:block"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
