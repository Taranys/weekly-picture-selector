import React, { useState, useEffect } from 'react';
import type { Photo } from '../../shared/types';

interface PhotoGridProps {
  photos: Photo[];
  onToggleFavorite: (photoId: number) => void;
  onPhotoClick: (photo: Photo) => void;
  onHidePhoto?: (photoId: number) => void;
}

export function PhotoGrid({ photos, onToggleFavorite, onPhotoClick, onHidePhoto }: PhotoGridProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; photo: Photo } | null>(null);
  const [faceCounts, setFaceCounts] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Load face counts for all photos
  useEffect(() => {
    const loadFaceCounts = async () => {
      const counts = new Map<number, number>();
      for (const photo of photos) {
        try {
          const count = await window.electronAPI.getFaceCount(photo.id);
          if (count > 0) {
            counts.set(photo.id, count);
          }
        } catch (error) {
          // Silently ignore errors (face detection may not be enabled)
        }
      }
      setFaceCounts(counts);
    };

    if (photos.length > 0) {
      loadFaceCounts();
    }
  }, [photos]);

  const handleContextMenu = (e: React.MouseEvent, photo: Photo) => {
    if (!onHidePhoto) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, photo });
  };

  const handleHidePhoto = () => {
    if (!contextMenu || !onHidePhoto) return;
    onHidePhoto(contextMenu.photo.id);
    setContextMenu(null);
  };
  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4">No photos to display</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative group cursor-pointer aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all ${
              photo.isFavorite ? 'ring-4 ring-yellow-400 shadow-lg' : ''
            }`}
            onClick={() => onPhotoClick(photo)}
            onContextMenu={(e) => handleContextMenu(e, photo)}
          >
          {/* Photo thumbnail */}
          {photo.thumbnailPath ? (
            <img
              src={`file://${photo.thumbnailPath}`}
              alt={photo.filename}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(photo.id);
            }}
            className="absolute top-2 right-2 p-2 bg-white/90 rounded-full shadow-md hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
          >
            <svg
              className={`w-5 h-5 ${
                photo.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'
              }`}
              fill={photo.isFavorite ? 'currentColor' : 'none'}
              viewBox="0 0 20 20"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </button>

          {/* Favorite badge (always visible when favorited) */}
          {photo.isFavorite && (
            <div className="absolute top-2 left-2 p-2 bg-yellow-500 rounded-full shadow-lg">
              <svg className="w-5 h-5 text-white fill-white" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}

          {/* Subdirectory tag */}
          {photo.subdirectory && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500/90 text-white text-xs rounded-md shadow-md flex items-center space-x-1 max-w-[calc(100%-4rem)]">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="truncate" title={photo.subdirectory}>
                {photo.subdirectory}
              </span>
            </div>
          )}

          {/* Face count badge */}
          {faceCounts.has(photo.id) && faceCounts.get(photo.id)! > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-purple-600/90 text-white text-xs rounded-md shadow-md flex items-center space-x-1">
              <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium">{faceCounts.get(photo.id)}</span>
            </div>
          )}

          {/* Photo info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-xs truncate">{photo.filename}</p>
            {photo.captureDate && (
              <p className="text-white/80 text-xs">
                {new Date(photo.captureDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* Context Menu */}
    {contextMenu && onHidePhoto && (
      <div
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[180px]"
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <div className="px-3 py-2 border-b border-gray-100">
          <p className="text-xs text-gray-500 truncate">{contextMenu.photo.filename}</p>
        </div>
        <button
          onClick={handleHidePhoto}
          className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
          <span>Hide Photo</span>
        </button>
      </div>
    )}
  </>
  );
}
