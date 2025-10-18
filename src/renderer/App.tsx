import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { WeekSidebar } from './components/WeekSidebar';
import { PhotoGrid } from './components/PhotoGrid';
import { Lightbox } from './components/Lightbox';
import { usePhotos } from './hooks/usePhotos';
import type { Week, Photo } from '../shared/types';

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
        {photos.length > 0 && (
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
            <PhotoGrid
              photos={displayedPhotos}
              onToggleFavorite={toggleFavorite}
              onPhotoClick={setLightboxPhoto}
            />
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
