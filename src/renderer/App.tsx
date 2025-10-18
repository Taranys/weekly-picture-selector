import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { WeekSidebar } from './components/WeekSidebar';
import { PhotoGrid } from './components/PhotoGrid';
import { Lightbox } from './components/Lightbox';
import { FavoritesSummary } from './components/FavoritesSummary';
import { usePhotos } from './hooks/usePhotos';
import type { Week, Photo } from '../shared/types';

type ViewMode = 'all' | 'favorites';

function App() {
  const {
    photos,
    loading,
    scanProgress,
    selectedDirectory,
    selectDirectory,
    toggleFavorite,
  } = usePhotos();

  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');

  // Group photos by week
  const weeks = useMemo(() => {
    const weekMap = new Map<string, Week>();

    photos.forEach((photo) => {
      if (photo.weekNumber !== null && photo.year !== null) {
        const key = `${photo.year}-${photo.weekNumber}`;
        if (!weekMap.has(key)) {
          // Calculate start and end dates for the week (simplified)
          const startDate = new Date(photo.year, 0, 1 + (photo.weekNumber - 1) * 7);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6);

          weekMap.set(key, {
            weekNumber: photo.weekNumber,
            year: photo.year,
            startDate,
            endDate,
            photos: [],
            favoriteCount: 0,
          });
        }
        const week = weekMap.get(key)!;
        week.photos.push(photo);
        if (photo.isFavorite) {
          week.favoriteCount++;
        }
      }
    });

    return Array.from(weekMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.weekNumber - b.weekNumber;
    });
  }, [photos]);

  // Filter photos by selected week
  const displayedPhotos = useMemo(() => {
    if (!selectedWeek) return photos;
    return selectedWeek.photos;
  }, [photos, selectedWeek]);

  // Handle lightbox navigation
  const lightboxPhotoIndex = useMemo(() => {
    if (!lightboxPhoto) return -1;
    return displayedPhotos.findIndex((p) => p.id === lightboxPhoto.id);
  }, [lightboxPhoto, displayedPhotos]);

  const handleNextPhoto = () => {
    if (lightboxPhotoIndex < displayedPhotos.length - 1) {
      setLightboxPhoto(displayedPhotos[lightboxPhotoIndex + 1]);
    }
  };

  const handlePreviousPhoto = () => {
    if (lightboxPhotoIndex > 0) {
      setLightboxPhoto(displayedPhotos[lightboxPhotoIndex - 1]);
    }
  };

  const favoriteCount = useMemo(() => {
    return photos.filter((p) => p.isFavorite).length;
  }, [photos]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <Header
        selectedDirectory={selectedDirectory}
        onSelectDirectory={selectDirectory}
        scanProgress={scanProgress}
        photoCount={photos.length}
        favoriteCount={favoriteCount}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {photos.length > 0 && viewMode === 'all' && (
          <WeekSidebar
            weeks={weeks}
            selectedWeek={selectedWeek}
            onSelectWeek={setSelectedWeek}
          />
        )}

        <main className="flex-1 overflow-auto bg-gray-50">
          {!selectedDirectory ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <svg
                  className="mx-auto h-24 w-24 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <h2 className="mt-4 text-xl font-semibold text-gray-900">
                  No folder selected
                </h2>
                <p className="mt-2 text-gray-600">
                  Click "Select Folder" to get started
                </p>
              </div>
            </div>
          ) : loading && photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading photos...</p>
              </div>
            </div>
          ) : (
            <>
              {/* View Toggle */}
              {photos.length > 0 && (
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setViewMode('all');
                        setSelectedWeek(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'all'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>All Photos</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setViewMode('favorites');
                        setSelectedWeek(null);
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        viewMode === 'favorites'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <span>Favorites</span>
                        {favoriteCount > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-white bg-opacity-30 rounded-full text-sm">
                            {favoriteCount}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* View Content */}
              {viewMode === 'all' ? (
                <PhotoGrid
                  photos={displayedPhotos}
                  onToggleFavorite={toggleFavorite}
                  onPhotoClick={setLightboxPhoto}
                />
              ) : (
                <FavoritesSummary
                  weeks={weeks}
                  onPhotoClick={setLightboxPhoto}
                  onToggleFavorite={toggleFavorite}
                  onWeekClick={(week) => {
                    setViewMode('all');
                    setSelectedWeek(week);
                  }}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          onClose={() => setLightboxPhoto(null)}
          onNext={lightboxPhotoIndex < displayedPhotos.length - 1 ? handleNextPhoto : undefined}
          onPrevious={lightboxPhotoIndex > 0 ? handlePreviousPhoto : undefined}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
}

export default App;
