import { useState, useEffect } from 'react';
import { FileText, Save, Search, Filter, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchCourses } from '../../redux/slices/courseSlice';
import { fetchUsers } from '../../redux/slices/userSlice';

interface GradeEntryProps {
  teacherId: string | number;
}

export default function GradeEntry({ teacherId }: GradeEntryProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);

  const teacherClasses = classes.filter(c => c.teacherId == teacherId);
  const [selectedClass, setSelectedClass] = useState(teacherClasses[0]?.id || '');
  const [selectedSemester, setSelectedSemester] = useState('Học kỳ 1 - 2024');
  const [grades, setGrades] = useState<Record<string, { midterm: number, final: number }>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedClass && teacherClasses.length > 0) {
      setSelectedClass(teacherClasses[0].id);
    }
  }, [teacherClasses, selectedClass]);

  useEffect(() => {
    const fetchGrades = async () => {
      if (!selectedClass) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/grades?courseId=${selectedClass}`);
        if (response.ok) {
          const data = await response.json();
          const gradesMap: Record<string, { midterm: number, final: number }> = {};
          data.forEach((g: any) => {
            gradesMap[g.studentId] = { midterm: g.midterm, final: g.final };
          });
          setGrades(gradesMap);
        }
      } catch (error) {
        console.error('Failed to fetch grades:', error);
      }
    };
    fetchGrades();
  }, [selectedClass]);

  const currentClass = teacherClasses.find(c => c.id === selectedClass);
  const classStudents = users.filter(u => currentClass?.students?.includes(u.id));

  const handleGradeChange = (studentId: string | number, type: 'midterm' | 'final', value: string) => {
    const numValue = parseFloat(value) || 0;
    const strStudentId = String(studentId);
    setGrades(prev => ({
      ...prev,
      [strStudentId]: {
        ...(prev[strStudentId] || { midterm: 0, final: 0 }),
        [type]: numValue
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setIsSaving(true);
    try {
      const gradesArray = Object.entries(grades).map(([studentId, grade]) => ({
        studentId: Number(studentId),
        midterm: grade.midterm,
        final: grade.final
      }));

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          courseId: selectedClass,
          semester: selectedSemester,
          grades: gradesArray
        })
      });

      if (response.ok) {
        alert('Đã lưu bảng điểm thành công!');
      } else {
        alert('Lỗi khi lưu bảng điểm.');
      }
    } catch (error) {
      console.error('Failed to save grades:', error);
      alert('Lỗi khi lưu bảng điểm.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nhập điểm sinh viên</h1>
          <p className="text-slate-500">Quản lý điểm quá trình và điểm thi kết thúc môn</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save size={18} />
          {isSaving ? 'Đang lưu...' : 'Lưu bảng điểm'}
        </button>
      </div>

      <div className="card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 space-y-2">
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
        <div className="flex-1 space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Học kỳ</label>
          <select 
            className="input-field"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option>Học kỳ 1 - 2024</option>
            <option>Học kỳ 2 - 2024</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sinh viên</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Điểm quá trình (40%)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Điểm thi (60%)</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Tổng kết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {classStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  Chưa có sinh viên nào đăng ký lớp học này.
                </td>
              </tr>
            ) : (
              classStudents.map((student) => {
                const studentGrade = grades[student.id] || { midterm: 0, final: 0 };
                const total = (studentGrade.midterm * 0.4 + studentGrade.final * 0.6).toFixed(1);
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
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.1"
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-center font-bold text-slate-700 outline-none focus:border-primary"
                        value={studentGrade.midterm}
                        onChange={(e) => handleGradeChange(student.id, 'midterm', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.1"
                        className="w-20 px-2 py-1 border border-slate-200 rounded text-center font-bold text-slate-700 outline-none focus:border-primary"
                        value={studentGrade.final}
                        onChange={(e) => handleGradeChange(student.id, 'final', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold text-lg ${parseFloat(total) >= 5.0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {total}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl border border-amber-100">
        <AlertCircle size={20} />
        <p className="text-sm font-medium">Lưu ý: Điểm sau khi lưu sẽ không thể tự ý chỉnh sửa. Vui lòng kiểm tra kỹ trước khi xác nhận.</p>
      </div>
    </div>
  );
}
