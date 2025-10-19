import React, { useEffect, useState } from 'react';
import type { Photo } from '../../shared/types';

interface HiddenItemsManagerProps {
  onClose: () => void;
  onPhotosRestored?: () => void;
}

export function HiddenItemsManager({ onClose, onPhotosRestored }: HiddenItemsManagerProps) {
  const [hiddenPhotos, setHiddenPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHiddenPhotos();
  }, []);

  const loadHiddenPhotos = async () => {
    setLoading(true);
    try {
      const photos = await window.electronAPI.getHiddenPhotos();
      setHiddenPhotos(photos);
    } catch (error) {
      console.error('Error loading hidden photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (photoId: number) => {
    const newSelected = new Set(selectedPhotos);
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId);
    } else {
      newSelected.add(photoId);
    }
    setSelectedPhotos(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPhotos.size === hiddenPhotos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(hiddenPhotos.map((p) => p.id)));
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedPhotos.size === 0) return;

    try {
      // Restore all selected photos
      for (const photoId of selectedPhotos) {
        await window.electronAPI.unhidePhoto(photoId);
      }

      // Reload hidden photos list
      await loadHiddenPhotos();
      setSelectedPhotos(new Set());

      // Notify parent component
      onPhotosRestored?.();
    } catch (error) {
      console.error('Error restoring photos:', error);
    }
  };

  const handleRestoreAll = async () => {
    if (hiddenPhotos.length === 0) return;

    if (!confirm(`Are you sure you want to restore all ${hiddenPhotos.length} hidden photos?`)) {
      return;
    }

    try {
      for (const photo of hiddenPhotos) {
        await window.electronAPI.unhidePhoto(photo.id);
      }

      await loadHiddenPhotos();
      setSelectedPhotos(new Set());
      onPhotosRestored?.();
    } catch (error) {
      console.error('Error restoring all photos:', error);
    }
  };

  // Group photos by subdirectory
  const photosBySubdirectory = hiddenPhotos.reduce((acc, photo) => {
    const key = photo.subdirectory || '(Root)';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hidden Items Manager</h2>
              <p className="text-sm text-gray-600 mt-1">
                {hiddenPhotos.length} hidden {hiddenPhotos.length === 1 ? 'photo' : 'photos'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Action Bar */}
          {hiddenPhotos.length > 0 && (
            <div className="mt-4 flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                {selectedPhotos.size === hiddenPhotos.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleRestoreSelected}
                disabled={selectedPhotos.size === 0}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  selectedPhotos.size > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Restore Selected ({selectedPhotos.size})
              </button>
              <button
                onClick={handleRestoreAll}
                className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Restore All
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading hidden photos...</div>
            </div>
          ) : hiddenPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <svg
                className="w-24 h-24 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-lg text-gray-600">No hidden photos</p>
              <p className="text-sm text-gray-500">All your photos are visible</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(photosBySubdirectory).map(([subdirectory, photos]) => (
                <div key={subdirectory}>
                  {/* Subdirectory Header */}
                  <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-800">{subdirectory}</h3>
                    <span className="text-sm text-gray-500">({photos.length} photos)</span>
                  </div>

                  {/* Photo Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`relative group cursor-pointer aspect-square bg-gray-200 rounded overflow-hidden ${
                          selectedPhotos.has(photo.id) ? 'ring-4 ring-blue-500' : ''
                        }`}
                        onClick={() => handleToggleSelect(photo.id)}
                      >
                        {photo.thumbnailPath ? (
                          <img
                            src={`file://${photo.thumbnailPath}`}
                            alt={photo.filename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}

                        {/* Selection Checkbox */}
                        <div className="absolute top-2 right-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                              selectedPhotos.has(photo.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-white bg-opacity-80 text-gray-600'
                            }`}
                          >
                            {selectedPhotos.has(photo.id) ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                                <circle cx="10" cy="10" r="8" strokeWidth={2} />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Filename on hover */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                          {photo.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
