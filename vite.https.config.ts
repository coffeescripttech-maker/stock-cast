import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// ─────────────────────────────────────────────────────────────────────────
// HTTPS dev server for testing secure-context features (live camera scanner,
// Web Bluetooth) from a phone over the LAN.
//
//   npm run dev:https   →   https://<PC-LAN-IP>:5173
//
// The browser will warn about the self-signed certificate the first time —
// accept it (Chrome: click through then type "thisisunsafe", or "Advanced" →
// "Proceed"). Because https:// makes the page a secure context, getUserMedia
// (live scanning) and the Bluetooth printer both become available on the
// phone, exactly like they are in the packaged app.
//
// Desktop / Electron are NOT affected — this config is only used for this
// script. The API and /uploads still proxy to the local backend on port 3001.
// ─────────────────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],
  server: {
    host: true, // serve on 0.0.0.0 so the phone can reach it over the LAN
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});