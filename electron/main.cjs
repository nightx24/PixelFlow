const { app, BrowserWindow, ipcMain, nativeTheme, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

// Optimize for hardware-accelerated video decoding
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 480,
    minHeight: 500,
    backgroundColor: '#101114',
    title: 'PixelFlow',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Load app: Vite dev server or built production dist/index.html
  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev && !process.env.TEST_DIST) {
    mainWindow.loadURL(devUrl).catch(() => {
      // Fallback to dist if dev server not running
      const indexPath = path.join(__dirname, '../dist/index.html');
      if (fs.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
      }
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Handle video files passed as command line arguments (e.g. file double click)
  handleCommandLineFiles(process.argv);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function handleCommandLineFiles(argv) {
  if (!mainWindow) return;
  const videoExtensions = ['.mp4', '.mkv', '.webm', '.mov', '.avi', '.m4v'];
  for (const arg of argv) {
    if (fs.existsSync(arg)) {
      const ext = path.extname(arg).toLowerCase();
      if (videoExtensions.includes(ext)) {
        mainWindow.webContents.send('open-local-video-file', {
          filePath: arg,
          fileName: path.basename(arg),
        });
        break;
      }
    }
  }
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      handleCommandLineFiles(argv);
    }
  });

  app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for window control and platform queries
ipcMain.handle('app-get-platform', () => process.platform);

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize-toggle', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});
