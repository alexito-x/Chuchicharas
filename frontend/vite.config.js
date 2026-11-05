import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react-vendor';
          if (/node_modules\/(react-router|react-router-dom|@remix-run)\//.test(id)) return 'router-vendor';
          if (id.includes('/node_modules/gsap/')) return 'animation-vendor';
          if (id.includes('/node_modules/lucide-react/')) return 'icons-vendor';
          if (id.includes('/node_modules/react-toastify/')) return 'feedback-vendor';
          return 'vendor';
        }
      }
    }
  }
});
