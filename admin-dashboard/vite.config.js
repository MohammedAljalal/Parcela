import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      // Forward /api/* to the backend during development so we never have
      // CORS issues and don't need to change VITE_API_URL between envs.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // Split large vendor bundles so the browser can cache them independently.
    // Vite 6 uses Rolldown which requires manualChunks as a function, not an object.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/recharts|d3-/.test(id)) return 'vendor-charts';
            if (/jspdf|jspdf-autotable|xlsx/.test(id)) return 'vendor-export';
            if (/sweetalert2/.test(id)) return 'vendor-swal';
            if (/framer-motion/.test(id)) return 'vendor-motion';
            if (/react-icons/.test(id)) return 'vendor-icons';
            if (/@tanstack/.test(id)) return 'vendor-query';
            if (/react-hook-form|@hookform|zod/.test(id)) return 'vendor-forms';
            if (/react-router|react-dom|react/.test(id)) return 'vendor-react';
            return 'vendor-misc';
          }
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
