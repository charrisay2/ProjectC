import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.ts';
import User from './User.ts';

interface CourseAttributes {
  id: number;
  name: string;
  code: string;
  teacherId: number;
  room: string;
  schedule: string;
  type: 'Standard' | 'Advanced';
  students: (string | number)[];
  major?: string;
  targetCohort?: string;
  credits?: number;
}

interface CourseCreationAttributes extends Optional<CourseAttributes, 'id' | 'students'> {}

class Course extends Model<CourseAttributes, CourseCreationAttributes> implements CourseAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public teacherId!: number;
  public room!: string;
  public schedule!: string;
  public type!: 'Standard' | 'Advanced';
  public students!: (string | number)[];
  public major!: string;
  public targetCohort!: string;
  public credits!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    room: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    schedule: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Standard', 'Advanced'),
      defaultValue: 'Standard',
    },
    major: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    targetCohort: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
    students: {
      type: DataTypes.TEXT,
      defaultValue: '[]',
      get() {
        const rawValue = this.getDataValue('students') as unknown as string;
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(val: (string | number)[]) {
        this.setDataValue('students', JSON.stringify(val) as any);
      },
    },
  },
  {
    sequelize,
    tableName: 'courses',
    hooks: {
      afterCreate: async (course, options) => {
        const Notification = (await import('./Notification.ts')).default;
        await Notification.create({
          message: `Môn học mới được tạo: ${course.name}`,
          type: 'SYSTEM',
          targetRole: 'ADMIN',
          isRead: false
        });
        await Notification.create({
          message: `Bạn được phân công dạy môn: ${course.name}`,
          type: 'CLASS_UPDATE',
          targetRole: 'TEACHER',
          targetUserId: course.teacherId,
          isRead: false
        });
      },
      afterUpdate: async (course, options) => {
        const Notification = (await import('./Notification.ts')).default;
        await Notification.create({
          message: `Môn học được cập nhật: ${course.name}`,
          type: 'SYSTEM',
          targetRole: 'ADMIN',
          isRead: false
        });
        await Notification.create({
          message: `Thông tin môn học thay đổi: ${course.name}`,
          type: 'CLASS_UPDATE',
          targetRole: 'TEACHER',
          targetUserId: course.teacherId,
          isRead: false
        });
        // Student notifications would ideally target enrolled students, but we don't have an enrollment table yet.
        // For now, we'll just broadcast to all students for demo purposes or skip it.
        await Notification.create({
          message: `Lịch học môn ${course.name} có thay đổi.`,
          type: 'CLASS_UPDATE',
          targetRole: 'STUDENT',
          classId: course.id,
          isRead: false
        });
      },
      afterDestroy: async (course, options) => {
        const Notification = (await import('./Notification.ts')).default;
        await Notification.create({
          message: `Môn học đã bị xóa: ${course.name}`,
          type: 'SYSTEM',
          targetRole: 'ADMIN',
          isRead: false
        });
        await Notification.create({
          message: `Môn học của bạn đã bị hủy: ${course.name}`,
          type: 'CLASS_UPDATE',
          targetRole: 'TEACHER',
          targetUserId: course.teacherId,
          isRead: false
        });
      }
    }
  }
);

// Define associations
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
User.hasMany(Course, { foreignKey: 'teacherId', as: 'courses' });

export default Course;
