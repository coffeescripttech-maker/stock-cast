import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ruizstore.pos',
  appName: 'Ruiz Store POS',
  webDir: 'dist',
  // The WebView is served from https://localhost, but the POS server runs as
  // plain HTTP on the PC's LAN address. allowMixedContent lets the HTTPS page
  // fetch the HTTP LAN server; cleartext permits the unencrypted request at the
  // platform level (API 28+ blocks it otherwise). The app only talks to the
  // user's own PC on a private LAN, so this is safe for this use case.
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,
  },
};

export default config;
