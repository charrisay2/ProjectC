import { Sequelize } from "sequelize";
import configData from "./config.json";

const env = process.env.NODE_ENV || "development";
const config = (configData as any)[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: false, // Tắt log query cho console đỡ rối
  },
);

export default sequelize;
