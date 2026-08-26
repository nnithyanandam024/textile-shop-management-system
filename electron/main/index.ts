import { app, BrowserWindow, shell, Menu } from 'electron';
import path from 'path';
import { setupLogger } from './logger';
import { initDatabase, closeDatabase } from './database';
import { registerIpcHandlers } from './ipc/appHandler';
import { envConfig } from './config/env';

const log = setupLogger();

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  if (!isDev) {
    Menu.setApplicationMenu(null);
  }

  mainWindow = new BrowserWindow({
    title: envConfig.appName || 'Textile Shop Management System',
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: !isDev,
    backgroundColor: '#0f172a', // Tailwind slate-900
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  if (!isDev) {
    mainWindow.setMenuBarVisibility(false);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.maximize();
    log.info('Main Window displayed successfully');
  });

  // Prevent navigation to unapproved external pages
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (isDev && parsedUrl.host === 'localhost:5173') {
      return;
    }
    if (navigationUrl.startsWith('file://')) {
      return;
    }
    event.preventDefault();
    log.warn(`Blocked untrusted in-app navigation to: ${navigationUrl}`);
  });

  // Handle external links opening in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

  if (isDev) {
    log.info(`Loading Dev Server URL: ${devServerUrl}`);
    mainWindow.loadURL(devServerUrl).catch((err) => {
      log.error('Failed to load dev server URL:', err);
    });
    // Open DevTools in dev mode only
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '../../dist/index.html');
    log.info(`Loading Production File: ${indexPath}`);
    mainWindow.loadFile(indexPath).catch((err) => {
      log.error('Failed to load production index.html:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    log.info('Electron app ready');
    try {
      initDatabase();
      registerIpcHandlers();
      createWindow();
    } catch (error) {
      log.error('Fatal initialization error:', error);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  closeDatabase();
  log.info('Application quitting cleanly');
});
