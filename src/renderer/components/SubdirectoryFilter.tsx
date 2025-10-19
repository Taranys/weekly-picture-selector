import React, { useEffect, useState } from 'react';

interface SubdirectoryStat {
  subdirectory: string | null;
  photoCount: number;
  favoriteCount: number;
}

interface SubdirectoryFilterProps {
  selectedSubdirectory: string | null;
  onSelectSubdirectory: (subdirectory: string | null) => void;
  onHideSubdirectory?: (subdirectory: string) => void;
}

export function SubdirectoryFilter({
  selectedSubdirectory,
  onSelectSubdirectory,
  onHideSubdirectory,
}: SubdirectoryFilterProps) {
  const [stats, setStats] = useState<SubdirectoryStat[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; subdirectory: string } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const subdirStats = await window.electronAPI.getSubdirectoryStats();
      setStats(subdirStats);
    } catch (error) {
      console.error('Error loading subdirectory stats:', error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, subdirectory: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, subdirectory });
  };

  const handleHideSubdirectory = async () => {
    if (!contextMenu || !onHideSubdirectory) return;

    onHideSubdirectory(contextMenu.subdirectory);
    setContextMenu(null);

    // Reload stats after hiding
    setTimeout(loadStats, 100);
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const totalPhotos = stats.reduce((sum, s) => sum + s.photoCount, 0);
  const totalFavorites = stats.reduce((sum, s) => sum + s.favoriteCount, 0);

  // Filter out null subdirectory for the dropdown, but show it in the "All" option
  const nonNullStats = stats.filter((s) => s.subdirectory !== null);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
          selectedSubdirectory !== null
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <span className="font-medium">
          {selectedSubdirectory ? selectedSubdirectory : 'All Folders'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-auto">
          {/* All Folders Option */}
          <button
            onClick={() => {
              onSelectSubdirectory(null);
              setIsOpen(false);
            }}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
              selectedSubdirectory === null ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                <span className="font-medium text-gray-900">All Folders</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-gray-600">{totalPhotos} photos</span>
                <span className="text-yellow-600">{totalFavorites} favorites</span>
              </div>
            </div>
          </button>

          {/* Individual Subdirectories */}
          {nonNullStats.length > 0 ? (
            nonNullStats.map((stat) => (
              <button
                key={stat.subdirectory}
                onClick={() => {
                  onSelectSubdirectory(stat.subdirectory);
                  setIsOpen(false);
                }}
                onContextMenu={(e) => handleContextMenu(e, stat.subdirectory!)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  selectedSubdirectory === stat.subdirectory ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    <span className="text-gray-900 truncate max-w-[180px]" title={stat.subdirectory!}>
                      {stat.subdirectory}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-600">{stat.photoCount}</span>
                    {stat.favoriteCount > 0 && (
                      <span className="flex items-center text-yellow-600">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {stat.favoriteCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500">
              <p>No subdirectories found</p>
              <p className="text-sm mt-1">All photos are in the root folder</p>
            </div>
          )}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && onHideSubdirectory && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={handleHideSubdirectory}
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
            <span>Hide Folder</span>
          </button>
        </div>
      )}
    </div>
  );
}
