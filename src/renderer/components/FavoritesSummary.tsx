import React, { useMemo } from 'react';
import type { Week, Photo } from '../../shared/types';

interface FavoritesSummaryProps {
  weeks: Week[];
  onPhotoClick: (photo: Photo) => void;
  onToggleFavorite: (id: string) => void;
  onWeekClick?: (week: Week) => void;
}

export function FavoritesSummary({
  weeks,
  onPhotoClick,
  onToggleFavorite,
  onWeekClick,
}: FavoritesSummaryProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const totalWeeks = weeks.length;
    const totalFavorites = weeks.reduce((sum, week) => sum + week.favoriteCount, 0);
    const weeksWithFavorites = weeks.filter((w) => w.favoriteCount > 0).length;
    const weeksWithoutFavorites = totalWeeks - weeksWithFavorites;
    const avgFavoritesPerWeek = totalWeeks > 0 ? totalFavorites / totalWeeks : 0;
    const weeksWithWarning = weeks.filter((w) => w.favoriteCount > 4).length;

    return {
      totalWeeks,
      totalFavorites,
      weeksWithFavorites,
      weeksWithoutFavorites,
      avgFavoritesPerWeek,
      weeksWithWarning,
    };
  }, [weeks]);

  // Filter weeks with favorites for export preview
  const weeksWithFavorites = useMemo(() => {
    return weeks.filter((w) => w.favoriteCount > 0);
  }, [weeks]);

  const formatDateRange = (week: Week) => {
    const start = week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${start} - ${end}`;
  };

  if (stats.totalFavorites === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
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
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            No favorites selected yet
          </h2>
          <p className="mt-2 text-gray-600">
            Start marking your favorite photos by clicking the star icon on any photo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistics Dashboard */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Favorites Summary</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{stats.totalWeeks}</div>
              <div className="text-sm text-gray-600 mt-1">Total Weeks</div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-600">{stats.totalFavorites}</div>
              <div className="text-sm text-gray-600 mt-1">Total Favorites</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{stats.weeksWithFavorites}</div>
              <div className="text-sm text-gray-600 mt-1">Weeks Complete</div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-red-600">{stats.weeksWithoutFavorites}</div>
              <div className="text-sm text-gray-600 mt-1">Weeks Incomplete</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-600">
                {stats.avgFavoritesPerWeek.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg per Week</div>
            </div>

            {stats.weeksWithWarning > 0 && (
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-orange-600">{stats.weeksWithWarning}</div>
                <div className="text-sm text-gray-600 mt-1">Weeks &gt;4 Favs</div>
              </div>
            )}
          </div>
        </div>

        {/* Export Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Export Preview
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({weeksWithFavorites.length} folders will be created)
            </span>
          </h3>

          <div className="space-y-4">
            {weeksWithFavorites.map((week, index) => {
              const folderName = `S${String(index + 1).padStart(2, '0')}`;
              const favPhotos = week.photos.filter((p) => p.isFavorite);

              return (
                <div
                  key={`${week.year}-${week.weekNumber}`}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 text-blue-700 font-mono font-semibold px-3 py-1 rounded">
                        {folderName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Week {week.weekNumber}, {week.year} • {formatDateRange(week)}
                      </div>
                      <div
                        className={`flex items-center text-sm ${
                          week.favoriteCount > 4 ? 'text-orange-600' : 'text-yellow-600'
                        }`}
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        {week.favoriteCount} {week.favoriteCount === 1 ? 'photo' : 'photos'}
                      </div>
                    </div>

                    {onWeekClick && (
                      <button
                        onClick={() => onWeekClick(week)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Week →
                      </button>
                    )}
                  </div>

                  {/* Photo thumbnails */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {favPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group cursor-pointer aspect-square bg-gray-200 rounded overflow-hidden"
                        onClick={() => onPhotoClick(photo)}
                      >
                        <img
                          src={`file://${photo.thumbnailPath}`}
                          alt={photo.filename}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(photo.id);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove from favorites"
                          >
                            <svg
                              className="w-4 h-4 text-yellow-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        </div>

                        {/* Filename on hover */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                          {photo.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Help Text */}
        {stats.weeksWithoutFavorites > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="text-sm font-semibold text-amber-900">
                  {stats.weeksWithoutFavorites} {stats.weeksWithoutFavorites === 1 ? 'week' : 'weeks'} without favorites
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  Consider selecting 2-4 favorite photos for each week to create a complete collection.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
