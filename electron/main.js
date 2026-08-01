/**
 * Ruiz Store POS — Electron main process.
 *
 * Two operating modes:
 *
 *   Development (`npm run electron:dev`):
 *     VITE_DEV_SERVER_URL is set by the start script. We attach to the Vite
 *     dev server (hot reload) and let Vite proxy /api and /uploads to the
 *     backend that concurrently runs on port 3001.
 *
 *   Production (`npm run electron`, or the packaged .exe):
 *     We start the compiled Express backend in-process (it also serves the
 *     built React frontend from `dist/`) and load the app over a local
 *     http://127.0.0.1 origin. This keeps every relative /api and /uploads
 *     URL in the React app working without any frontend changes.
 *
 * Security: contextIsolation is on, nodeIntegration is off, the renderer is
 * sandboxed, and the preload script only exposes a minimal API via
 * contextBridge. The window is locked to our own origin(s).
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// ---------------------------------------------------------------------------
// Mode detection
// ---------------------------------------------------------------------------
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || null;
const isDev = Boolean(DEV_SERVER_URL);

// Port the embedded Express server uses. Must match server/.env (PORT=3001).
const DEFAULT_PORT = Number(process.env.PORT) || 3001;

let mainWindow = null;
let appPort = DEFAULT_PORT;

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/**
 * electron-builder asar-unpacks `dist/**`, `server/**` and `build/icon.png`,
 * so the real files live under `app.asar.unpacked`. Reading those real paths
 * is what makes dynamic ESM `import()` of the server and `express.static`
 * streaming work reliably. This returns the unpacked path when it exists.
 */
function unpackedPath(p) {
  const unpacked = p.replace('app.asar', 'app.asar.unpacked');
  return fs.existsSync(unpacked) ? unpacked : p;
}

function appRoot() {
  return app.getAppPath();
}

// ---------------------------------------------------------------------------
// Embedded backend
// ---------------------------------------------------------------------------

/**
 * Configure the environment BEFORE the compiled server module is imported so
 * it reads the right paths. Only relevant when not running from the Vite dev
 * server (in dev the backend is started separately by the npm script).
 */
function configureEmbeddedEnvironment() {
  process.env.NODE_ENV = 'production';
  // Tells server/src/app.ts not to self-listen (main.js listens instead).
  process.env.RUIZ_POS_EMBEDDED = '1';
  process.env.PORT = String(DEFAULT_PORT);

  // The install directory is read-only (app.asar), so user-generated content
  // (product images, branding) lives in the writable Electron userData dir.
  const uploadsDir = path.join(app.getPath('userData'), 'uploads');
  process.env.UPLOADS_DIR = uploadsDir;

  // Point the server at the built React frontend.
  process.env.FRONTEND_DIST_DIR = unpackedPath(path.join(appRoot(), 'dist'));

  // Give dotenv (server) the real .env path so DB credentials apply.
  process.env.DOTENV_PATH = unpackedPath(path.join(appRoot(), 'server', '.env'));
}

/**
 * Copy the bundled seed uploads (branding logo/favicon) into the writable
 * userData folder on first run.
 */
function seedUploads() {
  const src = unpackedPath(path.join(appRoot(), 'server', 'uploads'));
  const dest = process.env.UPLOADS_DIR;
  fs.mkdirSync(dest, { recursive: true });
  if (src === dest || !fs.existsSync(src)) return;
  if (fs.existsSync(path.join(dest, 'branding'))) return; // already seeded
  try {
    fs.cpSync(src, dest, { recursive: true });
    console.log(`Seeded uploads from bundle → ${dest}`);
  } catch (err) {
    console.warn('Could not seed bundled uploads:', err.message);
  }
}

/**
 * Start the compiled Express server on 127.0.0.1. On a port conflict it falls
 * back to an OS-assigned port.
 * @returns {Promise<number>} the port the server is listening on
 */
async function startEmbeddedServer() {
  const serverEntry = unpackedPath(path.join(appRoot(), 'server', 'dist', 'app.js'));

  if (!fs.existsSync(serverEntry)) {
    dialog.showErrorBox(
      'Missing server build',
      `The compiled backend was not found.\n\nRun "npm run build:server" first, then relaunch.\n\nExpected: ${serverEntry}`,
    );
    throw new Error(`Missing server build: ${serverEntry}`);
  }

  // Dynamic ESM import() on Windows rejects bare `C:\` paths; it requires a
  // file:// URL (also correct for paths inside app.asar.unpacked).
  const { default: expressApp } = await import(pathToFileURL(serverEntry).href);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const port = attempt === 0 ? DEFAULT_PORT : 0; // 0 → OS-assigned
    const server = expressApp.listen(port, '127.0.0.1');
    try {
      await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
      });
    } catch (err) {
      if (err.code === 'EADDRINUSE' && attempt === 0) continue; // try next port
      server.close();
      throw err;
    }
    return server.address().port;
  }

  throw new Error('Could not bind a port for the embedded server');
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#863bff',
    icon: unpackedPath(path.join(appRoot(), 'build', 'icon.png')),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Never open child windows; http(s) links open in the default browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  // Lock the window to our own origin(s).
  const allowedOrigin = isDev ? DEV_SERVER_URL : `http://127.0.0.1:${appPort}`;
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(allowedOrigin)) event.preventDefault();
  });

  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    startEmbeddedServer()
      .then((port) => {
        appPort = port;
        return mainWindow.loadURL(`http://127.0.0.1:${port}`);
      })
      .catch((err) => {
        console.error('Failed to start embedded server:', err);
        dialog.showErrorBox('Failed to start app server', (err && err.stack) || String(err));
        app.quit();
      });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ---------------------------------------------------------------------------
// IPC (used by the preload bridge)
// ---------------------------------------------------------------------------

function registerIpcHandlers() {
  ipcMain.handle('app:get-info', () => ({
    appName: app.getName(),
    version: app.getVersion(),
    platform: process.platform,
    isPackaged: app.isPackaged,
    versions: {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
    },
  }));

  ipcMain.on('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });

  ipcMain.on('window:maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
  });

  ipcMain.on('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  // Another instance is already running — focus that window and exit.
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    if (!isDev) {
      configureEmbeddedEnvironment();
      seedUploads();
    }
    registerIpcHandlers();
    createWindow();

    app.on('activate', () => {
      // macOS: re-create the window when the dock icon is clicked.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    // Quit on Windows/Linux; stay alive on macOS until the user quits.
    if (process.platform !== 'darwin') app.quit();
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
  });
}
