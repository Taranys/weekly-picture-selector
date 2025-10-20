/**
 * Face Detection Worker Process
 *
 * This runs in an isolated Node.js process to avoid conflicts between:
 * - canvas (used by face-api.js)
 * - sharp (used for thumbnails)
 *
 * Both libraries use libgio but with different versions, causing crashes
 * when loaded in the same process.
 */

import * as faceapi from 'face-api.js';
import * as canvas from 'canvas';
import * as fs from 'fs';
import type { Face, FaceDetectionSettings } from '../shared/types';

// Polyfill for face-api.js to use node-canvas
const { Canvas, Image, ImageData } = canvas;
// @ts-ignore
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

/**
 * Load face-api.js models
 */
async function loadModels(modelsPath: string): Promise<void> {
  if (modelsLoaded) return;

  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromDisk(modelsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(modelsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(modelsPath),
  ]);

  modelsLoaded = true;
  console.log('[Face Worker] Models loaded successfully');
}

/**
 * Detect faces in a single photo
 */
async function detectFacesInPhoto(
  photoPath: string,
  settings: FaceDetectionSettings
): Promise<Face[]> {
  if (!modelsLoaded) {
    throw new Error('Models not loaded');
  }

  // Read image
  const imageBuffer = fs.readFileSync(photoPath);
  const img = await canvas.loadImage(imageBuffer);

  // Detect faces with landmarks and descriptors
  const detectionOptions = new faceapi.TinyFaceDetectorOptions({
    inputSize: settings.quality === 'fast' ? 128 : settings.quality === 'balanced' ? 256 : 512,
    scoreThreshold: settings.sensitivity,
  });

  const detections = await faceapi
    .detectAllFaces(img as any, detectionOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();

  // Filter by minimum face size
  const faces: Face[] = detections
    .filter((detection) => {
      const box = detection.detection.box;
      const size = Math.max(box.width, box.height);
      return size >= settings.minFaceSize;
    })
    .map((detection) => ({
      id: 0, // Will be set by database
      photoId: 0, // Will be set by caller
      embedding: Array.from(detection.descriptor),
      boundingBox: {
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height,
      },
      personId: null,
      confidence: detection.detection.score,
    }));

  return faces;
}

/**
 * Message handler for worker process
 */
process.on('message', async (message: any) => {
  try {
    const { type, data } = message;

    switch (type) {
      case 'load-models':
        await loadModels(data.modelsPath);
        process.send!({ type: 'load-models-response', success: true });
        break;

      case 'detect-faces':
        const faces = await detectFacesInPhoto(data.photoPath, data.settings);
        process.send!({
          type: 'detect-faces-response',
          photoId: data.photoId,
          faces,
        });
        break;

      case 'shutdown':
        process.exit(0);
        break;

      default:
        process.send!({
          type: 'error',
          error: `Unknown message type: ${type}`,
        });
    }
  } catch (error) {
    process.send!({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Signal ready
process.send!({ type: 'ready' });

console.log('[Face Worker] Process started, waiting for models...');
