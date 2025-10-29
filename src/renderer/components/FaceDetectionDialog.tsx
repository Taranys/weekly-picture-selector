import React, { useState, useEffect } from 'react';
import type { FaceDetectionProgress, FaceDetectionSettings } from '../../shared/types';

interface FaceDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDetection: (settings: FaceDetectionSettings) => void;
  autoStart?: boolean;
}

export function FaceDetectionDialog({ isOpen, onClose, onStartDetection, autoStart = false }: FaceDetectionDialogProps) {
  const [settings, setSettings] = useState<FaceDetectionSettings>({
    enabled: true,
    sensitivity: 0.5,
    minFaceSize: 50,
    quality: 'balanced',
    backgroundProcessing: false,
  });

  const [progress, setProgress] = useState<FaceDetectionProgress | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<{ totalFaces: number; photosProcessed: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setProgress(null);
      setIsDetecting(false);
      setResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleProgress = (prog: FaceDetectionProgress) => {
      setProgress(prog);

      if (prog.phase === 'complete') {
        setIsDetecting(false);
      } else if (prog.phase === 'error') {
        setIsDetecting(false);
      }
    };

    window.electronAPI.onFaceDetectionProgress(handleProgress);
  }, []);

  const handleStart = () => {
    setIsDetecting(true);
    setProgress({ phase: 'loading_models', currentFile: 'Loading models...', processed: 0, total: 0, percentage: 0 });
    onStartDetection(settings);
  };

  // Auto-start detection if autoStart is true
  useEffect(() => {
    if (isOpen && autoStart && !isDetecting && !result) {
      console.log('[Face Detection Dialog] Auto-starting detection...');
      // Small delay to let the dialog render first
      const timer = setTimeout(() => {
        handleStart();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoStart, isDetecting, result]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900">Face Detection</h2>
          </div>
          {!isDetecting && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {!isDetecting && !result && (
            <div className="space-y-6">
              {/* Settings */}
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Configure face detection settings. This will analyze all visible photos and detect faces.
                </p>

                {/* Quality Setting */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detection Quality
                  </label>
                  <div className="flex space-x-2">
                    {(['fast', 'balanced', 'accurate'] as const).map((quality) => (
                      <button
                        key={quality}
                        onClick={() => setSettings({ ...settings, quality })}
                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                          settings.quality === quality
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-medium capitalize">{quality}</div>
                        <div className="text-xs mt-1">
                          {quality === 'fast' && '⚡ Fastest'}
                          {quality === 'balanced' && '⚖️ Recommended'}
                          {quality === 'accurate' && '🎯 Best accuracy'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sensitivity Slider */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detection Sensitivity: {Math.round(settings.sensitivity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.05"
                    value={settings.sensitivity}
                    onChange={(e) => setSettings({ ...settings, sensitivity: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Less sensitive (fewer faces)</span>
                    <span>More sensitive (more faces)</span>
                  </div>
                </div>

                {/* Minimum Face Size */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Face Size: {settings.minFaceSize}px
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    step="10"
                    value={settings.minFaceSize}
                    onChange={(e) => setSettings({ ...settings, minFaceSize: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Detect smaller faces</span>
                    <span>Only larger faces</span>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Privacy Notice</p>
                    <p>All face detection happens locally on your device. No data is sent to external servers.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Display */}
          {isDetecting && progress && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-medium text-gray-900 mb-2">
                  {progress.phase === 'loading_models' && 'Loading AI Models...'}
                  {progress.phase === 'detecting' && 'Detecting Faces...'}
                  {progress.phase === 'clustering' && 'Clustering Similar Faces...'}
                  {progress.phase === 'complete' && '✓ Detection Complete'}
                  {progress.phase === 'error' && '✗ Detection Failed'}
                </div>

                {progress.phase === 'detecting' && (
                  <p className="text-sm text-gray-600 mb-4">
                    Processing: {progress.currentFile}
                  </p>
                )}

                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>{progress.processed} / {progress.total}</span>
                  <span>{Math.round(progress.percentage)}%</span>
                </div>
              </div>

              {/* Spinner for loading models */}
              {progress.phase === 'loading_models' && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
                </div>
              )}
            </div>
          )}

          {/* Results Display */}
          {result && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Detection Complete!</h3>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.totalFaces}</div>
                  <div className="text-sm text-gray-600 mt-1">Faces Detected</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{result.photosProcessed}</div>
                  <div className="text-sm text-gray-600 mt-1">Photos Processed</div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="font-medium text-orange-800 mb-2">
                    {result.errors.length} photos had errors:
                  </p>
                  <div className="text-sm text-orange-700 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <p key={idx}>• {error}</p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="italic">...and {result.errors.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          {!isDetecting && !result && (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStart}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Start Detection</span>
              </button>
            </>
          )}
          {result && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
