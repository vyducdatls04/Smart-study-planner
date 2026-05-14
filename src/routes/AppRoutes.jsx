import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import MainLayout from "../layout/MainLayout";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";

const Subjects = lazy(() => import("../pages/Subjects"));
const StudyPlans = lazy(() => import("../pages/StudyPlans"));
const Tasks = lazy(() => import("../pages/Tasks"));
const Progress = lazy(() => import("../pages/Progress"));
const AISupport = lazy(() => import("../pages/AIsupports"));
const Settings = lazy(() => import("../pages/Settings"));

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-[#F5F7FB]">
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
        <p className="text-sm text-gray-500">Đang tải...</p>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
