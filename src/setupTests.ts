import '@testing-library/jest-dom';

// Mock window.electronAPI for tests
global.window.electronAPI = {
  selectDirectory: jest.fn(),
  scanPhotos: jest.fn(),
  getPhotos: jest.fn(),
  toggleFavorite: jest.fn(),
  exportFavorites: jest.fn(),
  onScanProgress: jest.fn(),
  onExportProgress: jest.fn(),
};
