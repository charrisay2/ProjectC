import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import sequelize from "./server/config/database";
import authRoutes from "./server/routes/authRoutes";
import userRoutes from "./server/routes/userRoutes";
import courseRoutes from "./server/routes/courseRoutes";
import notificationRoutes from "./server/routes/notificationRoutes";
import invoiceRoutes from "./server/routes/invoiceRoutes";
import resourceRoutes from "./server/routes/resourceRoutes";
import gradeRoutes from "./server/routes/gradeRoutes";
import { EventEmitter } from "events";

declare global {
  var notificationEmitter: EventEmitter;
}

if (!global.notificationEmitter) {
  global.notificationEmitter = new EventEmitter();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" },
});

app.set("io", io);

global.notificationEmitter.on("new_notification", (notification) => {
  io.emit("notification", notification);
});

const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log("Request:", req.url);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/grades", gradeRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "University Management System API is running on MySQL",
  });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // Chỉ giữ lại force: false để Sequelize không tự ý xóa hay sửa cấu trúc bảng nữa
    await sequelize.sync({ force: false });

    const isProduction = process.env.NODE_ENV === "production";

    if (!isProduction) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

startServer();

export { sequelize };
