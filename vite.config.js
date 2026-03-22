import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox-gl': ['mapbox-gl'],
          'antd': ['antd'],
          'react': ['react', 'react-dom']
        }
      }
    }
  },
  server: {
    port: 5173,
    open: false,
    host: 'localhost'
  }
});