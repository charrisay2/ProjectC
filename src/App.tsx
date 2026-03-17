/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState, AppDispatch } from "./redux/store"; // Thêm AppDispatch
import { fetchCurrentUser } from "./redux/slices/authSlice"; // Thêm dòng này
import Login from "./components/Login";
import MainLayout from "./layouts/MainLayout";
import Home from "./components/Home";
import UserManagement from "./components/admin/UserManagement";
import ScheduleManagement from "./components/admin/ScheduleManagement";
import NotificationManagement from "./components/admin/NotificationManagement";
import MyClasses from "./components/teacher/MyClasses";
import Attendance from "./components/teacher/Attendance";
import GradeEntry from "./components/teacher/GradeEntry";
import ResourceUpload from "./components/teacher/ResourceUpload";
import Schedule from "./components/Schedule";
import Grades from "./components/Grades";
import Finance from "./components/Finance";
import CourseRegistration from "./components/student/CourseRegistration";
import Profile from "./components/Profile";

export type Module =
  | "home"
  | "users"
  | "schedule-mgmt"
  | "notifications"
  | "classes"
  | "attendance"
  | "grade-entry"
  | "resources"
  | "schedule"
  | "grades"
  | "finance"
  | "course-registration"
  | "profile";

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeModule, setActiveModule] = useState<Module>("home");
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        // Đợi gọi API lấy thông tin xong mới hiển thị web
        await dispatch(fetchCurrentUser());
      }
      setIsInitializing(false);
    };

    initApp();
  }, [dispatch]);

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-main">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">
            Đang tải dữ liệu hệ thống...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {!user ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Login onLogin={() => {}} />
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="h-screen"
        >
          <MainLayout
            activeModule={activeModule}
            setActiveModule={setActiveModule}
          >
            {activeModule === "home" && <Home user={user} />}
            {activeModule === "users" && <UserManagement />}
            {activeModule === "schedule-mgmt" && <ScheduleManagement />}
            {activeModule === "notifications" && <NotificationManagement />}
            {activeModule === "classes" && <MyClasses teacherId={user.id} />}
            {activeModule === "attendance" && (
              <Attendance teacherId={user.id} />
            )}
            {activeModule === "grade-entry" && (
              <GradeEntry teacherId={user.id} />
            )}
            {activeModule === "resources" && (
              <ResourceUpload teacherId={user.id} />
            )}
            {activeModule === "schedule" && <Schedule />}
            {activeModule === "grades" && <Grades />}
            {activeModule === "finance" && <Finance />}
            {activeModule === "course-registration" && (
              <CourseRegistration studentId={user.id} />
            )}
            {activeModule === "profile" && <Profile user={user} />}
          </MainLayout>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
