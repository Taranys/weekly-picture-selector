/**
 * Face Detection Service using face-api.js
 * Runs face detection on photos in an isolated worker process
 *
 * Uses a forked Node.js process to avoid conflicts between canvas and sharp.
 */

import { fork, ChildProcess } from 'child_process';
import path from 'path';
import type { Photo, Face, FaceDetectionProgress, FaceDetectionSettings } from '../shared/types';
import { insertFace, deleteFacesByPhotoId } from './database';

let worker: ChildProcess | null = null;
let modelsLoaded = false;
let modelsPath: string | null = null;

/**
 * Start the face detection worker process
 */
function startWorker(): Promise<void> {
  return new Promise((resolve, reject) => {
    const workerPath = path.join(__dirname, 'faceWorker.js');
    console.log('[Face Detection] Starting worker at:', workerPath);

    worker = fork(workerPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
    });

    worker.on('error', (error) => {
      console.error('[Face Detection] Worker error:', error);
      reject(error);
    });

    worker.on('exit', (code) => {
      console.log('[Face Detection] Worker exited with code:', code);
      worker = null;
      modelsLoaded = false;
    });

    // Wait for ready signal
    worker.once('message', (message: any) => {
      if (message.type === 'ready') {
        console.log('[Face Detection] Worker ready');
        resolve();
      } else {
        reject(new Error('Worker did not send ready signal'));
      }
    });

    // Set timeout
    setTimeout(() => reject(new Error('Worker startup timeout')), 10000);
  });
}

/**
 * Initialize and load face-api.js models in worker
 */
export async function loadModels(publicPath: string): Promise<void> {
  if (modelsLoaded) {
    return;
  }

  modelsPath = path.join(publicPath, 'models');
  console.log('[Face Detection] Loading models from:', modelsPath);

  // Start worker if not already running
  if (!worker) {
    await startWorker();
  }

  // Load models in worker
  return new Promise((resolve, reject) => {
    worker!.once('message', (message: any) => {
      if (message.type === 'load-models-response' && message.success) {
        modelsLoaded = true;
        console.log('[Face Detection] Models loaded successfully');
        resolve();
      } else if (message.type === 'error') {
        reject(new Error(message.error));
      }
    });

    worker!.send({
      type: 'load-models',
      data: { modelsPath },
    });

    // Timeout after 30 seconds
    setTimeout(() => reject(new Error('Model loading timeout')), 30000);
  });
}

/**
 * Detect faces in a single photo using worker
 */
export async function detectFacesInPhoto(
  photo: Photo,
  settings: FaceDetectionSettings
): Promise<Face[]> {
  if (!modelsLoaded || !worker) {
    throw new Error('Models not loaded. Call loadModels() first.');
  }

  return new Promise((resolve, reject) => {
    const messageHandler = (message: any) => {
      if (message.type === 'detect-faces-response' && message.photoId === photo.id) {
        worker!.off('message', messageHandler);
        resolve(message.faces);
      } else if (message.type === 'error') {
        worker!.off('message', messageHandler);
        reject(new Error(message.error));
      }
    };

    worker!.on('message', messageHandler);

    worker!.send({
      type: 'detect-faces',
      data: {
        photoId: photo.id,
        photoPath: photo.path,
        settings,
      },
    });

    // Timeout after 60 seconds per photo
    setTimeout(() => {
      worker!.off('message', messageHandler);
      reject(new Error(`Timeout detecting faces in ${photo.filename}`));
    }, 60000);
  });
}

/**
 * Detect faces in multiple photos with progress tracking
 */
export async function detectFacesInPhotos(
  photos: Photo[],
  settings: FaceDetectionSettings,
  progressCallback: (progress: FaceDetectionProgress) => void
): Promise<{ totalFaces: number; photosProcessed: number; errors: string[] }> {
  console.log(`[Face Detection] Processing ${photos.length} photos`);

  let totalFaces = 0;
  let photosProcessed = 0;
  const errors: string[] = [];

  progressCallback({
    phase: 'detecting',
    currentFile: 'Starting...',
    processed: 0,
    total: photos.length,
    percentage: 0,
  });

  for (const photo of photos) {
    try {
      progressCallback({
        phase: 'detecting',
        currentFile: photo.filename,
        processed: photosProcessed,
        total: photos.length,
        percentage: Math.round((photosProcessed / photos.length) * 100),
      });

      // Delete existing faces for this photo
      await deleteFacesByPhotoId(photo.id);

      // Detect new faces
      const faces = await detectFacesInPhoto(photo, settings);

      // Save faces to database
      for (const face of faces) {
        await insertFace({
          photoId: photo.id,
          embedding: face.embedding,
          boundingBox: face.boundingBox,
          personId: null,
          confidence: face.confidence,
        });
      }

      totalFaces += faces.length;
      photosProcessed++;
    } catch (error) {
      console.error(`Error detecting faces in ${photo.filename}:`, error);
      errors.push(`${photo.filename}: ${error instanceof Error ? error.message : String(error)}`);
      photosProcessed++;
    }
  }

  progressCallback({
    phase: 'complete',
    currentFile: 'Detection complete',
    processed: photosProcessed,
    total: photos.length,
    percentage: 100,
  });

  console.log(`[Face Detection] Complete: ${totalFaces} faces in ${photosProcessed} photos`);

  return {
    totalFaces,
    photosProcessed,
    errors,
  };
}

/**
 * Calculate Euclidean distance between two face descriptors
 */
export function calculateDistance(descriptor1: number[], descriptor2: number[]): number {
  if (descriptor1.length !== descriptor2.length) {
    throw new Error('Descriptors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < descriptor1.length; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Find similar faces using descriptor distance
 */
export function findSimilarFaces(
  targetDescriptor: number[],
  allFaces: Face[],
  threshold: number = 0.6
): Face[] {
  const similarFaces: Array<{ face: Face; distance: number }> = [];

  for (const face of allFaces) {
    const distance = calculateDistance(targetDescriptor, face.embedding);
    if (distance < threshold) {
      similarFaces.push({ face, distance });
    }
  }

  // Sort by distance (most similar first)
  similarFaces.sort((a, b) => a.distance - b.distance);

  return similarFaces.map((item) => item.face);
}

/**
 * Cluster faces using simple distance-based clustering
 * Returns clusters as arrays of face IDs
 */
export function clusterFaces(
  allFaces: Face[],
  distanceThreshold: number = 0.6
): Array<{ faceIds: number[]; averageDescriptor: number[] }> {
  if (allFaces.length === 0) {
    return [];
  }

  const clusters: Array<{ faceIds: number[]; descriptors: number[][] }> = [];
  const assignedFaces = new Set<number>();

  for (const face of allFaces) {
    if (assignedFaces.has(face.id)) {
      continue;
    }

    // Find all similar faces
    const similarFaces = findSimilarFaces(face.embedding, allFaces, distanceThreshold);

    // Create new cluster
    const clusterFaceIds: number[] = [];
    const clusterDescriptors: number[][] = [];

    for (const similarFace of similarFaces) {
      if (!assignedFaces.has(similarFace.id)) {
        clusterFaceIds.push(similarFace.id);
        clusterDescriptors.push(similarFace.embedding);
        assignedFaces.add(similarFace.id);
      }
    }

    if (clusterFaceIds.length > 0) {
      clusters.push({
        faceIds: clusterFaceIds,
        descriptors: clusterDescriptors,
      });
    }
  }

  // Calculate average descriptor for each cluster
  return clusters.map((cluster) => {
    const avgDescriptor = calculateAverageDescriptor(cluster.descriptors);
    return {
      faceIds: cluster.faceIds,
      averageDescriptor: avgDescriptor,
    };
  });
}

/**
 * Calculate average face descriptor from multiple descriptors
 */
function calculateAverageDescriptor(descriptors: number[][]): number[] {
  if (descriptors.length === 0) {
    return [];
  }

  const descriptorLength = descriptors[0].length;
  const avgDescriptor = new Array(descriptorLength).fill(0);

  for (const descriptor of descriptors) {
    for (let i = 0; i < descriptorLength; i++) {
      avgDescriptor[i] += descriptor[i];
    }
  }

  for (let i = 0; i < descriptorLength; i++) {
    avgDescriptor[i] /= descriptors.length;
  }

  return avgDescriptor;
}

/**
 * Check if models are loaded
 * Always returns true in placeholder mode
 */
export function areModelsLoaded(): boolean {
  return modelsLoaded;
}
