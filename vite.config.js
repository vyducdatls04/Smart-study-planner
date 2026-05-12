import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Tăng giới hạn cảnh báo lên 1600kB (mặc định là 500kB)
    chunkSizeWarningLimit: 1600,
    
    rollupOptions: {
      output: {
        // 2. Cấu hình chia nhỏ các file JS (Code Splitting)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Tách riêng các thư viện nặng để trình duyệt tải song song
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('sweetalert2')) {
              return 'vendor-alerts';
            }
            if (id.includes('axios')) {
              return 'vendor-api';
            }
            // Các thư viện khác cho vào file vendor chung
            return 'vendor';
          }
        },
      },
    },
  },
})