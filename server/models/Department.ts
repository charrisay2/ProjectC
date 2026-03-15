import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface DepartmentAttributes {
  id: number;
  name: string;
  contactEmail: string;
  location: string;
}

interface DepartmentCreationAttributes extends Optional<
  DepartmentAttributes,
  "id"
> {}

class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  public id!: number;
  public name!: string;
  public contactEmail!: string;
  public location!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Department.init(
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
    contactEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "departments",
  },
);

export default Department;
