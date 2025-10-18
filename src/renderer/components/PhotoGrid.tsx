import React from 'react';
import type { Photo } from '../../shared/types';

interface PhotoGridProps {
  photos: Photo[];
  onToggleFavorite: (photoId: number) => void;
  onPhotoClick: (photo: Photo) => void;
}

export function PhotoGrid({ photos, onToggleFavorite, onPhotoClick }: PhotoGridProps) {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative group cursor-pointer aspect-square bg-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          onClick={() => onPhotoClick(photo)}
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
            <div className="absolute top-2 left-2 p-1.5 bg-yellow-500 rounded-full shadow-md">
              <svg className="w-4 h-4 text-white fill-white" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
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
  );
}
