/**
 * Types for the minimal Electron bridge exposed by electron/preload.js.
 *
 * The bridge is optional: when the app runs as a plain web app (npm run dev in
 * the browser) `window.electronAPI` is undefined. Always access it optionally.
 */
export {};

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      getAppInfo: () => Promise<{
        appName: string;
        version: string;
        platform: string;
        isPackaged: boolean;
        versions: { electron: string; chrome: string; node: string };
      }>;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}
