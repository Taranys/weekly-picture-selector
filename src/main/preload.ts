import { contextBridge, ipcRenderer } from 'electron';
import type { ExportConfig, Week, Photo, FaceDetectionSettings, Person } from '../shared/types';

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

  // Face detection operations (Phase 4)
  loadFaceModels: () => ipcRenderer.invoke('load-face-models'),
  areFaceModelsLoaded: () => ipcRenderer.invoke('are-face-models-loaded'),
  detectFacesInPhoto: (photo: Photo, settings: FaceDetectionSettings) => ipcRenderer.invoke('detect-faces-in-photo', photo, settings),
  detectFacesInPhotos: (photos: Photo[], settings: FaceDetectionSettings) => ipcRenderer.invoke('detect-faces-in-photos', photos, settings),
  getFacesByPhotoId: (photoId: number) => ipcRenderer.invoke('get-faces-by-photo-id', photoId),
  getAllFaces: () => ipcRenderer.invoke('get-all-faces'),
  getFaceCount: (photoId: number) => ipcRenderer.invoke('get-face-count', photoId),
  assignFaceToPerson: (faceId: number, personId: number | null) => ipcRenderer.invoke('assign-face-to-person', faceId, personId),

  // Person operations (Phase 4)
  createPerson: (name: string, representativeFaceId: number | null) => ipcRenderer.invoke('create-person', name, representativeFaceId),
  updatePerson: (id: number, name: string, representativeFaceId: number | null) => ipcRenderer.invoke('update-person', id, name, representativeFaceId),
  deletePerson: (id: number) => ipcRenderer.invoke('delete-person', id),
  getAllPeople: () => ipcRenderer.invoke('get-all-people'),
  getPersonById: (id: number) => ipcRenderer.invoke('get-person-by-id', id),
  getPhotosByPersonId: (personId: number) => ipcRenderer.invoke('get-photos-by-person-id', personId),
  getPhotosByPeople: (personIds: number[], mode: 'any' | 'only') => ipcRenderer.invoke('get-photos-by-people', personIds, mode),

  // Face clustering (Phase 4)
  clusterFaces: (distanceThreshold: number) => ipcRenderer.invoke('cluster-faces', distanceThreshold),

  // Event listeners for progress updates
  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('scan-progress', (_, progress) => callback(progress));
  },
  onExportProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('export-progress', (_, progress) => callback(progress));
  },
  onFaceDetectionProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('face-detection-progress', (_, progress) => callback(progress));
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
      // Face detection operations (Phase 4)
      loadFaceModels: () => Promise<{ success: boolean; error?: string }>;
      areFaceModelsLoaded: () => Promise<boolean>;
      detectFacesInPhoto: (photo: Photo, settings: FaceDetectionSettings) => Promise<any[]>;
      detectFacesInPhotos: (photos: Photo[], settings: FaceDetectionSettings) => Promise<{ totalFaces: number; photosProcessed: number; errors: string[] }>;
      getFacesByPhotoId: (photoId: number) => Promise<any[]>;
      getAllFaces: () => Promise<any[]>;
      getFaceCount: (photoId: number) => Promise<number>;
      assignFaceToPerson: (faceId: number, personId: number | null) => Promise<boolean>;
      // Person operations (Phase 4)
      createPerson: (name: string, representativeFaceId: number | null) => Promise<Person | null>;
      updatePerson: (id: number, name: string, representativeFaceId: number | null) => Promise<Person | null>;
      deletePerson: (id: number) => Promise<boolean>;
      getAllPeople: () => Promise<Person[]>;
      getPersonById: (id: number) => Promise<Person | null>;
      getPhotosByPersonId: (personId: number) => Promise<any[]>;
      getPhotosByPeople: (personIds: number[], mode: 'any' | 'only') => Promise<any[]>;
      // Face clustering (Phase 4)
      clusterFaces: (distanceThreshold: number) => Promise<Array<{ faceIds: number[]; averageDescriptor: number[] }>>;
      // Event listeners
      onScanProgress: (callback: (progress: any) => void) => void;
      onExportProgress: (callback: (progress: any) => void) => void;
      onFaceDetectionProgress: (callback: (progress: any) => void) => void;
    };
  }
}
