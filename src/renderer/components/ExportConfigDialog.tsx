import React, { useState, useEffect } from 'react';
import type { ExportConfig, Week, ExportProgress, ExportResult } from '../../shared/types';

interface ExportConfigDialogProps {
  weeks: Week[];
  onClose: () => void;
  onExportComplete: (result: ExportResult) => void;
}

export function ExportConfigDialog({ weeks, onClose, onExportComplete }: ExportConfigDialogProps) {
  const [config, setConfig] = useState<ExportConfig>({
    destinationPath: '',
    namingPattern: 'S01',
    customPrefix: '',
    copyOrMove: 'copy',
    renamePhotos: false,
    photoNamingPattern: 'original',
    selectedWeeksOnly: false,
    dryRun: false,
  });

  const [conflicts, setConflicts] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const weeksToExport = weeks.filter((w) => w.favoriteCount > 0);
  const totalFiles = weeksToExport.reduce((sum, w) => sum + w.favoriteCount, 0);

  useEffect(() => {
    // Listen for export progress
    window.electronAPI.onExportProgress((progress: ExportProgress) => {
      setExportProgress(progress);
    });
  }, []);

  const handleSelectDestination = async () => {
    const path = await window.electronAPI.selectExportDirectory();
    if (path) {
      setConfig({ ...config, destinationPath: path });
      // Check for conflicts
      const conflictResult = await window.electronAPI.checkExportConflicts(weeksToExport, {
        ...config,
        destinationPath: path,
      });
      setConflicts(conflictResult.conflicts);
    }
  };

  const handleExport = async () => {
    // Validate configuration
    const errors = await window.electronAPI.validateExportConfig(config);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setExporting(true);

    try {
      const result = await window.electronAPI.exportFavorites(weeksToExport, config);
      onExportComplete(result);
    } catch (error) {
      alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
      setExporting(false);
      setExportProgress(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (exporting && exportProgress) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {config.dryRun ? 'Simulating Export...' : 'Exporting Favorites...'}
          </h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{exportProgress.phase}</span>
                <span>{exportProgress.percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress.percentage}%` }}
                ></div>
              </div>
            </div>

            {exportProgress.currentFolder && (
              <div className="text-sm text-gray-600">
                Current folder: <span className="font-semibold">{exportProgress.currentFolder}</span>
              </div>
            )}

            <div className="text-sm text-gray-600">
              {exportProgress.currentFile}
            </div>

            <div className="text-sm text-gray-500">
              {exportProgress.processed} of {exportProgress.total} files
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Export Configuration</h2>
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

          {/* Summary */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{weeksToExport.length}</div>
                <div className="text-sm text-gray-600">Folders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalFiles}</div>
                <div className="text-sm text-gray-600">Photos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatBytes(totalFiles * 5 * 1024 * 1024)} {/* Estimate */}
                </div>
                <div className="text-sm text-gray-600">Est. Size</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-red-900">Configuration Errors</h4>
                  <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                    {validationErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Conflicts Warning */}
          {conflicts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Existing Folders Detected</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    The following folders already exist: {conflicts.join(', ')}. Files will be renamed if needed.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Destination Folder *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={config.destinationPath}
                readOnly
                placeholder="Select destination folder..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
              <button
                onClick={handleSelectDestination}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Folder Naming Pattern */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Folder Naming Pattern
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="namingPattern"
                  value="S01"
                  checked={config.namingPattern === 'S01'}
                  onChange={(e) => setConfig({ ...config, namingPattern: e.target.value as any })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">S01, S02, S03...</div>
                  <div className="text-xs text-gray-500">Default pattern</div>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="namingPattern"
                  value="Week-01"
                  checked={config.namingPattern === 'Week-01'}
                  onChange={(e) => setConfig({ ...config, namingPattern: e.target.value as any })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Week-01, Week-02...</div>
                  <div className="text-xs text-gray-500">With prefix</div>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="namingPattern"
                  value="custom"
                  checked={config.namingPattern === 'custom'}
                  onChange={(e) => setConfig({ ...config, namingPattern: e.target.value as any })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Custom</div>
                  <div className="text-xs text-gray-500">Your prefix</div>
                </div>
              </label>
            </div>

            {config.namingPattern === 'custom' && (
              <input
                type="text"
                value={config.customPrefix}
                onChange={(e) => setConfig({ ...config, customPrefix: e.target.value })}
                placeholder="Enter custom prefix (e.g., W, MyWeek)"
                className="mt-3 w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            )}
          </div>

          {/* Copy or Move */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              File Operation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="copyOrMove"
                  value="copy"
                  checked={config.copyOrMove === 'copy'}
                  onChange={(e) => setConfig({ ...config, copyOrMove: e.target.value as any })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Copy Files</div>
                  <div className="text-xs text-gray-500">Keep originals</div>
                </div>
              </label>

              <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="copyOrMove"
                  value="move"
                  checked={config.copyOrMove === 'move'}
                  onChange={(e) => setConfig({ ...config, copyOrMove: e.target.value as any })}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Move Files</div>
                  <div className="text-xs text-gray-500 text-red-600">⚠️ Original removed</div>
                </div>
              </label>
            </div>
          </div>

          {/* Photo Renaming */}
          <div>
            <label className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                checked={config.renamePhotos}
                onChange={(e) => setConfig({ ...config, renamePhotos: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <span className="text-sm font-semibold text-gray-900">Rename photos in export</span>
            </label>

            {config.renamePhotos && (
              <div className="ml-8 space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="photoNaming"
                    value="sequential"
                    checked={config.photoNamingPattern === 'sequential'}
                    onChange={(e) => setConfig({ ...config, photoNamingPattern: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm">Sequential (photo_001.jpg, photo_002.jpg...)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="photoNaming"
                    value="date"
                    checked={config.photoNamingPattern === 'date'}
                    onChange={(e) => setConfig({ ...config, photoNamingPattern: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm">With date (2025-01-15_001.jpg...)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="photoNaming"
                    value="original"
                    checked={config.photoNamingPattern === 'original'}
                    onChange={(e) => setConfig({ ...config, photoNamingPattern: e.target.value as any })}
                    className="mr-2"
                  />
                  <span className="text-sm">Keep original names</span>
                </label>
              </div>
            )}
          </div>

          {/* Dry Run */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={config.dryRun}
                onChange={(e) => setConfig({ ...config, dryRun: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div>
                <div className="text-sm font-semibold text-gray-900">Dry Run (Test Mode)</div>
                <div className="text-xs text-gray-500">Simulate export without copying files</div>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!config.destinationPath}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {config.dryRun ? 'Simulate Export' : 'Start Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
