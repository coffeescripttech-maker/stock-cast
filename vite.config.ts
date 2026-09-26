import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // serve on 0.0.0.0 so the phone can reach the dev server over the LAN
    proxy: {
      '/api': {
        target: 'https://stock-cast-production.up.railway.app',
        // target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/uploads': {
        target: 'https://stock-cast-production.up.railway.app',
        changeOrigin: true
      }
    }
  }
});
