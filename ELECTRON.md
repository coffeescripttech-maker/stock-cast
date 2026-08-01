# Ruiz Store POS — Electron Desktop App

This document covers the Electron desktop build of the Ruiz Store POS. It runs the
existing React + Vite frontend and Express + MySQL backend as a single installable
Windows application, without changing the web version.

---

## How it works

```
┌────────────────────────────── Electron app ─────────────────────────────┐
│  electron/main.js (main process)                                        │
│    └─ starts the compiled Express backend in-process (127.0.0.1:3001)    │
│       which serves BOTH the REST API (/api, /uploads) AND the built      │
│       React frontend (dist/) — so the app is fully self-contained.       │
│                                                                          │
│  BrowserWindow → loads http://127.0.0.1:3001                             │
│    ├─ contextIsolation: true                                             │
│    ├─ nodeIntegration: false                                             │
│    ├─ sandbox: true                                                      │
│    └─ preload.js exposes a tiny API via contextBridge (window.electronAPI)│
└──────────────────────────────────────────────────────────────────────────┘

Development (npm run electron:dev):
  server (tsx watch :3001) + Vite (:5173, proxies /api → 3001) + Electron (:5173)
```

The frontend talks to the API with **relative** URLs (`/api/*`, `/uploads/*`).
Serving the built app from the same origin as the backend is what keeps every
existing request working with **zero frontend changes** — no CORS, no URL rewrites.

Only **MySQL** remains an external dependency (the web version needs it too).

---

## Folder structure

```
├── electron/
│   ├── main.js                  # Electron main process
│   ├── preload.js               # contextBridge bridge (sandboxed)
│   ├── package.json             # {"type":"commonjs"} scope marker
│   └── scripts/
│       ├── launch.cjs           # cross-platform Electron launcher (guards ELECTRON_RUN_AS_NODE)
│       └── generate-icon.mjs    # regenerates build/icon.png (pure Node)
├── build/
│   └── icon.png                 # 512×512 app icon (electron-builder makes .ico/.icns)
├── src/                         # React app (unchanged)
│   ├── lib/electron.ts          # isElectron + getDesktopAppInfo() helpers
│   └── types/electron.d.ts      # types for window.electronAPI
├── server/
│   ├── src/config.ts            # env-aware uploads paths
│   └── dist/                    # compiled backend (built by npm run build:server)
├── release/                     # electron-builder output (gitignored)
└── package.json                 # main entry + scripts + electron-builder config
```

---

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install root deps (adds electron, electron-builder, concurrently, wait-on, cross-env) |
| `npm --prefix server install` | Install backend deps (adds bcryptjs) |
| `npm run dev` | **Web version** in the browser (unchanged) |
| `npm run electron:dev` | Desktop app in dev — starts backend + Vite + Electron, hot reload enabled |
| `npm run build` | Build the frontend to `dist/` (`tsc && vite build`) |
| `npm run build:server` | Build the backend to `server/dist/` |
| `npm run electron` | Run the **built** app locally (run `build` + `build:server` first) |
| `npm run dist:dir` | Build the app unpacked to `release/win-unpacked/` (fast check) |
| `npm run dist` | Build the **Windows NSIS installer** → `release/Ruiz Store POS Setup 5.0.0.exe` |
| `npm run dist:mac` | Build the macOS DMG (from macOS) |
| `npm run dist:linux` | Build the Linux AppImage + deb (from Linux) |
| `npm run dist:all` | Build for all platforms (from the current OS) |

---

## Prerequisites (production app)

The packaged app needs a local MySQL server (same as the web version):

1. Install and start MySQL (e.g. XAMPP → start **MySQL**).
2. Create the database and tables:
   ```sql
   CREATE DATABASE IF NOT EXISTS ruizpos;
   ```
   then import `server/src/db/schema.sql`.
3. Default credentials are read from the bundled `server/.env`
   (`DB_USER=root`, `DB_PASSWORD=` (empty), `DB_NAME=ruizpos`, port `3306`).
   Edit those values in `server/.env` **before** running `npm run dist` if your
   MySQL setup differs.

---

## Generating the Windows installer

1. Install deps (one time):
   ```powershell
   npm install
   npm --prefix server install
   ```
2. Create/regenerate the icon (one time, optional):
   ```powershell
   node electron/scripts/generate-icon.mjs
   ```
3. Build the installer:
   ```powershell
   npm run dist
   ```
   Output: `release/Ruiz Store POS Setup 5.0.0.exe`

The NSIS installer is an **assisted** (per-user) install: the user chooses the
installation folder, and desktop + Start Menu shortcuts are created. Because the
app bundles its own backend, an installed copy works on a machine that has MySQL
running — no Node.js, no manual server startup.

To test the packaged output without an installer:

```powershell
npm run dist:dir
.\release\win-unpacked\"Ruiz Store POS.exe"
```

> Building NSIS on Windows may need the default Electron code-signing check
> disabled on first run — see Troubleshooting.

---

## Security model

| Setting | Value | Why |
|---|---|---|
| `contextIsolation` | `true` | Renderer and preload are separate worlds |
| `nodeIntegration` | `false` | No Node access in the renderer |
| `sandbox` | `true` | Preload runs sandboxed (only `contextBridge`/`ipcRenderer`) |
| `webSecurity` | `true` | Enforce same-origin policy |
| `devTools` | off when packaged | `!app.isPackaged` |
| `setWindowOpenHandler` | deny all; open http(s) in default browser | No popups |
| `will-navigate` guard | lock to app origin | Can't navigate away |
| Embedded API | binds `127.0.0.1` only | Not exposed on the network |

`preload.js` exposes only `electronAPI` (app info + window controls) via
`contextBridge`. The renderer never gets raw Node/Electron access.

---

## Replacing the icon

Drop a 512×512 PNG at `build/icon.png` (overwrite). electron-builder converts it
to `.ico` (Windows) and `.icns` (macOS) automatically on the next `npm run dist`.
`node electron/scripts/generate-icon.mjs` restores the placeholder icon.

---

## Troubleshooting

- **`Missing server build` dialog** — you ran `npm run electron` without a
  backend build. Run `npm run build:server` first.
- **Login fails / "unable to reach the server"** — MySQL isn't running, or the DB
  credentials in `server/.env` don't match your local MySQL. Start MySQL and
  import `server/src/db/schema.sql`.
- **Port 3001 already in use** — the embedded server falls back to an
  OS-assigned port automatically. If you still hit issues, stop whatever is on
  port 3001 (e.g. a leftover `npm run dev:server`).
- **NSIS build errors on Windows** — run
  `npx electron-builder --win --publish never` and, if signing is reported,
  disable publisher signing in the `win` config (a warning is fine for local
  installers).
- **Installer is larger than expected** — `server/node_modules` (Express, mysql2,
  multer, zod, bcryptjs) is bundled on purpose so the installed app is
  self-contained.

---

## Why `bcryptjs`?

`server/src/utils/password.ts` now uses **bcryptjs** (pure JavaScript) instead of
`bcrypt` (native C++ addon). Native addons are compiled against the system Node.js
ABI and fail to load inside Electron's main process. bcryptjs has an identical
`hash`/`compare` API, so the change is one import line and removes all native
module risk from packaging.

---

## Adding macOS / Linux support

Everything is already configured (`mac`/`linux` targets in the `build` config,
`cross-env` for cross-platform env vars, a single PNG icon). To produce those
builds you must run `npm run dist:mac` / `npm run dist:linux` **on that OS**
(electron-builder cannot cross-compile macOS DMGs from Windows). MySQL or a
compatible MariaDB install is the same external prerequisite.
