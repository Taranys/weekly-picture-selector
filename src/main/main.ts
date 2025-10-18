import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    show: false,
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers (to be implemented)
ipcMain.handle('select-directory', async () => {
  // TODO: Implement directory selection
  return null;
});

ipcMain.handle('scan-photos', async (event, directoryPath: string) => {
  // TODO: Implement photo scanning
  return [];
});

ipcMain.handle('get-photos', async () => {
  // TODO: Implement get photos from database
  return [];
});

ipcMain.handle('toggle-favorite', async (event, photoId: number) => {
  // TODO: Implement toggle favorite
  return true;
});

ipcMain.handle('export-favorites', async (event, config: any) => {
  // TODO: Implement export
  return { success: true };
});
