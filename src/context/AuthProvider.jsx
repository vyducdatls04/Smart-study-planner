import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import api from "../api/axios";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load khi reload — gọi API lấy thông tin user thật
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Có token → gọi API lấy thông tin user
    api.get("/user/profile")
      .then((res) => {
        setUser({ token, ...res.data });
      })
      .catch(() => {
        // Token hết hạn → xóa
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (data) => {
    localStorage.setItem("token", data.token);
    setUser({ token: data.token, ...data.user });
  };

  // Cập nhật thông tin user sau khi đổi profile
  const updateUser = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};