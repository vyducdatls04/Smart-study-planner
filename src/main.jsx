import React from "react";
import ReactDOM from "react-dom/client";
import App from "../src/routes/AppRoutes";
import { AuthProvider } from "./context/AuthProvider";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider> {/* 🔥 BỌC Ở ĐÂY */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);