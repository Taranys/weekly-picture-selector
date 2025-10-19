import { contextBridge, ipcRenderer } from 'electron';
import type { ExportConfig, Week } from '../shared/types';

// Expose safe IPC methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectExportDirectory: () => ipcRenderer.invoke('select-export-directory'),
  scanPhotos: (directoryPath: string) => ipcRenderer.invoke('scan-photos', directoryPath),
  getPhotos: () => ipcRenderer.invoke('get-photos'),
  toggleFavorite: (photoId: number) => ipcRenderer.invoke('toggle-favorite', photoId),
  validateExportConfig: (config: ExportConfig) => ipcRenderer.invoke('validate-export-config', config),
  checkExportConflicts: (weeks: Week[], config: ExportConfig) => ipcRenderer.invoke('check-export-conflicts', weeks, config),
  exportFavorites: (weeks: Week[], config: ExportConfig) => ipcRenderer.invoke('export-favorites', weeks, config),

  // Subdirectory operations
  getUniqueSubdirectories: () => ipcRenderer.invoke('get-unique-subdirectories'),
  getPhotosBySubdirectory: (subdirectory: string | null) => ipcRenderer.invoke('get-photos-by-subdirectory', subdirectory),
  getSubdirectoryStats: () => ipcRenderer.invoke('get-subdirectory-stats'),

  // Hide/unhide operations
  hidePhoto: (photoId: number) => ipcRenderer.invoke('hide-photo', photoId),
  unhidePhoto: (photoId: number) => ipcRenderer.invoke('unhide-photo', photoId),
  hidePhotosBySubdirectory: (subdirectory: string) => ipcRenderer.invoke('hide-photos-by-subdirectory', subdirectory),
  unhidePhotosBySubdirectory: (subdirectory: string) => ipcRenderer.invoke('unhide-photos-by-subdirectory', subdirectory),
  getHiddenPhotos: () => ipcRenderer.invoke('get-hidden-photos'),
  getHiddenPhotoCount: () => ipcRenderer.invoke('get-hidden-photo-count'),

  // Event listeners for progress updates
  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('scan-progress', (_, progress) => callback(progress));
  },
  onExportProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('export-progress', (_, progress) => callback(progress));
  },
});

// Type declaration for TypeScript
declare global {
  interface Window {
    electronAPI: {
      selectDirectory: () => Promise<string | null>;
      selectExportDirectory: () => Promise<string | null>;
      scanPhotos: (directoryPath: string) => Promise<any[]>;
      getPhotos: () => Promise<any[]>;
      toggleFavorite: (photoId: number) => Promise<boolean>;
      validateExportConfig: (config: ExportConfig) => Promise<string[]>;
      checkExportConflicts: (weeks: Week[], config: ExportConfig) => Promise<{ hasConflicts: boolean; conflicts: string[] }>;
      exportFavorites: (weeks: Week[], config: ExportConfig) => Promise<any>;
      getUniqueSubdirectories: () => Promise<string[]>;
      getPhotosBySubdirectory: (subdirectory: string | null) => Promise<any[]>;
      getSubdirectoryStats: () => Promise<Array<{ subdirectory: string | null; photoCount: number; favoriteCount: number }>>;
      hidePhoto: (photoId: number) => Promise<boolean>;
      unhidePhoto: (photoId: number) => Promise<boolean>;
      hidePhotosBySubdirectory: (subdirectory: string) => Promise<number>;
      unhidePhotosBySubdirectory: (subdirectory: string) => Promise<number>;
      getHiddenPhotos: () => Promise<any[]>;
      getHiddenPhotoCount: () => Promise<number>;
      onScanProgress: (callback: (progress: any) => void) => void;
      onExportProgress: (callback: (progress: any) => void) => void;
    };
  }
}
