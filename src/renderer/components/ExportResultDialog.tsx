import React from 'react';
import type { ExportResult } from '../../shared/types';

interface ExportResultDialogProps {
  result: ExportResult;
  onClose: () => void;
}

export function ExportResultDialog({ result, onClose }: ExportResultDialogProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {result.success ? (
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {result.success ? 'Export Complete!' : 'Export Completed with Errors'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(result.timestamp)}
                </p>
              </div>
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

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{result.folders.length}</div>
              <div className="text-sm text-gray-600">Folders Created</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{result.totalFiles}</div>
              <div className="text-sm text-gray-600">Files Exported</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{formatBytes(result.totalSize)}</div>
              <div className="text-sm text-gray-600">Total Size</div>
            </div>
            {result.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{result.errors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Path */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Location</h3>
            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
              {result.exportPath}
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Errors ({result.errors.length})</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-48 overflow-auto">
                <ul className="space-y-2">
                  {result.errors.map((error, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start">
                      <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Skipped Files */}
          {result.skippedFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Skipped Files ({result.skippedFiles.length})
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-h-32 overflow-auto">
                <ul className="space-y-1">
                  {result.skippedFiles.map((file, i) => (
                    <li key={i} className="text-sm text-amber-700">
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Folder Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Exported Folders</h3>
            <div className="space-y-3 max-h-96 overflow-auto">
              {result.folders.map((folder, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 text-blue-700 font-mono font-semibold px-3 py-1 rounded">
                        {folder.folderName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Week {folder.weekNumber}, {folder.year}
                      </div>
                      <div className="text-sm text-gray-600">
                        {folder.photoCount} {folder.photoCount === 1 ? 'photo' : 'photos'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {folder.files.slice(0, 5).map((file, j) => (
                      <div key={j} className="truncate">
                        {file}
                      </div>
                    ))}
                    {folder.files.length > 5 && (
                      <div className="text-gray-400 italic">
                        + {folder.files.length - 5} more files...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Success Message */}
          {result.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-green-900">
                    Export completed successfully!
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    All your favorite photos have been exported to the selected destination.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
