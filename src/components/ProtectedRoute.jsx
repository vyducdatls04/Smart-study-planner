import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <p>Đang tải...</p>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
}
