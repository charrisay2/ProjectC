import { useState, useEffect, FormEvent } from 'react';
import { Search, UserPlus, Edit2, Filter, X, Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../redux/slices/userSlice';
import { User, UserRole } from '../../types';
import CreatableSelect from '../common/CreatableSelect';

export default function UserManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, isLoading, error } = useSelector((state: RootState) => state.users);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | string | null>(null);
  
  // Form state
  const [newUser, setNewUser] = useState<Partial<User> & { password?: string }>({
    role: 'STUDENT',
    name: '',
    username: '',
    email: '',
    password: '',
    major: '',
    cohort: '',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
  });

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDelete = async (id: string | number) => {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      await dispatch(deleteUser(Number(id)));
    }
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newUser.username || !newUser.name || !newUser.email) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (isEditModalOpen && editingUserId) {
      const resultAction = await dispatch(updateUser({ id: Number(editingUserId), data: newUser }));
      if (updateUser.fulfilled.match(resultAction)) {
        setIsEditModalOpen(false);
        setEditingUserId(null);
        setNewUser({
          role: 'STUDENT',
          name: '',
          username: '',
          email: '',
          password: '',
          major: '',
          cohort: '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
        });
        alert('Cập nhật người dùng thành công!');
      } else {
        alert('Cập nhật người dùng thất bại: ' + resultAction.payload);
      }
    } else {
      if (!newUser.password) {
        alert('Vui lòng nhập mật khẩu');
        return;
      }
      const resultAction = await dispatch(createUser(newUser));
      
      if (createUser.fulfilled.match(resultAction)) {
        setIsAddModalOpen(false);
        setNewUser({
          role: 'STUDENT',
          name: '',
          username: '',
          email: '',
          password: '',
          major: '',
          cohort: '',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
        });
        alert('Thêm người dùng thành công!');
      } else {
        alert('Thêm người dùng thất bại: ' + resultAction.payload);
      }
    }
  };

  const openEditModal = (user: User) => {
    setNewUser({
      ...user,
      password: '' // Don't show existing password
    });
    setEditingUserId(user.id);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý người dùng</h1>
          <p className="text-slate-500">Quản lý tài khoản giảng viên và sinh viên trong hệ thống</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          Thêm người dùng mới
        </button>
      </div>

      {/* Add/Edit User Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">{isEditModalOpen ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}</h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingUserId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Vai trò</label>
                  <select 
                    className="input-field"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                  >
                    <option value="STUDENT">Sinh viên</option>
                    <option value="TEACHER">Giảng viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Họ và tên</label>
                  <input 
                    required
                    type="text" 
                    className="input-field"
                    placeholder="Nhập họ tên"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tên đăng nhập</label>
                  <input 
                    required
                    type="text" 
                    className="input-field"
                    placeholder="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Mật khẩu {isEditModalOpen && '(Để trống nếu không đổi)'}</label>
                  <input 
                    required={!isEditModalOpen}
                    type="password" 
                    className="input-field"
                    placeholder="******"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input 
                    required
                    type="email" 
                    className="input-field"
                    placeholder="email@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Số điện thoại</label>
                  <input 
                    type="tel" 
                    className="input-field"
                    placeholder="0912345678"
                    value={newUser.phone || ''}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Địa chỉ</label>
                  <input 
                    type="text" 
                    className="input-field"
                    placeholder="Nhập địa chỉ"
                    value={newUser.address || ''}
                    onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Ngày tham gia</label>
                  <input 
                    type="date" 
                    className="input-field"
                    value={newUser.joinDate || ''}
                    onChange={(e) => setNewUser({...newUser, joinDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Ngành học</label>
                  <CreatableSelect
                    label="Ngành học"
                    value={newUser.major || ''}
                    onChange={(val) => setNewUser({...newUser, major: val})}
                    defaultOptions={['Marketing', 'Logistics và Quản lý chuỗi cung ứng', 'Digital Marketing & Truyền thông đa phương tiện']}
                    storageKey="custom_majors"
                    placeholder="Chọn hoặc nhập ngành học"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Khóa học</label>
                  <CreatableSelect
                    label="Khóa học"
                    value={newUser.cohort || ''}
                    onChange={(val) => setNewUser({...newUser, cohort: val})}
                    defaultOptions={['2026']}
                    storageKey="custom_cohorts"
                    placeholder="Chọn hoặc nhập khóa học"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingUserId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Check size={18} />
                  )}
                  {isEditModalOpen ? 'Cập nhật' : 'Lưu người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên hoặc mã..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select 
            className="input-field py-2"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="TEACHER">Giảng viên</option>
            <option value="STUDENT">Sinh viên</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mã định danh</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={u.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-600">
                    {u.username}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{u.email}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-400 font-medium">Không tìm thấy người dùng nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
