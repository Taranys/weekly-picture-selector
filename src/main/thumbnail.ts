import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { app } from 'electron';

const THUMBNAIL_SIZES = {
  small: 200,
  medium: 400,
  large: 800,
};

/**
 * Get the thumbnail cache directory
 */
export function getThumbnailCacheDir(): string {
  const userDataPath = app.getPath('userData');
  const cacheDir = path.join(userDataPath, 'thumbnails');

  // Create directory if it doesn't exist
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  return cacheDir;
}

/**
 * Generate a hash for the photo path to use as cache key
 */
function getPhotoHash(photoPath: string): string {
  return crypto.createHash('md5').update(photoPath).digest('hex');
}

/**
 * Generate thumbnail for a photo
 */
export async function generateThumbnail(
  photoPath: string,
  size: keyof typeof THUMBNAIL_SIZES = 'medium',
  onProgress?: (current: string) => void
): Promise<string | null> {
  try {
    onProgress?.(photoPath);

    const cacheDir = getThumbnailCacheDir();
    const photoHash = getPhotoHash(photoPath);
    const thumbnailFileName = `${photoHash}_${size}.jpg`;
    const thumbnailPath = path.join(cacheDir, thumbnailFileName);

    // Check if thumbnail already exists
    if (fs.existsSync(thumbnailPath)) {
      return thumbnailPath;
    }

    // Generate thumbnail
    const targetSize = THUMBNAIL_SIZES[size];

    await sharp(photoPath)
      .rotate() // Auto-rotate based on EXIF orientation
      .resize(targetSize, targetSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toFile(thumbnailPath);

    return thumbnailPath;
  } catch (error) {
    console.error(`Error generating thumbnail for ${photoPath}:`, error);
    return null;
  }
}

/**
 * Generate thumbnails for multiple photos in batch
 */
export async function generateThumbnails(
  photoPaths: string[],
  size: keyof typeof THUMBNAIL_SIZES = 'medium',
  onProgress?: (current: string, processed: number, total: number) => void
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  const total = photoPaths.length;
  let processed = 0;

  // Process in batches to avoid memory issues
  const BATCH_SIZE = 10;
  for (let i = 0; i < photoPaths.length; i += BATCH_SIZE) {
    const batch = photoPaths.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (photoPath) => {
      const thumbnailPath = await generateThumbnail(photoPath, size);
      processed++;
      onProgress?.(photoPath, processed, total);
      return { photoPath, thumbnailPath };
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ photoPath, thumbnailPath }) => {
      if (thumbnailPath) {
        results.set(photoPath, thumbnailPath);
      }
    });
  }

  return results;
}

/**
 * Clear thumbnail cache
 */
export function clearThumbnailCache(): void {
  const cacheDir = getThumbnailCacheDir();
  if (fs.existsSync(cacheDir)) {
    const files = fs.readdirSync(cacheDir);
    files.forEach((file) => {
      fs.unlinkSync(path.join(cacheDir, file));
    });
  }
}

/**
 * Get cache size in bytes
 */
export function getCacheSize(): number {
  const cacheDir = getThumbnailCacheDir();
  if (!fs.existsSync(cacheDir)) {
    return 0;
  }

  let totalSize = 0;
  const files = fs.readdirSync(cacheDir);
  files.forEach((file) => {
    const stats = fs.statSync(path.join(cacheDir, file));
    totalSize += stats.size;
  });

  return totalSize;
}
