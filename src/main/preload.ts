import { contextBridge, ipcRenderer } from 'electron';
import type { ExportConfig } from '../shared/types';

// Expose safe IPC methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  scanPhotos: (directoryPath: string) => ipcRenderer.invoke('scan-photos', directoryPath),
  getPhotos: () => ipcRenderer.invoke('get-photos'),
  toggleFavorite: (photoId: number) => ipcRenderer.invoke('toggle-favorite', photoId),
  exportFavorites: (config: ExportConfig) => ipcRenderer.invoke('export-favorites', config),

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
      scanPhotos: (directoryPath: string) => Promise<any[]>;
      getPhotos: () => Promise<any[]>;
      toggleFavorite: (photoId: number) => Promise<boolean>;
      exportFavorites: (config: ExportConfig) => Promise<any>;
      onScanProgress: (callback: (progress: any) => void) => void;
      onExportProgress: (callback: (progress: any) => void) => void;
    };
  }
}
