import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { WeekSidebar } from './components/WeekSidebar';
import { PhotoGrid } from './components/PhotoGrid';
import { Lightbox } from './components/Lightbox';
import { FavoritesSummary } from './components/FavoritesSummary';
import { SubdirectoryFilter } from './components/SubdirectoryFilter';
import { HiddenItemsManager } from './components/HiddenItemsManager';
import { FaceDetectionDialog } from './components/FaceDetectionDialog';
import { FaceFilter } from './components/FaceFilter';
import { PeopleTab } from './components/PeopleTab';
import { usePhotos } from './hooks/usePhotos';
import type { Week, Photo } from '../shared/types';

type ViewMode = 'all' | 'favorites' | 'people';

function App() {
  const {
    photos,
    loading,
    scanProgress,
    selectedDirectory,
    selectDirectory,
    toggleFavorite,
    loadPhotos: refreshPhotos,
  } = usePhotos();

  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [selectedSubdirectory, setSelectedSubdirectory] = useState<string | null>(null);
  const [showHiddenManager, setShowHiddenManager] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [showFaceDetection, setShowFaceDetection] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);
  const [faceFilterMode, setFaceFilterMode] = useState<'any' | 'only'>('any');

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

  // Load hidden count
  useEffect(() => {
    if (photos.length > 0) {
      const loadHiddenCount = async () => {
        try {
          const count = await window.electronAPI.getHiddenPhotoCount();
          setHiddenCount(count);
        } catch (error) {
          console.error('Error loading hidden count:', error);
        }
      };
      loadHiddenCount();
    }
  }, [photos]);

  // Filtered photos by people (using backend filtering)
  const [peopleFilteredPhotos, setPeopleFilteredPhotos] = useState<Photo[]>([]);
  const [isLoadingPeopleFilter, setIsLoadingPeopleFilter] = useState(false);

  // Load photos filtered by selected people
  useEffect(() => {
    const loadPeopleFilteredPhotos = async () => {
      if (selectedPeople.length === 0) {
        setPeopleFilteredPhotos([]);
        return;
      }

      setIsLoadingPeopleFilter(true);
      try {
        console.log('[People Filter] Loading photos for people:', selectedPeople, 'mode:', faceFilterMode);
        const filteredPhotos = await window.electronAPI.getPhotosByPeople(selectedPeople, faceFilterMode);
        console.log('[People Filter] Loaded', filteredPhotos.length, 'photos');
        setPeopleFilteredPhotos(filteredPhotos);
      } catch (error) {
        console.error('Error loading photos by people:', error);
        setPeopleFilteredPhotos([]);
      } finally {
        setIsLoadingPeopleFilter(false);
      }
    };

    loadPeopleFilteredPhotos();
  }, [selectedPeople, faceFilterMode, photos.length]);

  // Filter photos by subdirectory, selected week, and people
  const displayedPhotos = useMemo(() => {
    let filtered = photos;

    // Filter by people first (if any selected)
    if (selectedPeople.length > 0 && peopleFilteredPhotos.length > 0) {
      const peoplePhotoIds = new Set(peopleFilteredPhotos.map((p) => p.id));
      filtered = photos.filter((p) => peoplePhotoIds.has(p.id));
    }

    // Filter by subdirectory
    if (selectedSubdirectory !== null) {
      filtered = filtered.filter((p) => p.subdirectory === selectedSubdirectory);
    }

    // Filter by selected week
    if (selectedWeek) {
      filtered = filtered.filter(
        (p) => p.weekNumber === selectedWeek.weekNumber && p.year === selectedWeek.year
      );
    }

    return filtered;
  }, [photos, selectedWeek, selectedSubdirectory, selectedPeople, peopleFilteredPhotos]);

  // Handle hiding a photo
  const handleHidePhoto = useCallback(async (photoId: number) => {
    try {
      await window.electronAPI.hidePhoto(photoId);
      await refreshPhotos();
      const count = await window.electronAPI.getHiddenPhotoCount();
      setHiddenCount(count);
    } catch (error) {
      console.error('Error hiding photo:', error);
    }
  }, [refreshPhotos]);

  // Handle hiding a subdirectory
  const handleHideSubdirectory = useCallback(async (subdirectory: string) => {
    if (!confirm(`Are you sure you want to hide all photos in "${subdirectory}"?`)) {
      return;
    }

    try {
      await window.electronAPI.hidePhotosBySubdirectory(subdirectory);
      await refreshPhotos();
      setSelectedSubdirectory(null);
      const count = await window.electronAPI.getHiddenPhotoCount();
      setHiddenCount(count);
    } catch (error) {
      console.error('Error hiding subdirectory:', error);
    }
  }, [refreshPhotos]);

  // Handle photos restored from hidden manager
  const handlePhotosRestored = useCallback(async () => {
    await refreshPhotos();
    const count = await window.electronAPI.getHiddenPhotoCount();
    setHiddenCount(count);
  }, [refreshPhotos]);

  // Handle face detection start
  const handleStartFaceDetection = useCallback(async (settings: any) => {
    try {
      // Load models first if not already loaded
      console.log('[Face Detection] Loading models...');
      const loadResult = await window.electronAPI.loadFaceModels();

      if (!loadResult.success) {
        alert(`Failed to load face detection models:\n${loadResult.error || 'Unknown error'}`);
        return;
      }

      console.log('[Face Detection] Models loaded, starting detection...');

      // Start face detection
      await window.electronAPI.detectFacesInPhotos(photos, settings);
      setShowFaceDetection(false);

      // Automatically switch to People tab after detection completes
      console.log('[Face Detection] Complete! Switching to People tab...');
      setViewMode('people');
    } catch (error) {
      console.error('Error detecting faces:', error);
      alert(`Error detecting faces:\n${error instanceof Error ? error.message : String(error)}`);
    }
  }, [photos]);


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
              {/* View Toggle and Filters */}
              {photos.length > 0 && (
                <div className="bg-white border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
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
                      <button
                        onClick={() => {
                          setViewMode('people');
                          setSelectedWeek(null);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          viewMode === 'people'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>People</span>
                        </div>
                      </button>
                    </div>

                    {/* Filters and Actions */}
                    {viewMode === 'all' && (
                      <div className="flex items-center space-x-3">
                        <SubdirectoryFilter
                          selectedSubdirectory={selectedSubdirectory}
                          onSelectSubdirectory={setSelectedSubdirectory}
                          onHideSubdirectory={handleHideSubdirectory}
                        />

                        <FaceFilter
                          selectedPeople={selectedPeople}
                          onSelectPeople={setSelectedPeople}
                          filterMode={faceFilterMode}
                          onFilterModeChange={setFaceFilterMode}
                        />

                        <button
                          onClick={() => setShowFaceDetection(true)}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Detect Faces</span>
                        </button>

                        {hiddenCount > 0 && (
                          <button
                            onClick={() => setShowHiddenManager(true)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                              />
                            </svg>
                            <span>Hidden ({hiddenCount})</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View Content */}
              {viewMode === 'all' && (
                <PhotoGrid
                  photos={displayedPhotos}
                  onToggleFavorite={toggleFavorite}
                  onPhotoClick={setLightboxPhoto}
                  onHidePhoto={handleHidePhoto}
                />
              )}
              {viewMode === 'favorites' && (
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
              {viewMode === 'people' && (
                <PeopleTab
                  photos={photos}
                  onPhotoClick={setLightboxPhoto}
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

      {/* Hidden Items Manager */}
      {showHiddenManager && (
        <HiddenItemsManager
          onClose={() => setShowHiddenManager(false)}
          onPhotosRestored={handlePhotosRestored}
        />
      )}

      {/* Face Detection Dialog */}
      {showFaceDetection && (
        <FaceDetectionDialog
          isOpen={showFaceDetection}
          onClose={() => setShowFaceDetection(false)}
          onStartDetection={handleStartFaceDetection}
          autoStart={false}
        />
      )}
    </div>
  );
}

export default App;
