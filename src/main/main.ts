import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { initDatabase, insertPhoto, getAllPhotos, toggleFavorite as dbToggleFavorite, clearAllPhotos } from './database';
import { scanDirectory, getWeekNumber } from './scanner';
import { generateThumbnails } from './thumbnail';
import { exportFavorites, validateExportConfig, checkExportConflicts } from './exporter';
import type { Photo, ExportConfig, Week } from '../shared/types';

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
      webSecurity: false, // Allow loading local files
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
  // Initialize database
  initDatabase();

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

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Photo Directory',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('scan-photos', async (_event, directoryPath: string) => {
  try {
    if (!mainWindow) return [];

    // Clear existing photos from database
    clearAllPhotos();

    // Phase 1: Scan directory and extract EXIF
    mainWindow.webContents.send('scan-progress', {
      phase: 'scanning',
      currentFile: '',
      processed: 0,
      total: 0,
      percentage: 0,
    });

    const scannedPhotos = await scanDirectory(
      directoryPath,
      (currentFile, processed, total) => {
        mainWindow?.webContents.send('scan-progress', {
          phase: 'extracting',
          currentFile,
          processed,
          total,
          percentage: Math.round((processed / total) * 50), // 0-50%
        });
      }
    );

    if (scannedPhotos.length === 0) {
      mainWindow.webContents.send('scan-progress', {
        phase: 'complete',
        currentFile: '',
        processed: 0,
        total: 0,
        percentage: 100,
      });
      return [];
    }

    // Phase 2: Generate thumbnails
    const photoPaths = scannedPhotos.map((p) => p.path);
    const thumbnails = await generateThumbnails(
      photoPaths,
      'medium',
      (currentFile, processed, total) => {
        mainWindow?.webContents.send('scan-progress', {
          phase: 'thumbnails',
          currentFile,
          processed,
          total,
          percentage: 50 + Math.round((processed / total) * 50), // 50-100%
        });
      }
    );

    // Phase 3: Save to database
    const photos: Photo[] = [];
    for (const scannedPhoto of scannedPhotos) {
      const thumbnailPath = thumbnails.get(scannedPhoto.path) || null;

      // Calculate week number
      let weekNumber: number | null = null;
      let year: number | null = null;
      if (scannedPhoto.captureDate) {
        const weekInfo = getWeekNumber(scannedPhoto.captureDate);
        weekNumber = weekInfo.week;
        year = weekInfo.year;
      }

      const photoId = insertPhoto({
        path: scannedPhoto.path,
        filename: scannedPhoto.filename,
        captureDate: scannedPhoto.captureDate,
        weekNumber,
        year,
        exifData: scannedPhoto.exifData,
        thumbnailPath,
        isFavorite: false,
        subdirectory: scannedPhoto.subdirectory,
        isHidden: false,
      });

      photos.push({
        id: photoId,
        path: scannedPhoto.path,
        filename: scannedPhoto.filename,
        captureDate: scannedPhoto.captureDate,
        weekNumber,
        year,
        exifData: scannedPhoto.exifData,
        thumbnailPath,
        isFavorite: false,
        subdirectory: scannedPhoto.subdirectory,
        isHidden: false,
        createdAt: new Date(),
      });
    }

    // Send completion
    mainWindow.webContents.send('scan-progress', {
      phase: 'complete',
      currentFile: '',
      processed: photos.length,
      total: photos.length,
      percentage: 100,
    });

    return photos;
  } catch (error) {
    console.error('Error scanning photos:', error);
    throw error;
  }
});

ipcMain.handle('get-photos', async () => {
  try {
    return getAllPhotos();
  } catch (error) {
    console.error('Error getting photos:', error);
    return [];
  }
});

ipcMain.handle('toggle-favorite', async (_event, photoId: number) => {
  try {
    return dbToggleFavorite(photoId);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
});

ipcMain.handle('select-export-directory', async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Export Destination',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('validate-export-config', async (_event, config: ExportConfig) => {
  return validateExportConfig(config);
});

ipcMain.handle('check-export-conflicts', async (_event, weeks: Week[], config: ExportConfig) => {
  return checkExportConflicts(weeks, config);
});

ipcMain.handle('export-favorites', async (_event, weeks: Week[], config: ExportConfig) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    // Validate configuration
    const errors = validateExportConfig(config);
    if (errors.length > 0) {
      throw new Error(`Invalid export configuration: ${errors.join(', ')}`);
    }

    // Export favorites with progress callback
    const result = await exportFavorites(weeks, config, (progress) => {
      mainWindow?.webContents.send('export-progress', progress);
    });

    return result;
  } catch (error) {
    console.error('Error exporting favorites:', error);
    throw error;
  }
});
