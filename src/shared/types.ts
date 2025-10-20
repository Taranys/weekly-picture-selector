/**
 * Shared TypeScript types for Weekly Picture Selector
 */

export interface Photo {
  id: number;
  path: string;
  filename: string;
  captureDate: Date | null;
  weekNumber: number | null;
  year: number | null;
  exifData: ExifData | null;
  thumbnailPath: string | null;
  isFavorite: boolean;
  subdirectory: string | null;
  isHidden: boolean;
  createdAt: Date;
}

export interface ExifData {
  camera?: string;
  lens?: string;
  focalLength?: number;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  width?: number;
  height?: number;
  orientation?: number;
}

export interface Week {
  weekNumber: number;
  year: number;
  startDate: Date;
  endDate: Date;
  photos: Photo[];
  favoriteCount: number;
}

export interface ExportConfig {
  destinationPath: string;
  namingPattern: 'S01' | 'Week-01' | 'custom';
  customPrefix?: string;
  copyOrMove: 'copy' | 'move';
  renamePhotos: boolean;
  photoNamingPattern?: 'original' | 'sequential' | 'date';
  selectedWeeksOnly: boolean;
  dryRun: boolean;
}

export interface ExportResult {
  success: boolean;
  totalFiles: number;
  totalSize: number;
  skippedFiles: string[];
  errors: string[];
  exportPath: string;
  timestamp: Date;
  folders: ExportFolder[];
}

export interface ExportFolder {
  folderName: string;
  weekNumber: number;
  year: number;
  photoCount: number;
  files: string[];
}

export interface ExportProgress {
  phase: 'preparing' | 'copying' | 'complete' | 'error';
  currentFile: string;
  processed: number;
  total: number;
  percentage: number;
  currentFolder?: string;
}

export interface ScanProgress {
  phase: 'scanning' | 'extracting' | 'thumbnails' | 'complete';
  currentFile: string;
  processed: number;
  total: number;
  percentage: number;
}

export interface Face {
  id: number;
  photoId: number;
  embedding: number[];
  boundingBox: BoundingBox;
  personId: number | null;
  confidence: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Person {
  id: number;
  name: string;
  representativeFaceId: number | null;
  photoCount: number;
}

export interface FaceDetectionProgress {
  phase: 'loading_models' | 'detecting' | 'clustering' | 'complete' | 'error';
  currentFile: string;
  processed: number;
  total: number;
  percentage: number;
  error?: string;
}

export interface FaceCluster {
  id: number;
  faces: Face[];
  sampleFaceId: number;
  averageEmbedding: number[];
  personId: number | null;
}

export interface FaceDetectionSettings {
  enabled: boolean;
  sensitivity: number; // 0.0 to 1.0
  minFaceSize: number; // minimum face size in pixels
  quality: 'fast' | 'balanced' | 'accurate';
  backgroundProcessing: boolean;
}

export interface FaceFilterOptions {
  personIds: number[];
  mode: 'any' | 'only'; // 'any' = photos with any of these people, 'only' = photos with ONLY these people
  minFaces?: number;
  maxFaces?: number;
}

export interface AppSettings {
  thumbnailSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark';
  faceDetectionEnabled: boolean;
  faceDetectionSensitivity: number;
  lastOpenedDirectory: string | null;
}
