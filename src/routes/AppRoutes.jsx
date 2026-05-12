import React, { Suspense, lazy } from "react"; // Thêm Suspense và lazy
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

import MainLayout from "../layout/MainLayout";

// Các trang nhẹ có thể giữ lại import trực tiếp
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";

// Các trang nặng hoặc trang AI nên dùng Lazy Load để tối ưu tốc độ
const Subjects = lazy(() => import("../pages/Subjects"));
const StudyPlans = lazy(() => import("../pages/StudyPlans"));
const Tasks = lazy(() => import("../pages/Tasks"));
const Progress = lazy(() => import("../pages/Progress"));
const AISupport = lazy(() => import("../pages/AIsupports"));
const Settings = lazy(() => import("../pages/Settings"));

// LOADING SCREEN
function FullScreenLoader() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#F5F7FB]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Đang tải...</p>
      </div>
    </div>
  );
}

// PROTECTED ROUTE
function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// MAIN ROUTER
export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <BrowserRouter>
      {/* Bọc Routes trong Suspense. 
         Khi đang tải các file lazy (như AI Support), nó sẽ hiện FullScreenLoader 
      */}
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          {/* PUBLIC */}
          <Route
            path="/login"
            element={user ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={user ? <Navigate to="/" replace /> : <Register />}
          />

          {/* PROTECTED */}
          <Route
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Home />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="study-plans" element={<StudyPlans />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="progress" element={<Progress />} />
            <Route path="ai-support" element={<AISupport />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}