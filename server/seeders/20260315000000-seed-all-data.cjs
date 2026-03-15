'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashPassword = await bcrypt.hash('123', 10);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      { id: 1, username: 'admin', password: hashPassword, name: 'Quản trị viên Hệ thống', email: 'admin@university.edu.vn', role: 'ADMIN', createdAt: now, updatedAt: now },
      { id: 2, username: 'teacher1', password: hashPassword, name: 'TS. Nguyễn Văn Bình', email: 'binh.nv@university.edu.vn', role: 'TEACHER', createdAt: now, updatedAt: now },
      { id: 3, username: 'student1', password: hashPassword, name: 'Nguyễn Văn A', email: 'vana.nguyen@university.edu.vn', role: 'STUDENT', createdAt: now, updatedAt: now },
      { id: 4, username: 'student2', password: hashPassword, name: 'Trần Thị B', email: 'thib.tran@university.edu.vn', role: 'STUDENT', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('departments', [
      { id: 1, name: 'Khoa Công nghệ thông tin', contactEmail: 'it.dept@university.edu.vn', location: 'Tòa nhà A', createdAt: now, updatedAt: now },
      { id: 2, name: 'Khoa Kinh tế - Quản trị', contactEmail: 'eco.dept@university.edu.vn', location: 'Tòa nhà B', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('courses', [
      { id: 1, name: 'Phát triển Web nâng cao', code: 'IT402', teacherId: 2, room: 'Lab 402', schedule: 'Thứ Hai (08:00 - 10:30)', type: 'Standard', credits: 3, students: JSON.stringify(['3', '4']), createdAt: now, updatedAt: now },
      { id: 2, name: 'Hệ quản trị Cơ sở dữ liệu', code: 'IT201', teacherId: 2, room: 'Phòng 201', schedule: 'Thứ Tư (13:00 - 15:30)', type: 'Standard', credits: 3, students: JSON.stringify(['3']), createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('classes', [
      { id: 1, name: 'Lập trình Java', code: 'IT301', teacherId: 2, room: 'Lab 301', schedule: 'Thứ Hai (08:00 - 10:30)', capacity: 30, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('grades', [
      { id: 1, courseId: 1, studentId: 3, midterm: 8.5, final: 9.0, semester: 'Học kỳ 1 - 2024', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('resources', [
      { id: 1, classId: 1, title: 'Giáo trình Web nâng cao', type: 'PDF', url: '#', uploadDate: '2024-02-10', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('announcements', [
      { id: 1, title: 'Lịch thi kết thúc học kỳ 1', date: '2024-05-20', category: 'Academic', content: 'Lịch thi chi tiết đã cập nhật.', priority: 'High', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('attendance_records', [
      { id: 1, classId: 1, studentId: 3, date: '2024-02-15', status: 'Present', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('invoices', [
      { id: 1, studentId: 3, title: 'Học phí Học kỳ 1 - 2024', amount: 15000000, dueDate: '2024-09-15', status: 'Paid', createdAt: now, updatedAt: now },
      { id: 2, studentId: 3, title: 'Phí bảo hiểm y tế 2024', amount: 702000, dueDate: '2024-10-01', status: 'Unpaid', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('notifications', [
      { id: 1, targetUserId: 3, targetRole: 'STUDENT', type: 'SYSTEM', message: 'Điểm của bạn đã được cập nhật.', isRead: false, createdAt: now, updatedAt: now }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    const tables = ['notifications', 'invoices', 'attendance_records', 'announcements', 'resources', 'grades', 'classes', 'courses', 'departments', 'users'];
    for (const table of tables) {
      await queryInterface.bulkDelete(table, null, {});
    }
  }
};