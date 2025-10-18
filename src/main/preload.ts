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
      onScanProgress: (callback: (progress: any) => void) => void;
      onExportProgress: (callback: (progress: any) => void) => void;
    };
  }
}
