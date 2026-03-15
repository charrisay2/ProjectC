import { useState, FC, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Calendar, CheckCircle2, AlertCircle, Search, Plus, X } from 'lucide-react';
import { Class } from '../../types';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchCourses, registerCourse, unregisterCourse } from '../../redux/slices/courseSlice';
import { fetchUsers } from '../../redux/slices/userSlice';

interface CourseRegistrationProps {
  studentId: string | number;
}

interface ParsedSchedule {
  day: string;
  start: number; // minutes from midnight
  end: number;   // minutes from midnight
}

interface ClassCardProps {
  c: Class;
  onRegister: (c: Class) => void;
  teacherName?: string;
}

const ClassCard: FC<ClassCardProps & { isAdvanced?: boolean }> = ({ c, onRegister, teacherName, isAdvanced }) => {
  return (
    <div className="card p-5 hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-primary group">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-slate-800 group-hover:text-primary transition-colors">{c.name}</h3>
          <div className="flex gap-2 mt-1">
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded inline-block">{c.code}</span>
            {isAdvanced && (
              <span className="text-xs font-bold bg-purple-100 text-purple-600 px-2 py-1 rounded inline-block">Học vượt</span>
            )}
          </div>
        </div>
        <button 
          onClick={() => onRegister(c)}
          className="p-2 bg-blue-50 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors"
          title="Đăng ký môn này"
        >
          <Plus size={20} />
        </button>
      </div>
      
      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-400" />
          <span className="font-medium text-slate-700">{c.schedule}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-slate-300 rounded text-slate-500">P</span>
          <span>{c.room}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 flex items-center justify-center text-[10px] font-bold border border-slate-300 rounded text-slate-500">GV</span>
          <span>{teacherName || 'Đang cập nhật'}</span>
        </div>
      </div>
    </div>
  );
};

export default function CourseRegistration({ studentId }: CourseRegistrationProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { classes, isLoading } = useSelector((state: RootState) => state.courses);
  const { users } = useSelector((state: RootState) => state.users);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [conflictInfo, setConflictInfo] = useState<{ newClass: Class; existingClass: Class } | null>(null);

  useEffect(() => {
    dispatch(fetchCourses());
    dispatch(fetchUsers());
  }, [dispatch]);

  const currentUser = users.find(u => String(u.id) === String(studentId));

  const registeredClasses = useMemo(() => {
    return classes.filter(c => c.students?.some(id => String(id) === String(studentId)));
  }, [classes, studentId]);

  const availableClasses = useMemo(() => {
    return classes.filter(c => !c.students?.some(id => String(id) === String(studentId)));
  }, [classes, studentId]);

  // Helper to parse schedule string "Thứ Hai (08:00 - 10:30)"
  const parseSchedule = (scheduleStr: string): ParsedSchedule | null => {
    try {
      const match = scheduleStr.match(/^(.+?) \((\d{2}):(\d{2}) - (\d{2}):(\d{2})\)$/);
      if (!match) return null;

      const [, day, startHour, startMin, endHour, endMin] = match;
      
      const start = parseInt(startHour) * 60 + parseInt(startMin);
      const end = parseInt(endHour) * 60 + parseInt(endMin);

      return { day, start, end };
    } catch (e) {
      console.error("Error parsing schedule:", scheduleStr, e);
      return null;
    }
  };

  // Helper to check conflict between two classes
  const checkConflict = (classA: Class, classB: Class): boolean => {
    const scheduleA = parseSchedule(classA.schedule);
    const scheduleB = parseSchedule(classB.schedule);

    if (!scheduleA || !scheduleB) return false;

    // Different days -> No conflict
    if (scheduleA.day !== scheduleB.day) return false;

    // Same day -> Check time overlap
    return (scheduleA.start < scheduleB.end) && (scheduleB.start < scheduleA.end);
  };

  const handleRegister = async (classToRegister: Class) => {
    // 1. Check for conflicts with already registered classes
    const conflictingClass = registeredClasses.find(registered => 
      checkConflict(registered, classToRegister)
    );

    if (conflictingClass) {
      setConflictInfo({ newClass: classToRegister, existingClass: conflictingClass });
      return;
    }

    // 2. No conflict -> Register
    if (confirm(`Bạn có chắc chắn muốn đăng ký môn "${classToRegister.name}"?`)) {
      const resultAction = await dispatch(registerCourse(classToRegister.id));
      if (registerCourse.fulfilled.match(resultAction)) {
        alert('Đăng ký học phần thành công!');
      } else {
        alert('Đăng ký thất bại: ' + resultAction.payload);
      }
    }
  };

  const handleUnregister = async (classToUnregister: Class) => {
    if (confirm(`Bạn có chắc chắn muốn hủy đăng ký môn "${classToUnregister.name}"?`)) {
      const resultAction = await dispatch(unregisterCourse(classToUnregister.id));
      if (unregisterCourse.fulfilled.match(resultAction)) {
        alert('Hủy đăng ký thành công!');
      } else {
        alert('Hủy đăng ký thất bại: ' + resultAction.payload);
      }
    }
  };

  const filteredAvailableClasses = availableClasses.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const standardClasses = filteredAvailableClasses.filter(c => 
    currentUser?.cohort === c.targetCohort
  );
  const advancedClasses = filteredAvailableClasses.filter(c => 
    currentUser?.cohort !== c.targetCohort
  );

  if (isLoading && classes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getTeacherName = (teacherId: string | number) => {
    const teacher = users.find(u => u.id === teacherId);
    return teacher?.name;
  };

  return (
    <div className="space-y-6">
      {/* Conflict Modal */}
      {conflictInfo && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-50 p-6 border-b border-red-100 flex items-start gap-4">
              <div className="bg-red-100 p-3 rounded-full shrink-0">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Trùng lịch học!</h3>
                <p className="text-red-700 text-sm mt-1">
                  Không thể đăng ký học phần này do trùng thời gian với lịch học hiện tại.
                </p>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Môn muốn đăng ký</p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <p className="font-bold text-slate-800">{conflictInfo.newClass.name}</p>
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                    <Calendar size={14} />
                    {conflictInfo.newClass.schedule}
                  </p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold">
                  TRÙNG VỚI
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Môn đã đăng ký</p>
                <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                  <p className="font-bold text-red-900">{conflictInfo.existingClass.name}</p>
                  <p className="text-sm text-red-700 mt-1 flex items-center gap-2">
                    <Calendar size={14} />
                    {conflictInfo.existingClass.schedule}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setConflictInfo(null)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Đã hiểu, đóng lại
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-800">Đăng ký học phần</h1>
        <p className="text-slate-500">Đăng ký các môn học cho học kỳ tới và kiểm tra trùng lịch</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Available Classes (2/3 width) */}
        <div className="xl:col-span-2 space-y-8">
          <div className="card p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm kiếm môn học theo tên hoặc mã..." 
                className="input-field pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Standard Classes Section */}
          <div className="space-y-4">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <BookOpen size={20} className="text-primary" />
              Môn học theo kế hoạch ({standardClasses.length})
            </h2>
            
            {standardClasses.length === 0 ? (
              <div className="card p-8 text-center border-dashed">
                <p className="text-slate-400">Không tìm thấy môn học nào phù hợp</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {standardClasses.map((c) => (
                  <ClassCard 
                    key={c.id} 
                    c={c} 
                    onRegister={handleRegister} 
                    teacherName={getTeacherName(c.teacherId)}
                    isAdvanced={false}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Advanced Classes Section */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <div className="bg-purple-100 p-1 rounded-md">
                <BookOpen size={16} className="text-purple-600" />
              </div>
              <span className="text-purple-900">Môn học đăng ký thêm / Học vượt</span>
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold">{advancedClasses.length}</span>
            </h2>
            
            {advancedClasses.length === 0 ? (
              <div className="card p-8 text-center border-dashed bg-purple-50/50 border-purple-100">
                <p className="text-slate-400">Không tìm thấy môn học vượt nào phù hợp</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advancedClasses.map((c) => (
                  <ClassCard 
                    key={c.id} 
                    c={c} 
                    onRegister={handleRegister} 
                    teacherName={getTeacherName(c.teacherId)}
                    isAdvanced={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Registered Classes (1/3 width) */}
        <div className="space-y-4">
          <h2 className="font-bold text-slate-700 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-emerald-600" />
            Lớp đã đăng ký ({registeredClasses.length})
          </h2>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {registeredClasses.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-slate-400 text-sm">Bạn chưa đăng ký môn học nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {registeredClasses.map((c) => (
                  <div key={c.id} className="p-4 hover:bg-slate-50 transition-colors relative group">
                    <button 
                      onClick={() => handleUnregister(c)}
                      className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="Hủy đăng ký"
                    >
                      <X size={16} />
                    </button>
                    
                    <h4 className="font-bold text-slate-800 text-sm mb-1">{c.name}</h4>
                    <div className="flex gap-2 mb-2">
                      <span className="text-xs text-slate-500">{c.code}</span>
                      {currentUser?.cohort !== c.targetCohort && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">Học vượt</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded w-fit">
                      <Calendar size={12} />
                      <span className="font-medium">{c.schedule}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <p>Hệ thống sẽ tự động kiểm tra trùng lịch khi bạn đăng ký môn mới.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
