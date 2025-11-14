import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { ChildProcess, spawn } from 'node:child_process'
import { Menu } from 'electron';
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

// Mode switching variables
let isOnlineMode = false;
const ONLINE_URL = 'https://www.gineraaron.com/anroll_web';

let win: BrowserWindow | null
let portWin: BrowserWindow | null
let modeWin: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1080,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      enableBlinkFeatures: 'FileSystemAccessAPI',
      additionalArguments: ['--max-old-space-size=8192'] // heap size 8GB
    },
  })
  // if dev mode open dev tools
  //if (process.env.NODE_ENV === 'development') {
  //  win.webContents.openDevTools({ mode: 'detach' })
  //}
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy': ['same-origin'],
        'Cross-Origin-Embedder-Policy': ['require-corp'],
      }
    });
  });
  
  // Load URL based on mode
  if (isOnlineMode) {
    win.loadURL(ONLINE_URL);
  } else if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

const isDev = !app.isPackaged;
let serverProcess: ChildProcess;

/*
serverProcess = spawn("cmd.exe", ["/k", serverPath], {
    cwd: serverFolder,
    detached: true,
    windowsHide: false,
    shell: true
  });
*/

// popup window code AI generated
app.whenReady().then(() => {
  const serverFolder = isDev
  ? path.join(__dirname, '..', 'resources', 'bin')
  : path.join(process.resourcesPath, 'bin');
  
  const serverFileName = process.platform === 'win32' ? 'server.exe' : 'server';
  const serverPath = path.join(serverFolder, serverFileName);

  serverProcess = spawn(serverPath, [], {
    cwd: serverFolder,
    detached: false,
    windowsHide: false,
    shell: false
  });

  const logFile = fs.createWriteStream(path.join(app.getPath('userData'), 'server.log'), { flags: 'w' });
  serverProcess?.stdout?.pipe(logFile);
  serverProcess?.stderr?.pipe(logFile);

  createWindow();
  Menu.setApplicationMenu(null);

  // Register shortcut Ctrl+T
  globalShortcut.register('Control+T', () => {
    if (win) {
      win.webContents.openDevTools({ mode: 'detach' })
    }
  });

  // Register shortcut Ctrl+O for mode switching
  globalShortcut.register('Control+O', () => {
    if (modeWin) return;
    modeWin = new BrowserWindow({
      width: 300,
      height: 200,
      resizable: false,
      minimizable: false,
      maximizable: false,
      parent: win ?? undefined,
      modal: true,
      show: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    modeWin.setMenuBarVisibility(false);
    modeWin.loadURL('data:text/html,' + encodeURIComponent(`
      <body style='font-family:sans-serif;padding:20px;'>
        <h3>Select Mode</h3>
        <label><input type='radio' name='mode' value='local' ${!isOnlineMode ? 'checked' : ''}> Local</label><br><br>
        <label><input type='radio' name='mode' value='online' ${isOnlineMode ? 'checked' : ''}> Online</label><br><br>
        <button id='apply'>Apply</button>
        <script>
          const { ipcRenderer } = require('electron');
          document.getElementById('apply').onclick = () => {
            const mode = document.querySelector('input[name="mode"]:checked').value;
            ipcRenderer.send('switch-mode', mode);
            window.close();
          };
        </script>
      </body>
    `));
    modeWin.on('closed', () => { modeWin = null; });
  });

  // Registriere globalen Shortcut Ctrl+R
  globalShortcut.register('Control+R', () => {
    if (portWin) return;
    portWin = new BrowserWindow({
      width: 200,
      height: 180,
      resizable: false,
      minimizable: false,
      maximizable: false,
      parent: win ?? undefined,
      modal: true,
      show: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    portWin.setMenuBarVisibility(false);
    portWin.loadURL('data:text/html,' + encodeURIComponent(`
      <body style='font-family:sans-serif;padding:20px;'>
        <label>Port: <input id='port' type='number' value='8080' style='width:80px;'></label><br><br>
        <button id='start'>Start Server</button>
        <script>
          const { ipcRenderer } = require('electron');
          document.getElementById('start').onclick = () => {
            const port = document.getElementById('port').value;
            ipcRenderer.send('start-server-port', port);
            window.close();
          };
        </script>
      </body>
    `));
    portWin.on('closed', () => { portWin = null; });
  });

  // IPC Listener für Server-Start mit Port
  ipcMain.on('start-server-port', (_, port) => {
    if (serverProcess) {
      serverProcess.kill();
    }
    const serverFolder = isDev
      ? path.join(__dirname, '..', 'resources', 'bin')
      : path.join(process.resourcesPath, 'bin');
    const serverFileName = process.platform === 'win32' ? 'server.exe' : 'server';
    const serverPath = path.join(serverFolder, serverFileName);
    serverProcess = spawn(serverPath, ['--port', port], {
      cwd: serverFolder,
      detached: false,
      windowsHide: false,
      shell: false
    });
    const logFile = fs.createWriteStream(path.join(app.getPath('userData'), 'server.log'), { flags: 'w' });
    serverProcess?.stdout?.pipe(logFile);
    serverProcess?.stderr?.pipe(logFile);
  });

  // IPC Listener für Mode-Switching
  ipcMain.on('switch-mode', (_, mode) => {
    isOnlineMode = mode === 'online';
    
    // Reload the window with new URL
    if (win) {
      if (isOnlineMode) {
        win.loadURL(ONLINE_URL);
      } else if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
      } else {
        win.loadFile(path.join(RENDERER_DIST, 'index.html'));
      }
    }
  });
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (portWin) {
    portWin.close();
  }
  if (modeWin) {
    modeWin.close();
  }
});
