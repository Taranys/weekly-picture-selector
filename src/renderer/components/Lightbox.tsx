import React, { useEffect } from 'react';
import type { Photo } from '../../shared/types';

interface LightboxProps {
  photo: Photo;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onToggleFavorite: (photoId: number) => void;
}

export function Lightbox({ photo, onClose, onNext, onPrevious, onToggleFavorite }: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
      if (e.key === 'f' || e.key === 'F' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll on spacebar
        onToggleFavorite(photo.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photo.id, onClose, onNext, onPrevious, onToggleFavorite]);

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
      >
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Previous button */}
      {onPrevious && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="absolute left-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Photo */}
      <div onClick={(e) => e.stopPropagation()} className="max-w-7xl max-h-screen p-4">
        <img
          src={`file://${photo.path}`}
          alt={photo.filename}
          className="max-w-full max-h-[85vh] object-contain"
        />

        {/* Info panel */}
        <div className="bg-black/50 text-white p-4 mt-4 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium">{photo.filename}</h3>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-300">
                {photo.captureDate && (
                  <div>
                    <span className="text-gray-400">Date:</span>{' '}
                    {new Date(photo.captureDate).toLocaleString()}
                  </div>
                )}
                {photo.exifData?.camera && (
                  <div>
                    <span className="text-gray-400">Camera:</span> {photo.exifData.camera}
                  </div>
                )}
                {photo.exifData?.lens && (
                  <div>
                    <span className="text-gray-400">Lens:</span> {photo.exifData.lens}
                  </div>
                )}
                {photo.exifData?.iso && (
                  <div>
                    <span className="text-gray-400">ISO:</span> {photo.exifData.iso}
                  </div>
                )}
                {photo.exifData?.aperture && (
                  <div>
                    <span className="text-gray-400">Aperture:</span> {photo.exifData.aperture}
                  </div>
                )}
                {photo.exifData?.shutterSpeed && (
                  <div>
                    <span className="text-gray-400">Shutter:</span> {photo.exifData.shutterSpeed}
                  </div>
                )}
                {photo.exifData?.focalLength && (
                  <div>
                    <span className="text-gray-400">Focal Length:</span> {photo.exifData.focalLength}mm
                  </div>
                )}
                {photo.exifData?.width && photo.exifData?.height && (
                  <div>
                    <span className="text-gray-400">Dimensions:</span> {photo.exifData.width} x{' '}
                    {photo.exifData.height}
                  </div>
                )}
              </div>
            </div>

            {/* Favorite toggle */}
            <button
              onClick={() => onToggleFavorite(photo.id)}
              className="ml-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg
                className={`w-6 h-6 ${
                  photo.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white'
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
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-center text-gray-400 text-sm mt-2">
          <kbd className="px-2 py-1 bg-white/10 rounded">←</kbd> Previous •{' '}
          <kbd className="px-2 py-1 bg-white/10 rounded">→</kbd> Next •{' '}
          <kbd className="px-2 py-1 bg-white/10 rounded">Space</kbd> or{' '}
          <kbd className="px-2 py-1 bg-white/10 rounded">F</kbd> Favorite •{' '}
          <kbd className="px-2 py-1 bg-white/10 rounded">Esc</kbd> Close
        </div>
      </div>
    </div>
  );
}
