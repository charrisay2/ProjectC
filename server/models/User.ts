import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database.ts';
import bcrypt from 'bcryptjs';

interface UserAttributes {
  id: number;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  joinDate?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  avatar?: string;
  major?: string;
  cohort?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public name!: string;
  public email!: string;
  public phone!: string;
  public address!: string;
  public joinDate!: string;
  public role!: 'ADMIN' | 'TEACHER' | 'STUDENT';
  public avatar!: string;
  public major!: string;
  public cohort!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method to check password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    joinDate: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'TEACHER', 'STUDENT'),
      allowNull: false,
      defaultValue: 'STUDENT',
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    major: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cohort: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
