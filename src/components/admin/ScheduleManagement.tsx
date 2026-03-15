import { useState, FormEvent, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Search, Edit2, Clock, MapPin, User as UserIcon, X, Check } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchCourses, createCourse, updateCourse, deleteCourse } from '../../redux/slices/courseSlice';
import { fetchUsers } from '../../redux/slices/userSlice';
import { Class } from '../../types';
import CreatableSelect from '../common/CreatableSelect';

export default function ScheduleManagement() {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, isLoading } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | string | null>(null);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  // Form state
  const [newClass, setNewClass] = useState<Partial<Class>>({
    name: '',
    code: '',
    teacherId: '',
    room: '',
    schedule: '',
    major: '',
    targetCohort: '',
    credits: 3,
    students: []
  });

  const [selectedDay, setSelectedDay] = useState('Thứ Hai');
  const [selectedSlot, setSelectedSlot] = useState('07:00 - 10:30');

  const timeSlots = [
    '07:00 - 10:30',
    '12:00 - 15:30',
    '16:25 - 20:00'
  ];

  const daysOfWeek = [
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
    'Chủ Nhật'
  ];

  const teachers = users.filter(u => u.role === 'TEACHER');

  const filteredClasses = classes.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string | number) => {
    if (confirm('Bạn có chắc chắn muốn xóa lịch học này?')) {
      await dispatch(deleteCourse(id));
    }
  };

  const handleAddClass = async (e: FormEvent) => {
    e.preventDefault();
    
    const scheduleString = `${selectedDay} (${selectedSlot})`;
    
    if (isEditModalOpen && editingClassId) {
      const resultAction = await dispatch(updateCourse({ id: editingClassId, data: { ...newClass, schedule: scheduleString } }));
      if (updateCourse.fulfilled.match(resultAction)) {
        setIsEditModalOpen(false);
        setEditingClassId(null);
        setNewClass({
          name: '',
          code: '',
          teacherId: '',
          room: '',
          schedule: '',
          major: '',
          targetCohort: '',
          credits: 3,
          students: []
        });
        alert('Cập nhật lịch học thành công!');
      } else {
        alert('Cập nhật lịch học thất bại: ' + resultAction.payload);
      }
    } else {
      const classToAdd: Partial<Class> = {
        name: newClass.name || '',
        code: newClass.code || '',
        teacherId: newClass.teacherId || teachers[0]?.id || '',
        room: newClass.room || '',
        schedule: scheduleString,
        major: newClass.major || '',
        targetCohort: newClass.targetCohort || '',
        credits: newClass.credits || 3,
        students: []
      };

      const resultAction = await dispatch(createCourse(classToAdd));
      if (createCourse.fulfilled.match(resultAction)) {
        setIsAddModalOpen(false);
        setNewClass({
          name: '',
          code: '',
          teacherId: '',
          room: '',
          schedule: '',
          major: '',
          targetCohort: '',
          credits: 3,
          students: []
        });
        alert('Thêm lịch học thành công!');
      } else {
        alert('Thêm lịch học thất bại: ' + resultAction.payload);
      }
    }
  };

  const openEditModal = (c: Class) => {
    setNewClass(c);
    setEditingClassId(c.id);
    
    // Parse schedule string: "Thứ Hai (07:00 - 10:30)"
    const match = c.schedule.match(/(Thứ [^\(]+)\s*\(([\d:]+\s*-\s*[\d:]+)\)/);
    if (match) {
      setSelectedDay(match[1].trim());
      setSelectedSlot(match[2].trim());
    }
    
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý lịch học</h1>
          <p className="text-slate-500">Thiết lập và điều chỉnh thời khóa biểu cho các lớp học</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Thêm lịch học mới
        </button>
      </div>

      {/* Add/Edit Schedule Modal */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{isEditModalOpen ? 'Cập nhật lịch học' : 'Thêm lịch học mới'}</h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                  setEditingClassId(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddClass} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tên môn học</label>
                <CreatableSelect
                  label="Tên môn học"
                  value={newClass.name}
                  onChange={(val) => setNewClass({...newClass, name: val})}
                  defaultOptions={['Lập trình Web', 'Cơ sở dữ liệu', 'Mạng máy tính', 'Trí tuệ nhân tạo', 'Kỹ năng mềm']}
                  storageKey="custom_course_names"
                  placeholder="Chọn hoặc nhập tên môn học"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Mã lớp / Mã môn</label>
                  <CreatableSelect
                    label="Mã lớp"
                    value={newClass.code}
                    onChange={(val) => setNewClass({...newClass, code: val})}
                    defaultOptions={['IT001', 'IT002', 'IT003', 'ENG101', 'BA201']}
                    storageKey="custom_course_codes"
                    placeholder="Chọn hoặc nhập mã lớp"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Phòng học</label>
                  <CreatableSelect
                    label="Phòng học"
                    value={newClass.room}
                    onChange={(val) => setNewClass({...newClass, room: val})}
                    defaultOptions={['P.A201', 'P.A202', 'P.B101', 'Lab 1', 'Lab 2']}
                    storageKey="custom_rooms"
                    placeholder="Chọn hoặc nhập phòng học"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Giảng viên phụ trách</label>
                <select 
                  required
                  className="input-field"
                  value={newClass.teacherId}
                  onChange={(e) => setNewClass({...newClass, teacherId: e.target.value})}
                >
                  <option value="">-- Chọn giảng viên --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.username})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Ngành học</label>
                  <CreatableSelect
                    label="Ngành học"
                    value={newClass.major || ''}
                    onChange={(val) => setNewClass({...newClass, major: val})}
                    defaultOptions={['Marketing', 'Logistics và Quản lý chuỗi cung ứng', 'Digital Marketing & Truyền thông đa phương tiện']}
                    storageKey="custom_majors"
                    placeholder="Chọn hoặc nhập ngành học"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Khóa học mục tiêu</label>
                  <CreatableSelect
                    label="Khóa học mục tiêu"
                    value={newClass.targetCohort || ''}
                    onChange={(val) => setNewClass({...newClass, targetCohort: val})}
                    defaultOptions={['2026']}
                    storageKey="custom_cohorts"
                    placeholder="Chọn hoặc nhập khóa học"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Số tín chỉ</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  max="4"
                  className="input-field"
                  placeholder="3"
                  value={newClass.credits}
                  onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val)) val = 1;
                    if (val < 1) val = 1;
                    if (val > 4) val = 4;
                    setNewClass({...newClass, credits: val});
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Ngày học</label>
                  <select 
                    required
                    className="input-field"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Khung giờ</label>
                  <select 
                    required
                    className="input-field"
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setEditingClassId(null);
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
                  {isEditModalOpen ? 'Cập nhật' : 'Lưu lịch học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm theo tên môn hoặc mã lớp..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-1 lg:col-span-2 py-12 text-center text-slate-500">
            <div className="flex justify-center items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Đang tải dữ liệu...
            </div>
          </div>
        ) : filteredClasses.map((c) => {
          const teacher = users.find(u => u.id === c.teacherId);
          return (
            <div key={c.id} className="card p-6 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-50 text-primary rounded-xl flex items-center justify-center">
                    <CalendarIcon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{c.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{c.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(c)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={16} className="text-primary" />
                    <span>{c.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} className="text-primary" />
                    <span>{c.room}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UserIcon size={16} className="text-primary" />
                    <span>GV: {teacher?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarIcon size={16} className="text-primary" />
                    <span>{c.students?.length || 0} Sinh viên</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoading && filteredClasses.length === 0 && (
        <div className="py-12 text-center card bg-slate-50 border-dashed">
          <p className="text-slate-400 font-medium">Không tìm thấy lịch học nào</p>
        </div>
      )}
    </div>
  );
}
