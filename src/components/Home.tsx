import { Calendar, GraduationCap, Wallet, Bell, ArrowRight, Clock, MapPin, Users, BookOpen } from 'lucide-react';
import { User } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { useEffect, useMemo, useState } from 'react';
import { fetchCourses } from '../redux/slices/courseSlice';
import { fetchUsers } from '../redux/slices/userSlice';
import { fetchInvoices } from '../redux/slices/invoiceSlice';
import api from '../services/api';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: number;
  message: string;
  type: string;
  targetRole: string;
  targetUserId?: string | number;
  isRead: boolean;
  createdAt: string;
}

interface HomeProps {
  user: User;
}

export default function Home({ user }: HomeProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);
  const { invoices } = useSelector((state: RootState) => state.invoices);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
    if (user.role === 'STUDENT') {
      dispatch(fetchInvoices());
    }
    
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    };
    fetchNotifs();

    const newSocket = io((import.meta as any).env.VITE_API_URL || 'http://localhost:3000');
    setSocket(newSocket);

    // Listen for real-time notifications
    const handleNewNotification = (newNotification: Notification) => {
      const isForMe = 
        newNotification.targetRole === 'ALL' || 
        newNotification.targetRole === user?.role ||
        (newNotification.targetUserId && newNotification.targetUserId === user?.id);

      if (isForMe) {
        setNotifications(prev => [newNotification, ...prev]);
      }
    };

    newSocket.on('notification', handleNewNotification);

    return () => {
      newSocket.off('notification', handleNewNotification);
      newSocket.disconnect();
    };
  }, [dispatch, user]);

  const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const todayDayName = new Date().toLocaleDateString('vi-VN', { weekday: 'long' })
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const renderAdminDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{users.filter(u => u.role === 'STUDENT').length}</p>
            <p className="text-xs text-slate-500 font-medium">Tổng số sinh viên</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{users.filter(u => u.role === 'TEACHER').length}</p>
            <p className="text-xs text-slate-500 font-medium">Tổng số giảng viên</p>
          </div>
        </div>
        <div className="card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{classes.length}</p>
            <p className="text-xs text-slate-500 font-medium">Lớp học đang hoạt động</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Hoạt động gần đây</h2>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <p className="text-sm text-slate-600">Người dùng <span className="font-bold">SV202400{i}</span> vừa đăng nhập hệ thống.</p>
                <span className="text-[10px] text-slate-400 ml-auto">5 phút trước</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Thông báo hệ thống</h2>
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500">Không có thông báo nào</div>
            ) : (
              notifications.slice(0, 5).map(ann => (
                <div key={ann.id} className="p-3 border-l-4 border-primary bg-slate-50 rounded-r-lg">
                  <p className="text-sm font-bold text-slate-800">{ann.message}</p>
                  <p className="text-xs text-slate-500 mt-1">{new Date(ann.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );

  const teacherTodaySchedule = useMemo(() => {
    return classes.filter(c => {
      const isMyClass = c.teacherId === user.id;
      const isToday = c.schedule.includes(todayDayName);
      return isMyClass && isToday;
    }).sort((a, b) => {
      const timeA = a.schedule.match(/\(([\d:]+)/)?.[1] || '';
      const timeB = b.schedule.match(/\(([\d:]+)/)?.[1] || '';
      return timeA.localeCompare(timeB);
    });
  }, [classes, user.id, todayDayName]);

  const renderTeacherDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Lớp học học kỳ này</p>
          <p className="text-3xl font-bold text-slate-800">{classes.filter(c => c.teacherId === user.id).length}</p>
        </div>
        <div className="card p-6">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Tổng số sinh viên</p>
          <p className="text-3xl font-bold text-slate-800">
            {classes.filter(c => String(c.teacherId) === String(user.id)).reduce((acc, curr) => acc + (curr.students?.length || 0), 0)}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-xs text-slate-400 font-bold uppercase mb-1">Giờ giảng dạy/tuần</p>
          <p className="text-3xl font-bold text-slate-800">12</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar size={20} className="text-primary" />
          Lịch dạy hôm nay ({todayDayName})
        </h2>
        {teacherTodaySchedule.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherTodaySchedule.map(c => (
              <div key={c.id} className="card p-5 hover:border-primary/30 transition-all group cursor-pointer border-l-4 border-l-primary">
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-blue-50 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">{c.code}</span>
                  <Clock size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{c.name}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{c.schedule.split('(')[1].replace(')', '')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{c.room}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center bg-slate-50 border-dashed">
            <p className="text-slate-500">Hôm nay bạn không có lịch dạy nào.</p>
          </div>
        )}
      </section>
    </div>
  );

  const studentTodaySchedule = useMemo(() => {
    return classes.filter(c => {
      const isRegistered = c.students?.some(id => String(id) === String(user.id));
      const isToday = c.schedule.includes(todayDayName);
      return isRegistered && isToday;
    }).sort((a, b) => {
      const timeA = a.schedule.match(/\(([\d:]+)/)?.[1] || '';
      const timeB = b.schedule.match(/\(([\d:]+)/)?.[1] || '';
      return timeA.localeCompare(timeB);
    });
  }, [classes, user.id, todayDayName]);

  const renderStudentDashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-primary" />
                Lịch học hôm nay ({todayDayName})
              </h2>
              <button className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                Xem tất cả <ArrowRight size={14} />
              </button>
            </div>
            {studentTodaySchedule.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentTodaySchedule.map(c => (
                  <div key={c.id} className="card p-5 hover:border-primary/30 transition-all group border-l-4 border-l-primary">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-2">
                        <span className="bg-blue-50 text-primary text-[10px] font-bold px-2 py-1 rounded uppercase">{c.code}</span>
                        {user.cohort !== c.targetCohort && (
                          <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-1 rounded uppercase">Học vượt</span>
                        )}
                      </div>
                      <Clock size={16} className="text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{c.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{c.schedule.split('(')[1].replace(')', '')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{c.room}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card p-8 text-center bg-slate-50 border-dashed">
                <p className="text-slate-500">Hôm nay bạn không có lịch học nào.</p>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <GraduationCap size={24} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{user.gpa || 0}</p>
              <p className="text-xs text-slate-500 font-medium">GPA Hiện tại</p>
            </div>
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mb-3">
                <Calendar size={24} />
              </div>
              <p className="text-2xl font-bold text-slate-800">95%</p>
              <p className="text-xs text-slate-500 font-medium">Chuyên cần</p>
            </div>
            <div className="card p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3">
                <Wallet size={24} />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + i.amount, 0)
                )}
              </p>
              <p className="text-xs text-slate-500 font-medium">Học phí nợ</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bell size={20} className="text-primary" />
              Thông báo
            </h2>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">Không có thông báo nào</div>
              ) : (
                notifications.slice(0, 5).map(ann => (
                  <div key={ann.id} className="card p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-blue-100 text-blue-700">
                        {ann.type === 'BROADCAST' ? 'Hệ thống' : ann.type === 'CLASS_UPDATE' ? 'Lớp học' : 'Thông báo'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(ann.createdAt).toLocaleString('vi-VN')}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1 line-clamp-2">{ann.message}</h3>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Chào mừng trở lại, {user.name}!</h1>
          <p className="text-slate-500 font-medium">{today}</p>
        </div>
      </div>

      {user.role === 'ADMIN' && renderAdminDashboard()}
      {user.role === 'TEACHER' && renderTeacherDashboard()}
      {user.role === 'STUDENT' && renderStudentDashboard()}
    </div>
  );
}
