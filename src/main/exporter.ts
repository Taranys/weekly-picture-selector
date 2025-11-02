import * as fs from 'fs';
import * as path from 'path';
import type { ExportConfig, ExportResult, ExportProgress, Week, ExportFolder } from '../shared/types';

/**
 * Export favorites to organized folder structure
 */
export async function exportFavorites(
  weeks: Week[],
  config: ExportConfig,
  progressCallback: (progress: ExportProgress) => void
): Promise<ExportResult> {
  const result: ExportResult = {
    success: false,
    totalFiles: 0,
    totalSize: 0,
    skippedFiles: [],
    errors: [],
    exportPath: config.destinationPath,
    timestamp: new Date(),
    folders: [],
  };

  try {
    // Filter weeks with favorites
    const weeksToExport = weeks.filter((w) => w.favoriteCount > 0);

    if (weeksToExport.length === 0) {
      throw new Error('No favorites to export');
    }

    // Calculate total files
    const totalFiles = weeksToExport.reduce((sum, w) => sum + w.favoriteCount, 0);
    let processedFiles = 0;

    progressCallback({
      phase: 'preparing',
      currentFile: 'Creating directories...',
      processed: 0,
      total: totalFiles,
      percentage: 0,
    });

    // Create destination directory if it doesn't exist
    if (!config.dryRun) {
      if (!fs.existsSync(config.destinationPath)) {
        fs.mkdirSync(config.destinationPath, { recursive: true });
      }
    }

    // Export each week
    for (let i = 0; i < weeksToExport.length; i++) {
      const week = weeksToExport[i];
      const folderName = generateFolderName(week.weekNumber, config);
      const folderPath = path.join(config.destinationPath, folderName);

      progressCallback({
        phase: 'copying',
        currentFile: folderName,
        processed: processedFiles,
        total: totalFiles,
        percentage: (processedFiles / totalFiles) * 100,
        currentFolder: folderName,
      });

      const exportFolder: ExportFolder = {
        folderName,
        weekNumber: week.weekNumber,
        year: week.year,
        photoCount: 0,
        files: [],
      };

      // Create week folder
      if (!config.dryRun) {
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }
      }

      // Get favorite photos
      const favoritePhotos = week.photos.filter((p) => p.isFavorite);

      // Copy/move each favorite photo
      for (let j = 0; j < favoritePhotos.length; j++) {
        const photo = favoritePhotos[j];
        const fileName = config.renamePhotos
          ? generatePhotoName(j + 1, photo.filename, config)
          : photo.filename;
        const destPath = path.join(folderPath, fileName);

        progressCallback({
          phase: 'copying',
          currentFile: photo.filename,
          processed: processedFiles,
          total: totalFiles,
          percentage: (processedFiles / totalFiles) * 100,
          currentFolder: folderName,
        });

        try {
          if (!config.dryRun) {
            if (fs.existsSync(destPath)) {
              // Handle file conflict
              const uniquePath = generateUniquePath(destPath);
              if (config.copyOrMove === 'copy') {
                fs.copyFileSync(photo.path, uniquePath);
              } else {
                fs.renameSync(photo.path, uniquePath);
              }
              exportFolder.files.push(path.basename(uniquePath));
            } else {
              if (config.copyOrMove === 'copy') {
                fs.copyFileSync(photo.path, destPath);
              } else {
                fs.renameSync(photo.path, destPath);
              }
              exportFolder.files.push(fileName);
            }

            // Get file size
            const stats = fs.statSync(config.copyOrMove === 'copy' ? photo.path : destPath);
            result.totalSize += stats.size;
          } else {
            // Dry run - just log what would happen
            exportFolder.files.push(fileName);
            const stats = fs.statSync(photo.path);
            result.totalSize += stats.size;
          }

          result.totalFiles++;
          exportFolder.photoCount++;
          processedFiles++;
        } catch (error) {
          const errorMsg = `Failed to ${config.copyOrMove} ${photo.filename}: ${
            error instanceof Error ? error.message : String(error)
          }`;
          result.errors.push(errorMsg);
          result.skippedFiles.push(photo.filename);
        }
      }

      result.folders.push(exportFolder);
    }

    progressCallback({
      phase: 'complete',
      currentFile: 'Export complete!',
      processed: totalFiles,
      total: totalFiles,
      percentage: 100,
    });

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    result.errors.push(
      `Export failed: ${error instanceof Error ? error.message : String(error)}`
    );
    progressCallback({
      phase: 'error',
      currentFile: 'Export failed',
      processed: 0,
      total: 0,
      percentage: 0,
    });
    throw error;
  }
}

/**
 * Generate folder name based on naming pattern
 */
function generateFolderName(index: number, config: ExportConfig): string {
  const paddedIndex = String(index).padStart(2, '0');

  switch (config.namingPattern) {
    case 'S01':
      return `S${paddedIndex}`;
    case 'Week-01':
      return `Week-${paddedIndex}`;
    case 'custom':
      return `${config.customPrefix || 'W'}${paddedIndex}`;
    default:
      return `S${paddedIndex}`;
  }
}

/**
 * Generate photo name based on naming pattern
 */
function generatePhotoName(
  index: number,
  originalFilename: string,
  config: ExportConfig
): string {
  const ext = path.extname(originalFilename);
  const paddedIndex = String(index).padStart(3, '0');

  if (!config.renamePhotos) {
    return originalFilename;
  }

  switch (config.photoNamingPattern) {
    case 'sequential':
      return `photo_${paddedIndex}${ext}`;
    case 'date':
      const date = new Date().toISOString().split('T')[0];
      return `${date}_${paddedIndex}${ext}`;
    case 'original':
    default:
      return originalFilename;
  }
}

/**
 * Generate unique file path if file already exists
 */
function generateUniquePath(filePath: string): string {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const nameWithoutExt = path.basename(filePath, ext);

  let counter = 1;
  let uniquePath = filePath;

  while (fs.existsSync(uniquePath)) {
    uniquePath = path.join(dir, `${nameWithoutExt}_${counter}${ext}`);
    counter++;
  }

  return uniquePath;
}

/**
 * Validate export configuration
 */
export function validateExportConfig(config: ExportConfig): string[] {
  const errors: string[] = [];

  if (!config.destinationPath) {
    errors.push('Destination path is required');
  }

  if (config.destinationPath && !path.isAbsolute(config.destinationPath)) {
    errors.push('Destination path must be absolute');
  }

  if (config.namingPattern === 'custom' && !config.customPrefix) {
    errors.push('Custom prefix is required when using custom naming pattern');
  }

  return errors;
}

/**
 * Check if export would overwrite existing files
 */
export function checkExportConflicts(
  weeks: Week[],
  config: ExportConfig
): { hasConflicts: boolean; conflicts: string[] } {
  const conflicts: string[] = [];

  if (!fs.existsSync(config.destinationPath)) {
    return { hasConflicts: false, conflicts };
  }

  const weeksToExport = weeks.filter((w) => w.favoriteCount > 0);

  for (let i = 0; i < weeksToExport.length; i++) {
    const week = weeksToExport[i];
    const folderName = generateFolderName(week.weekNumber, config);
    const folderPath = path.join(config.destinationPath, folderName);

    if (fs.existsSync(folderPath)) {
      conflicts.push(folderName);
    }
  }

  return { hasConflicts: conflicts.length > 0, conflicts };
}
