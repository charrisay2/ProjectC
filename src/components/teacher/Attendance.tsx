import { useState, useEffect } from 'react';
import { CheckSquare, Search, Calendar as CalendarIcon, Save, Check, X, Clock } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { fetchUsers } from '../../redux/slices/userSlice';

interface AttendanceProps {
  teacherId: string | number;
}

export default function Attendance({ teacherId }: AttendanceProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);

  const teacherClasses = classes.filter(c => c.teacherId == teacherId);
  const [selectedClass, setSelectedClass] = useState(teacherClasses[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedClass && teacherClasses.length > 0) {
      setSelectedClass(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClass]);

  const currentClass = teacherClasses.find(c => c.id === selectedClass);
  const classStudents = users.filter(u => currentClass?.students?.includes(u.id));

  const handleStatusChange = (studentId: string | number, status: 'Present' | 'Absent' | 'Late') => {
    setAttendance(prev => ({ ...prev, [String(studentId)]: status }));
  };

  const handleSave = () => {
    alert('Đã lưu điểm danh thành công!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Điểm danh sinh viên</h1>
          <p className="text-slate-500">Ghi nhận chuyên cần cho buổi học hôm nay</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex items-center gap-2">
          <Save size={18} />
          Lưu điểm danh
        </button>
      </div>

      <div className="card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Chọn lớp học</label>
          <select 
            className="input-field"
            value={selectedClass}
            onChange={(e) => setSelectedClass(Number(e.target.value))}
          >
            {teacherClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ngày học</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="input-field pl-10"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sinh viên</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classStudents.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                  Chưa có sinh viên nào đăng ký lớp học này.
                </td>
              </tr>
            ) : (
              classStudents.map((student) => {
                const status = attendance[student.id] || 'Present';
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={student.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-200" />
                        <div>
                          <p className="font-bold text-slate-800">{student.name}</p>
                          <p className="text-xs text-slate-400">{student.studentId || student.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            status === 'Present' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Check size={14} /> Có mặt
                        </button>
                        <button 
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            status === 'Absent' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <X size={14} /> Vắng
                        </button>
                        <button 
                          onClick={() => handleStatusChange(student.id, 'Late')}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            status === 'Late' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          <Clock size={14} /> Muộn
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
