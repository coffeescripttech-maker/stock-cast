/**
 * Ruiz Store POS — preload script.
 *
 * Runs in a sandboxed, isolated context. Only a minimal API is exposed to the
 * renderer via contextBridge — the renderer never gets direct Node/Electron
 * access (nodeIntegration is off, contextIsolation is on, sandbox is on).
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,

  /** Resolve basic app/version info (invokes the main process). */
  getAppInfo: () => ipcRenderer.invoke('app:get-info'),

  /** Window controls (useful for a custom title bar later). */
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
