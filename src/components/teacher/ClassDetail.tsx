import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  BookOpen,
  Clock,
  MapPin,
  Search,
} from "lucide-react";
import { Class, User } from "../../types";
import api from "../../services/api";

interface ClassDetailProps {
  course: Class;
  onBack: () => void;
}

export default function ClassDetail({ course, onBack }: ClassDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "students">(
    "overview",
  );
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (activeTab === "students") {
      fetchStudents();
    }
  }, [activeTab, course.id]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      // 1. Lấy thông tin lớp học để lấy mảng ID sinh viên
      const resCourse = await api.get(`/courses/${course.id}`);
      const studentIds = resCourse.data.students || [];

      // 2. Lấy danh sách toàn bộ users từ database thật
      const resUsers = await api.get("/users");
      const allUsers = resUsers.data;

      // 3. Ghép ID với thông tin User thật
      const mappedStudents = studentIds.map((id: any) => {
        const user = allUsers.find((u: User) => String(u.id) === String(id));
        return user || { id, name: "Học viên ẩn danh", studentId: id };
      });

      setStudents(mappedStudents);
    } catch (error) {
      console.error("Failed to fetch students", error);
      setStudents([]); // Trả về mảng rỗng nếu lỗi
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{course.name}</h1>
          <p className="text-slate-500 font-mono text-sm">{course.code}</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Tổng quan
        </button>
        <button
          onClick={() => setActiveTab("students")}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "students"
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Danh sách sinh viên
        </button>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Thông tin lớp học
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Mã môn học
                  </p>
                  <p className="font-medium text-slate-800">{course.code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Số tín chỉ
                  </p>
                  <p className="font-medium text-slate-800">{course.credits}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Lịch học
                  </p>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <Clock size={16} className="text-primary" />
                    {course.schedule}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Phòng học
                  </p>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <MapPin size={16} className="text-primary" />
                    {course.room}
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">
                Tiến độ khóa học
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-600">Đã hoàn thành</span>
                  <span className="text-primary">45%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{ width: "45%" }}
                  ></div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Đã dạy 6/15 tuần</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 bg-primary text-white">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100">Sĩ số</p>
                  <p className="text-3xl font-bold">
                    {course.students?.length || 0}
                    <span className="text-lg text-blue-200">
                      /{course.capacity || 40}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              Danh sách sinh viên ({students.length})
            </h3>
            <div className="relative w-full sm:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm sinh viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500">
              Đang tải danh sách từ cơ sở dữ liệu...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-100 rounded-xl">
              Không tìm thấy sinh viên nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Mã định danh
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Họ và tên
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                      Trạng thái
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student.id || index}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 font-mono text-sm text-slate-600">
                        {student.username ||
                          student.studentId ||
                          `SV${1000 + index}`}
                      </td>
                      <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                        <img
                          src={
                            student.avatar ||
                            `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`
                          }
                          alt=""
                          className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300"
                        />
                        {student.name || "Unknown Student"}
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {student.email || "student@example.com"}
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Đang học
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
