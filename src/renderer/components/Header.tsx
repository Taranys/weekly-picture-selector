import React from 'react';
import type { ScanProgress } from '../../shared/types';

interface HeaderProps {
  selectedDirectory: string | null;
  onSelectDirectory: () => void;
  scanProgress: ScanProgress | null;
  photoCount: number;
  favoriteCount: number;
}

export function Header({
  selectedDirectory,
  onSelectDirectory,
  scanProgress,
  photoCount,
  favoriteCount,
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Weekly Picture Selector</h1>
          {selectedDirectory && (
            <p className="text-sm text-gray-600 mt-1 truncate max-w-xl">
              {selectedDirectory}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          {photoCount > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">{photoCount}</span> photos
              </div>
              {favoriteCount > 0 && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-medium">{favoriteCount}</span> favorites
                </div>
              )}
            </div>
          )}

          {/* Select Directory Button */}
          <button
            onClick={onSelectDirectory}
            disabled={scanProgress !== null}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {scanProgress ? 'Scanning...' : 'Select Folder'}
          </button>
        </div>
      </div>

      {/* Scan Progress */}
      {scanProgress && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700 font-medium">
              {scanProgress.phase === 'scanning' && 'Scanning directory...'}
              {scanProgress.phase === 'extracting' && 'Extracting EXIF data...'}
              {scanProgress.phase === 'thumbnails' && 'Generating thumbnails...'}
              {scanProgress.phase === 'complete' && 'Complete!'}
            </span>
            <span className="text-gray-600">
              {scanProgress.processed} / {scanProgress.total} ({scanProgress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${scanProgress.percentage}%` }}
            />
          </div>
          {scanProgress.currentFile && (
            <p className="text-xs text-gray-500 mt-1 truncate">{scanProgress.currentFile}</p>
          )}
        </div>
      )}
    </header>
  );
}
