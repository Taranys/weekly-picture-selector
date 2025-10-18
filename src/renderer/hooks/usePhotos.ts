import { useState, useEffect, useCallback } from 'react';
import type { Photo, ScanProgress } from '../../shared/types';

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

  // Listen for scan progress updates
  useEffect(() => {
    window.electronAPI.onScanProgress((progress: ScanProgress) => {
      setScanProgress(progress);
      if (progress.phase === 'complete') {
        loadPhotos();
      }
    });
  }, []);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      const loadedPhotos = await window.electronAPI.getPhotos();
      setPhotos(loadedPhotos);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectDirectory = useCallback(async () => {
    const directory = await window.electronAPI.selectDirectory();
    if (directory) {
      setSelectedDirectory(directory);
      setLoading(true);
      setScanProgress({ phase: 'scanning', currentFile: '', processed: 0, total: 0, percentage: 0 });

      try {
        await window.electronAPI.scanPhotos(directory);
      } catch (error) {
        console.error('Failed to scan photos:', error);
        setLoading(false);
        setScanProgress(null);
      }
    }
  }, []);

  const toggleFavorite = useCallback(async (photoId: number) => {
    try {
      const success = await window.electronAPI.toggleFavorite(photoId);
      if (success) {
        setPhotos(prevPhotos =>
          prevPhotos.map(photo =>
            photo.id === photoId ? { ...photo, isFavorite: !photo.isFavorite } : photo
          )
        );
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  }, []);

  return {
    photos,
    loading,
    scanProgress,
    selectedDirectory,
    selectDirectory,
    toggleFavorite,
    loadPhotos,
  };
}
