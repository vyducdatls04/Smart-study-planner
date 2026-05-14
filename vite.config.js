import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("sweetalert2")) return "vendor-alerts";
          if (id.includes("axios")) return "vendor-api";
          if (id.includes("react-markdown") || id.includes("recharts")) {
            return "vendor-ui";
          }

          return "vendor";
        },
      },
    },
  },
});
