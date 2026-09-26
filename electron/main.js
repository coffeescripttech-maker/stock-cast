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
const { execFile } = require('child_process');
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

/**
 * Pick the best printer for receipts: the OS default if one is marked, else
 * the first thermal (POS-58 / 58mm / thermal / receipt) printer, else the
 * first available printer. Many POS setups have no printer marked default.
 */
async function resolvePrinterName(wc) {
  try {
    const printers = await wc.getPrintersAsync();
    if (!printers.length) return null;
    const def = printers.find((p) => p.isDefault);
    const thermal = printers
      .filter((p) => /pos-?58|58mm|thermal|receipt/i.test(p.name))
      .sort((a, b) => Number(a.name.includes('(')) - Number(b.name.includes('(')))[0];
    return (def || thermal || printers[0]).name;
  } catch {
    return null;
  }
}

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

  // Silent print: render the current page to the default (or requested)
  // printer WITHOUT the print-preview dialog. This is what makes receipts
  // print automatically in the desktop app.
  ipcMain.handle('print:silent', async (event, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return false;

    // ── PRINT-DEBUG: snapshot + printer info (temporary diagnostics) ──
    const debugLogPath = path.join(app.getPath('desktop'), 'print-debug-log.txt');
    const appendLog = (line) => {
      try {
        fs.appendFileSync(debugLogPath, `${line}\n`);
      } catch {}
      console.log(line);
    };
    try {
      const image = await win.webContents.capturePage();
      const debugPath = path.join(app.getPath('desktop'), `print-debug-${Date.now()}.png`);
      fs.writeFileSync(debugPath, image.toPNG());
      appendLog(`[PRINT-DEBUG] snapshot saved → ${debugPath}`);
    } catch (err) {
      appendLog(`[PRINT-DEBUG] capturePage failed: ${err}`);
    }
    try {
      const printers = await win.webContents.getPrintersAsync();
      const rows = printers.map((p) => ({
        name: p.name,
        isDefault: p.isDefault,
        displayName: p.displayName,
      }));
      appendLog(`[PRINT-DEBUG] request options: ${JSON.stringify(options || {})}`);
      appendLog(`[PRINT-DEBUG] printers: ${JSON.stringify(rows, null, 2)}`);
    } catch (err) {
      appendLog(`[PRINT-DEBUG] getPrintersAsync failed: ${err}`);
    }
    // ── /PRINT-DEBUG ──

    // Resolve the target printer: explicit deviceName wins; otherwise the OS
    // default; otherwise the first thermal (POS-58 / 58mm) printer; else the
    // first available printer. Many POS setups have no printer marked default.
    let deviceName = options && options.deviceName;
    if (!deviceName) {
      deviceName = await resolvePrinterName(win.webContents);
    }
    appendLog(`[PRINT-DEBUG] resolved deviceName = ${deviceName || '(none)'}`);

    const pageSize =
      (options && options.pageSize) || { width: 58000, height: 297000 };
    appendLog(
      `[PRINT-DEBUG] pageSize = ${(pageSize.width / 1000).toFixed(0)}mm x ${(pageSize.height / 1000).toFixed(0)}mm (${JSON.stringify(pageSize)})`,
    );

    return new Promise((resolve) => {
      win.webContents.print(
        {
          silent: true,
          printBackground: true,
          margins: { marginType: 'none' },
          // Default to a 58mm roll page when the renderer didn't specify one.
          pageSize,
          ...(options || {}),
          deviceName,
        },
        (success) => {
          try {
            fs.appendFileSync(
              debugLogPath,
              `[PRINT-DEBUG] print() callback success = ${success}\n`,
            );
          } catch {}
          console.log('[PRINT-DEBUG] print() callback success =', success);
          resolve(Boolean(success));
        },
      );
    });
  });

  // Raw ESC/POS print: send pre-built receipt bytes straight to a thermal
  // printer through the Windows raw spooler (winspool.drv WritePrinter with
  // RAW data type) via a tiny PowerShell helper. No HTML rendering involved —
  // this is the same pure-text path the Bluetooth printers use.
  const RAW_PRINT_PS1 = `param(
  [string]$PrinterName,
  [string]$HexData
)

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }

  [DllImport("winspool.drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);

  [DllImport("winspool.drv", EntryPoint = "ClosePrinter", SetLastError = true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

  [DllImport("winspool.drv", EntryPoint = "EndDocPrinter", SetLastError = true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "StartPagePrinter", SetLastError = true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "EndPagePrinter", SetLastError = true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);

  [DllImport("winspool.drv", EntryPoint = "WritePrinter", SetLastError = true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

  public static bool Send(string printerName, byte[] data) {
    IntPtr hPrinter = IntPtr.Zero;
    if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) return false;
    try {
      DOCINFOA di = new DOCINFOA();
      di.pDocName = "Ruiz Store POS Receipt";
      di.pDataType = "RAW";
      bool ok = StartDocPrinter(hPrinter, 1, di);
      if (!ok) return false;
      try {
        if (!StartPagePrinter(hPrinter)) return false;
        try {
          IntPtr p = Marshal.AllocHGlobal(data.Length);
          try {
            Marshal.Copy(data, 0, p, data.Length);
            int written = 0;
            ok = WritePrinter(hPrinter, p, data.Length, out written);
            return ok && written == data.Length;
          } finally {
            Marshal.FreeHGlobal(p);
          }
        } finally {
          EndPagePrinter(hPrinter);
        }
      } finally {
        EndDocPrinter(hPrinter);
      }
    } finally {
      ClosePrinter(hPrinter);
    }
  }
}
"@

$hex = $HexData.Trim()
$count = $hex.Length / 2
$bytes = New-Object byte[] $count
for ($i = 0; $i -lt $count; $i++) {
  $bytes[$i] = [Convert]::ToByte($hex.Substring($i * 2, 2), 16)
}

if ([RawPrinterHelper]::Send($PrinterName, $bytes)) {
  Write-Output "OK"
} else {
  Write-Output "FAIL"
  exit 1
}
`;

  ipcMain.handle('print:raw', async (event, payload) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || !payload || !payload.hex) return false;

    const printerName = payload.printerName || (await resolvePrinterName(win.webContents));
    if (!printerName) return false;

    const debugLogPath = path.join(app.getPath('desktop'), 'print-debug-log.txt');
    const appendLog = (line) => {
      try {
        fs.appendFileSync(debugLogPath, `${line}\n`);
      } catch {}
      console.log(line);
    };
    appendLog(
      `[PRINT-DEBUG] raw print → printer=${printerName} bytes=${Math.floor(payload.hex.length / 2)}`,
    );

    try {
      const ps1Path = path.join(app.getPath('temp'), 'ruiz-pos-raw-print.ps1');
      fs.writeFileSync(ps1Path, RAW_PRINT_PS1, 'utf8');

      return await new Promise((resolve) => {
        execFile(
          'powershell.exe',
          ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1Path, printerName, payload.hex],
          { timeout: 20000, windowsHide: true, maxBuffer: 1024 * 1024 },
          (err, stdout) => {
            const ok = !err && String(stdout || '').includes('OK');
            appendLog(`[PRINT-DEBUG] raw print result = ${ok ? 'OK' : 'FAIL'} ${err ? err.message : ''}`);
            resolve(ok);
          },
        );
      });
    } catch (err) {
      appendLog(`[PRINT-DEBUG] raw print error: ${err}`);
      return false;
    }
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
