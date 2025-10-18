import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import type { ExifData } from '../shared/types';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];

export interface ScannedPhoto {
  path: string;
  filename: string;
  captureDate: Date | null;
  exifData: ExifData | null;
  subdirectory: string | null;
}

/**
 * Recursively scan a directory for image files
 */
export async function scanDirectory(
  directoryPath: string,
  onProgress?: (current: string, processed: number, total: number) => void
): Promise<ScannedPhoto[]> {
  const photos: ScannedPhoto[] = [];
  const filePaths: string[] = [];

  // First, collect all file paths
  collectFiles(directoryPath, directoryPath, filePaths);

  const totalFiles = filePaths.length;
  let processed = 0;

  // Process each file
  for (const filePath of filePaths) {
    processed++;
    onProgress?.(filePath, processed, totalFiles);

    try {
      const photo = await processPhoto(filePath, directoryPath);
      if (photo) {
        photos.push(photo);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  return photos;
}

/**
 * Recursively collect all image file paths
 */
function collectFiles(currentPath: string, basePath: string, results: string[]) {
  try {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip hidden files and directories
      if (entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory()) {
        collectFiles(fullPath, basePath, results);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${currentPath}:`, error);
  }
}

/**
 * Process a single photo file
 */
async function processPhoto(
  filePath: string,
  basePath: string
): Promise<ScannedPhoto | null> {
  try {
    const filename = path.basename(filePath);
    const dir = path.dirname(filePath);
    const subdirectory = dir === basePath ? null : path.relative(basePath, dir);

    // Extract EXIF data
    let captureDate: Date | null = null;
    let exifData: ExifData | null = null;

    try {
      const exif = await exifr.parse(filePath, {
        pick: [
          'DateTimeOriginal',
          'CreateDate',
          'Make',
          'Model',
          'LensModel',
          'FocalLength',
          'FNumber',
          'ExposureTime',
          'ISO',
          'ImageWidth',
          'ImageHeight',
          'Orientation',
        ],
      });

      if (exif) {
        // Get capture date
        captureDate = exif.DateTimeOriginal || exif.CreateDate || null;

        // Build EXIF data object
        exifData = {
          camera: exif.Make && exif.Model ? `${exif.Make} ${exif.Model}` : undefined,
          lens: exif.LensModel,
          focalLength: exif.FocalLength,
          aperture: exif.FNumber ? `f/${exif.FNumber}` : undefined,
          shutterSpeed: exif.ExposureTime
            ? formatShutterSpeed(exif.ExposureTime)
            : undefined,
          iso: exif.ISO,
          width: exif.ImageWidth,
          height: exif.ImageHeight,
          orientation: exif.Orientation,
        };
      }
    } catch (exifError) {
      console.warn(`Could not extract EXIF from ${filename}:`, exifError);
    }

    // Fallback to file modification time if no EXIF date
    if (!captureDate) {
      const stats = fs.statSync(filePath);
      captureDate = stats.mtime;
    }

    return {
      path: filePath,
      filename,
      captureDate,
      exifData,
      subdirectory,
    };
  } catch (error) {
    console.error(`Error processing photo ${filePath}:`, error);
    return null;
  }
}

/**
 * Format shutter speed for display
 */
function formatShutterSpeed(seconds: number): string {
  if (seconds >= 1) {
    return `${seconds}s`;
  }
  const denominator = Math.round(1 / seconds);
  return `1/${denominator}s`;
}

/**
 * Calculate ISO 8601 week number from a date
 */
export function getWeekNumber(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}
