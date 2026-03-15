'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const commonFields = {
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    };

    // 1. users
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      phone: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      joinDate: { type: Sequelize.STRING },
      role: { type: Sequelize.ENUM('ADMIN', 'TEACHER', 'STUDENT'), defaultValue: 'STUDENT' },
      avatar: { type: Sequelize.STRING },
      major: { type: Sequelize.STRING },
      cohort: { type: Sequelize.STRING },
      ...commonFields
    });

    // 2. departments
    await queryInterface.createTable('departments', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      contactEmail: { type: Sequelize.STRING, allowNull: false },
      location: { type: Sequelize.STRING, allowNull: false },
      ...commonFields
    });

    // 3. courses (Đã tích hợp các cột của Lớp học phần để backend của bạn không bị lỗi)
    await queryInterface.createTable('courses', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      teacherId: { type: Sequelize.INTEGER, allowNull: false },
      room: { type: Sequelize.STRING, allowNull: false },
      schedule: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.STRING, defaultValue: 'Standard' },
      major: { type: Sequelize.STRING },
      targetCohort: { type: Sequelize.STRING },
      credits: { type: Sequelize.INTEGER, defaultValue: 3 },
      students: { type: Sequelize.TEXT, defaultValue: '[]' },
      departmentId: { type: Sequelize.INTEGER },
      ...commonFields
    });

    // 4. classes 
    await queryInterface.createTable('classes', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING },
      code: { type: Sequelize.STRING },
      teacherId: { type: Sequelize.INTEGER },
      room: { type: Sequelize.STRING },
      schedule: { type: Sequelize.STRING },
      capacity: { type: Sequelize.INTEGER },
      ...commonFields
    });

    // 5. grades
    await queryInterface.createTable('grades', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      courseId: { type: Sequelize.INTEGER },
      studentId: { type: Sequelize.INTEGER },
      midterm: { type: Sequelize.FLOAT },
      final: { type: Sequelize.FLOAT },
      semester: { type: Sequelize.STRING },
      ...commonFields
    });

    // 6. resources
    await queryInterface.createTable('resources', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      classId: { type: Sequelize.INTEGER },
      title: { type: Sequelize.STRING },
      type: { type: Sequelize.STRING },
      url: { type: Sequelize.STRING },
      uploadDate: { type: Sequelize.STRING },
      ...commonFields
    });

    // 7. announcements
    await queryInterface.createTable('announcements', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      title: { type: Sequelize.STRING },
      date: { type: Sequelize.STRING },
      category: { type: Sequelize.STRING },
      content: { type: Sequelize.TEXT },
      priority: { type: Sequelize.STRING },
      ...commonFields
    });

    // 8. attendance_records
    await queryInterface.createTable('attendance_records', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      classId: { type: Sequelize.INTEGER },
      studentId: { type: Sequelize.INTEGER },
      date: { type: Sequelize.STRING },
      status: { type: Sequelize.STRING },
      ...commonFields
    });

    // 9. invoices
    await queryInterface.createTable('invoices', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      studentId: { type: Sequelize.INTEGER },
      title: { type: Sequelize.STRING },
      amount: { type: Sequelize.FLOAT },
      dueDate: { type: Sequelize.STRING },
      status: { type: Sequelize.STRING },
      ...commonFields
    });

    // 10. notifications
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      targetUserId: { type: Sequelize.INTEGER },
      targetRole: { type: Sequelize.STRING },
      classId: { type: Sequelize.INTEGER },
      type: { type: Sequelize.STRING },
      message: { type: Sequelize.TEXT },
      isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
      ...commonFields
    });
  },

  down: async (queryInterface, Sequelize) => {
    const tables = ['notifications', 'invoices', 'attendance_records', 'announcements', 'resources', 'grades', 'classes', 'courses', 'departments', 'users'];
    for (const table of tables) {
      await queryInterface.dropTable(table);
    }
  }
};