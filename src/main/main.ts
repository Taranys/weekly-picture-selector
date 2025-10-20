import { app, BrowserWindow, ipcMain, dialog, protocol } from 'electron';
import path from 'path';
import fs from 'fs';
import heicConvert from 'heic-convert';
import {
  initDatabase,
  insertPhoto,
  getAllPhotos,
  toggleFavorite as dbToggleFavorite,
  clearAllPhotos,
  getUniqueSubdirectories,
  getPhotosBySubdirectory,
  getSubdirectoryStats,
  hidePhoto,
  unhidePhoto,
  hidePhotosBySubdirectory,
  unhidePhotosBySubdirectory,
  getHiddenPhotos,
  getHiddenPhotoCount,
  // Face operations
  getFacesByPhotoId,
  getAllFaces,
  updateFacePersonId,
  getFaceCount,
  // Person operations
  insertPerson,
  updatePerson,
  deletePerson,
  getAllPeople,
  getPersonById,
  getPhotosByPersonId,
  getPhotosByPeople,
} from './database';
import { scanDirectory, getWeekNumber } from './scanner';
import { generateThumbnails } from './thumbnail';
import { exportFavorites, validateExportConfig, checkExportConflicts } from './exporter';
import {
  loadModels,
  detectFacesInPhoto,
  detectFacesInPhotos,
  clusterFaces,
  areModelsLoaded,
} from './faceDetection';
import type { Photo, ExportConfig, Week, FaceDetectionSettings } from '../shared/types';

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

// Register custom protocol to serve images (including HEIC conversion)
app.whenReady().then(async () => {
  // Register protocol for serving local images with HEIC support
  protocol.handle('local-image', async (request) => {
    try {
      const url = request.url.replace('local-image://', '');
      const filePath = decodeURIComponent(url);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return new Response('File not found', { status: 404 });
      }

      const ext = path.extname(filePath).toLowerCase();
      const isHeic = ext === '.heic' || ext === '.heif';

      if (isHeic) {
        // Convert HEIC to JPEG on-the-fly using heic-convert
        const inputBuffer = fs.readFileSync(filePath);
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.95, // High quality for full-size viewing
        });

        return new Response(new Uint8Array(outputBuffer), {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      } else {
        // Serve other image formats directly
        const buffer = fs.readFileSync(filePath);
        const mimeTypes: { [key: string]: string } = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.bmp': 'image/bmp',
          '.tiff': 'image/tiff',
          '.tif': 'image/tiff',
        };
        const mimeType = mimeTypes[ext] || 'application/octet-stream';

        return new Response(new Uint8Array(buffer), {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    } catch (error) {
      console.error('Error serving image:', error);
      return new Response('Error loading image', { status: 500 });
    }
  });

  // Initialize database (sql.js initialization is async)
  await initDatabase();

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

// Subdirectory operations
ipcMain.handle('get-unique-subdirectories', async () => {
  try {
    return getUniqueSubdirectories();
  } catch (error) {
    console.error('Error getting unique subdirectories:', error);
    return [];
  }
});

ipcMain.handle('get-photos-by-subdirectory', async (_event, subdirectory: string | null) => {
  try {
    return getPhotosBySubdirectory(subdirectory);
  } catch (error) {
    console.error('Error getting photos by subdirectory:', error);
    return [];
  }
});

ipcMain.handle('get-subdirectory-stats', async () => {
  try {
    return getSubdirectoryStats();
  } catch (error) {
    console.error('Error getting subdirectory stats:', error);
    return [];
  }
});

// Hide/unhide operations
ipcMain.handle('hide-photo', async (_event, photoId: number) => {
  try {
    return hidePhoto(photoId);
  } catch (error) {
    console.error('Error hiding photo:', error);
    return false;
  }
});

ipcMain.handle('unhide-photo', async (_event, photoId: number) => {
  try {
    return unhidePhoto(photoId);
  } catch (error) {
    console.error('Error unhiding photo:', error);
    return false;
  }
});

ipcMain.handle('hide-photos-by-subdirectory', async (_event, subdirectory: string) => {
  try {
    return hidePhotosBySubdirectory(subdirectory);
  } catch (error) {
    console.error('Error hiding photos by subdirectory:', error);
    return 0;
  }
});

ipcMain.handle('unhide-photos-by-subdirectory', async (_event, subdirectory: string) => {
  try {
    return unhidePhotosBySubdirectory(subdirectory);
  } catch (error) {
    console.error('Error unhiding photos by subdirectory:', error);
    return 0;
  }
});

ipcMain.handle('get-hidden-photos', async () => {
  try {
    return getHiddenPhotos();
  } catch (error) {
    console.error('Error getting hidden photos:', error);
    return [];
  }
});

ipcMain.handle('get-hidden-photo-count', async () => {
  try {
    return getHiddenPhotoCount();
  } catch (error) {
    console.error('Error getting hidden photo count:', error);
    return 0;
  }
});

// Face Detection Operations (Phase 4)
ipcMain.handle('load-face-models', async () => {
  try {
    let publicPath: string;

    if (process.env.NODE_ENV === 'development') {
      // In development, models are in the source public/ directory
      // __dirname is dist/main/main/, so we need to go up 3 levels to reach project root
      publicPath = path.join(__dirname, '../../../public');
    } else {
      // In production, models will be bundled with the app
      publicPath = path.join(__dirname, '../../public');
    }

    console.log('[Main] Loading models from:', publicPath);
    await loadModels(publicPath);
    return { success: true };
  } catch (error) {
    console.error('Error loading face models:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle('are-face-models-loaded', async () => {
  return areModelsLoaded();
});

ipcMain.handle('detect-faces-in-photo', async (_event, photo: Photo, settings: FaceDetectionSettings) => {
  try {
    return await detectFacesInPhoto(photo, settings);
  } catch (error) {
    console.error('Error detecting faces in photo:', error);
    throw error;
  }
});

ipcMain.handle('detect-faces-in-photos', async (_event, photos: Photo[], settings: FaceDetectionSettings) => {
  try {
    if (!mainWindow) {
      throw new Error('Main window not available');
    }

    const result = await detectFacesInPhotos(photos, settings, (progress) => {
      mainWindow?.webContents.send('face-detection-progress', progress);
    });

    return result;
  } catch (error) {
    console.error('Error detecting faces in photos:', error);
    throw error;
  }
});

ipcMain.handle('get-faces-by-photo-id', async (_event, photoId: number) => {
  try {
    return getFacesByPhotoId(photoId);
  } catch (error) {
    console.error('Error getting faces by photo ID:', error);
    return [];
  }
});

ipcMain.handle('get-all-faces', async () => {
  try {
    return getAllFaces();
  } catch (error) {
    console.error('Error getting all faces:', error);
    return [];
  }
});

ipcMain.handle('get-face-count', async (_event, photoId: number) => {
  try {
    return getFaceCount(photoId);
  } catch (error) {
    console.error('Error getting face count:', error);
    return 0;
  }
});

ipcMain.handle('assign-face-to-person', async (_event, faceId: number, personId: number | null) => {
  try {
    return updateFacePersonId(faceId, personId);
  } catch (error) {
    console.error('Error assigning face to person:', error);
    return false;
  }
});

// Person Operations (Phase 4)
ipcMain.handle('create-person', async (_event, name: string, representativeFaceId: number | null = null) => {
  try {
    const personId = insertPerson(name, representativeFaceId);
    return getPersonById(personId);
  } catch (error) {
    console.error('Error creating person:', error);
    throw error;
  }
});

ipcMain.handle('update-person', async (_event, id: number, name: string, representativeFaceId: number | null = null) => {
  try {
    const success = updatePerson(id, name, representativeFaceId);
    if (success) {
      return getPersonById(id);
    }
    return null;
  } catch (error) {
    console.error('Error updating person:', error);
    throw error;
  }
});

ipcMain.handle('delete-person', async (_event, id: number) => {
  try {
    return deletePerson(id);
  } catch (error) {
    console.error('Error deleting person:', error);
    return false;
  }
});

ipcMain.handle('get-all-people', async () => {
  try {
    return getAllPeople();
  } catch (error) {
    console.error('Error getting all people:', error);
    return [];
  }
});

ipcMain.handle('get-person-by-id', async (_event, id: number) => {
  try {
    return getPersonById(id);
  } catch (error) {
    console.error('Error getting person by ID:', error);
    return null;
  }
});

ipcMain.handle('get-photos-by-person-id', async (_event, personId: number) => {
  try {
    return getPhotosByPersonId(personId);
  } catch (error) {
    console.error('Error getting photos by person ID:', error);
    return [];
  }
});

ipcMain.handle('get-photos-by-people', async (_event, personIds: number[], mode: 'any' | 'only' = 'any') => {
  try {
    return getPhotosByPeople(personIds, mode);
  } catch (error) {
    console.error('Error getting photos by people:', error);
    return [];
  }
});

// Face Clustering (Phase 4)
ipcMain.handle('cluster-faces', async (_event, distanceThreshold: number = 0.6) => {
  try {
    const allFaces = getAllFaces();
    return clusterFaces(allFaces, distanceThreshold);
  } catch (error) {
    console.error('Error clustering faces:', error);
    return [];
  }
});
