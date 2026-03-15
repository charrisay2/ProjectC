export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

// 1. User
export interface User {
  id: string | number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  role: UserRole;
  avatar?: string;
  // Student specific
  studentId?: string;
  major?: string;
  cohort?: string; // e.g., "2025"
  gpa?: number;
  // Teacher specific
  teacherId?: string;
}

// 2. Class
export interface Class {
  id: string | number;
  name: string;
  code: string;
  teacherId: string | number;
  room: string;
  schedule: string;
  students: (string | number)[]; // Array of student IDs
  type?: "Standard" | "Advanced";
  major?: string;
  targetCohort?: string;
  credits?: number;
  capacity?: number;
}

// 3. AttendanceRecord
export interface AttendanceRecord {
  id: string;
  classId: string | number;
  studentId: string | number;
  date: string;
  status: "Present" | "Absent" | "Late";
}

// 4. Grade
export interface Grade {
  id: string;
  classId: string | number;
  studentId: string | number;
  midterm: number;
  final: number;
  semester: string;
}

// 5. Resource
export interface Resource {
  id: string;
  classId: string | number;
  title: string;
  type: "PDF" | "DOC" | "SLIDE";
  url: string;
  uploadDate: string;
}

// 6. Announcement
export interface Announcement {
  id: string;
  title: string;
  date: string;
  category: "Academic" | "Finance" | "General";
  content: string;
  priority?: "High" | "Medium" | "Low";
}

// 7. Invoice
export interface Invoice {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "Paid" | "Unpaid";
}

// ==========================================
// 3 BẢNG MỚI ĐƯỢC THÊM VÀO
// ==========================================

// 8. Department (Khoa / Viện)
export interface Department {
  id: string;
  name: string;
  headId?: string | number; // ID của Trưởng khoa
  contactEmail: string;
  location: string;
}

// 9. Course (Môn học gốc - khác với Lớp học phần Class)
export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  departmentId: string;
  prerequisites?: string[]; // Mảng các mã môn tiên quyết
}

// 10. Notification (Thông báo cá nhân cho user)
export interface Notification {
  id: string;
  userId: string | number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
