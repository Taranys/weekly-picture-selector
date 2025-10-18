import * as fs from 'fs';
import * as path from 'path';
import { exportFavorites, validateExportConfig, checkExportConflicts } from './exporter';
import type { ExportConfig, Week, Photo, ExportProgress } from '../shared/types';

// Mock fs module
jest.mock('fs');

describe('exporter', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockPhoto = (id: number, filename: string): Photo => ({
    id,
    path: `/test/photos/${filename}`,
    filename,
    captureDate: new Date('2024-01-15'),
    weekNumber: 3,
    year: 2024,
    exifData: null,
    thumbnailPath: `/test/thumbs/${filename}`,
    isFavorite: true,
    subdirectory: null,
    isHidden: false,
    createdAt: new Date(),
  });

  const createMockWeek = (weekNumber: number, year: number, photoCount: number): Week => {
    const photos = Array.from({ length: photoCount }, (_, i) =>
      createMockPhoto(i + 1, `photo${i + 1}.jpg`)
    );
    return {
      weekNumber,
      year,
      startDate: new Date(year, 0, 1 + (weekNumber - 1) * 7),
      endDate: new Date(year, 0, 7 + (weekNumber - 1) * 7),
      photos,
      favoriteCount: photoCount,
    };
  };

  describe('validateExportConfig', () => {
    it('should return empty array for valid configuration', () => {
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'S01',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      const errors = validateExportConfig(config);
      expect(errors).toEqual([]);
    });

    it('should return error when destination path is missing', () => {
      const config: ExportConfig = {
        destinationPath: '',
        namingPattern: 'S01',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      const errors = validateExportConfig(config);
      expect(errors).toContain('Destination path is required');
    });

    it('should return error when custom prefix is missing', () => {
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'custom',
        customPrefix: '',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      const errors = validateExportConfig(config);
      expect(errors).toContain('Custom prefix is required when using custom naming pattern');
    });
  });

  describe('checkExportConflicts', () => {
    it('should return no conflicts when destination does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const weeks = [createMockWeek(1, 2024, 2)];
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'S01',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      const result = checkExportConflicts(weeks, config);
      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toEqual([]);
    });

    it('should detect conflicts when folders already exist', () => {
      mockFs.existsSync.mockImplementation((p: any) => {
        const pathStr = p.toString();
        return pathStr.includes('/S01') || pathStr === '/test/export';
      });

      const weeks = [createMockWeek(1, 2024, 2), createMockWeek(2, 2024, 3)];
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'S01',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      const result = checkExportConflicts(weeks, config);
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toContain('S01');
    });
  });

  describe('exportFavorites', () => {
    it('should throw error when no favorites to export', async () => {
      const weeks: Week[] = [];
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'S01',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      await expect(
        exportFavorites(weeks, config, jest.fn())
      ).rejects.toThrow('No favorites to export');
    });

    it('should call progress callback during export', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.copyFileSync.mockImplementation(() => undefined);
      mockFs.statSync.mockReturnValue({ size: 5 * 1024 * 1024 } as any);

      const weeks = [createMockWeek(1, 2024, 2)];
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'S01',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      const progressCallback = jest.fn();
      await exportFavorites(weeks, config, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'preparing',
        })
      );
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'complete',
        })
      );
    });

    it('should create correct folder structure with S01 pattern', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.copyFileSync.mockImplementation(() => undefined);
      mockFs.statSync.mockReturnValue({ size: 5 * 1024 * 1024 } as any);

      const weeks = [createMockWeek(1, 2024, 2), createMockWeek(2, 2024, 3)];
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'S01',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      const result = await exportFavorites(weeks, config, jest.fn());

      expect(result.success).toBe(true);
      expect(result.folders).toHaveLength(2);
      expect(result.folders[0].folderName).toBe('S01');
      expect(result.folders[1].folderName).toBe('S02');
    });

    it('should perform dry run without copying files', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.statSync.mockReturnValue({ size: 5 * 1024 * 1024 } as any);

      const weeks = [createMockWeek(1, 2024, 2)];
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'S01',
        copyOrMove: 'copy',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: true,
      };

      const result = await exportFavorites(weeks, config, jest.fn());

      expect(result.success).toBe(true);
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
      expect(mockFs.copyFileSync).not.toHaveBeenCalled();
    });

    it('should use move instead of copy when configured', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => undefined);
      mockFs.renameSync.mockImplementation(() => undefined);
      mockFs.statSync.mockReturnValue({ size: 5 * 1024 * 1024 } as any);

      const weeks = [createMockWeek(1, 2024, 2)];
      const config: ExportConfig = {
        destinationPath: '/test/export',
        namingPattern: 'S01',
        copyOrMove: 'move',
        renamePhotos: false,
        selectedWeeksOnly: false,
        dryRun: false,
      };

      await exportFavorites(weeks, config, jest.fn());

      expect(mockFs.renameSync).toHaveBeenCalled();
      expect(mockFs.copyFileSync).not.toHaveBeenCalled();
    });
  });
});
