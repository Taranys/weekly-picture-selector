import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FavoritesSummary } from './FavoritesSummary';
import type { Week, Photo } from '../../shared/types';

// Helper function to create test photos
const createTestPhoto = (id: string, filename: string, isFavorite: boolean = false): Photo => ({
  id,
  filename,
  path: `/test/${filename}`,
  thumbnailPath: `/test/thumbs/${filename}`,
  captureDate: new Date('2024-01-15'),
  isFavorite,
  weekNumber: 3,
  year: 2024,
  exif: {
    camera: 'Test Camera',
    lens: 'Test Lens',
    iso: 100,
    aperture: 2.8,
    shutterSpeed: '1/100',
    width: 1920,
    height: 1080,
  },
});

// Helper function to create test weeks
const createTestWeek = (
  weekNumber: number,
  year: number,
  photos: Photo[],
  favoriteCount: number
): Week => ({
  weekNumber,
  year,
  startDate: new Date(year, 0, 1 + (weekNumber - 1) * 7),
  endDate: new Date(year, 0, 7 + (weekNumber - 1) * 7),
  photos,
  favoriteCount,
});

describe('FavoritesSummary', () => {
  const mockOnPhotoClick = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnWeekClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty state', () => {
    it('should show empty state when no favorites exist', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', false)], 0),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('No favorites selected yet')).toBeInTheDocument();
      expect(
        screen.getByText('Start marking your favorite photos by clicking the star icon on any photo')
      ).toBeInTheDocument();
    });
  });

  describe('Statistics Dashboard', () => {
    it('should display correct statistics for multiple weeks', () => {
      const weeks = [
        createTestWeek(
          1,
          2024,
          [
            createTestPhoto('1', 'photo1.jpg', true),
            createTestPhoto('2', 'photo2.jpg', true),
            createTestPhoto('3', 'photo3.jpg', false),
          ],
          2
        ),
        createTestWeek(
          2,
          2024,
          [
            createTestPhoto('4', 'photo4.jpg', true),
            createTestPhoto('5', 'photo5.jpg', true),
            createTestPhoto('6', 'photo6.jpg', true),
          ],
          3
        ),
        createTestWeek(3, 2024, [createTestPhoto('7', 'photo7.jpg', false)], 0),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('Favorites Summary')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // Total weeks
      expect(screen.getByText('5')).toBeInTheDocument(); // Total favorites
      expect(screen.getByText('2')).toBeInTheDocument(); // Weeks complete
      expect(screen.getByText('1')).toBeInTheDocument(); // Weeks incomplete
      expect(screen.getByText('1.7')).toBeInTheDocument(); // Avg per week (5/3)
    });

    it('should show warning stat when weeks have >4 favorites', () => {
      const weeks = [
        createTestWeek(
          1,
          2024,
          [
            createTestPhoto('1', 'photo1.jpg', true),
            createTestPhoto('2', 'photo2.jpg', true),
            createTestPhoto('3', 'photo3.jpg', true),
            createTestPhoto('4', 'photo4.jpg', true),
            createTestPhoto('5', 'photo5.jpg', true),
          ],
          5
        ),
        createTestWeek(2, 2024, [createTestPhoto('6', 'photo6.jpg', true)], 1),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('Weeks >4 Favs')).toBeInTheDocument();
    });

    it('should calculate average favorites per week correctly', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1),
        createTestWeek(2, 2024, [createTestPhoto('2', 'photo2.jpg', true)], 1),
        createTestWeek(
          3,
          2024,
          [
            createTestPhoto('3', 'photo3.jpg', true),
            createTestPhoto('4', 'photo4.jpg', true),
          ],
          2
        ),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      // 4 favorites / 3 weeks = 1.3
      expect(screen.getByText('1.3')).toBeInTheDocument();
    });
  });

  describe('Export Preview', () => {
    it('should display folder names in S01, S02 format', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1),
        createTestWeek(3, 2024, [createTestPhoto('2', 'photo2.jpg', true)], 1),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('S01')).toBeInTheDocument();
      expect(screen.getByText('S02')).toBeInTheDocument();
      expect(screen.getByText('Export Preview')).toBeInTheDocument();
      expect(screen.getByText('(2 folders will be created)')).toBeInTheDocument();
    });

    it('should display week information for each folder', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText(/Week 1, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/1 photo/)).toBeInTheDocument();
    });

    it('should only show weeks with favorites in export preview', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1),
        createTestWeek(2, 2024, [createTestPhoto('2', 'photo2.jpg', false)], 0),
        createTestWeek(3, 2024, [createTestPhoto('3', 'photo3.jpg', true)], 1),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('S01')).toBeInTheDocument();
      expect(screen.getByText('S02')).toBeInTheDocument();
      expect(screen.queryByText('S03')).not.toBeInTheDocument();
      expect(screen.getByText('(2 folders will be created)')).toBeInTheDocument();
    });

    it('should display correct photo count with plural/singular', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1),
        createTestWeek(
          2,
          2024,
          [
            createTestPhoto('2', 'photo2.jpg', true),
            createTestPhoto('3', 'photo3.jpg', true),
          ],
          2
        ),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText(/1 photo/)).toBeInTheDocument();
      expect(screen.getByText(/2 photos/)).toBeInTheDocument();
    });
  });

  describe('Photo Interactions', () => {
    it('should call onPhotoClick when clicking a thumbnail', () => {
      const photo = createTestPhoto('1', 'photo1.jpg', true);
      const weeks = [createTestWeek(1, 2024, [photo], 1)];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const thumbnail = screen.getByAltText('photo1.jpg');
      fireEvent.click(thumbnail);

      expect(mockOnPhotoClick).toHaveBeenCalledWith(photo);
    });

    it('should call onToggleFavorite when clicking remove button', () => {
      const photo = createTestPhoto('1', 'photo1.jpg', true);
      const weeks = [createTestWeek(1, 2024, [photo], 1)];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const removeButton = screen.getByTitle('Remove from favorites');
      fireEvent.click(removeButton);

      expect(mockOnToggleFavorite).toHaveBeenCalledWith('1');
      expect(mockOnPhotoClick).not.toHaveBeenCalled();
    });

    it('should display photo thumbnails correctly', () => {
      const photo = createTestPhoto('1', 'photo1.jpg', true);
      const weeks = [createTestWeek(1, 2024, [photo], 1)];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const img = screen.getByAltText('photo1.jpg') as HTMLImageElement;
      expect(img.src).toContain('/test/thumbs/photo1.jpg');
    });
  });

  describe('Week Navigation', () => {
    it('should call onWeekClick when View Week button is clicked', () => {
      const weeks = [createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1)];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
          onWeekClick={mockOnWeekClick}
        />
      );

      const viewWeekButton = screen.getByText('View Week →');
      fireEvent.click(viewWeekButton);

      expect(mockOnWeekClick).toHaveBeenCalledWith(weeks[0]);
    });

    it('should not render View Week button when onWeekClick is not provided', () => {
      const weeks = [createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1)];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.queryByText('View Week →')).not.toBeInTheDocument();
    });
  });

  describe('Warning Banner', () => {
    it('should show warning banner when weeks without favorites exist', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1),
        createTestWeek(2, 2024, [createTestPhoto('2', 'photo2.jpg', false)], 0),
        createTestWeek(3, 2024, [createTestPhoto('3', 'photo3.jpg', false)], 0),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('2 weeks without favorites')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Consider selecting 2-4 favorite photos for each week to create a complete collection.'
        )
      ).toBeInTheDocument();
    });

    it('should not show warning banner when all weeks have favorites', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1),
        createTestWeek(2, 2024, [createTestPhoto('2', 'photo2.jpg', true)], 1),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.queryByText(/weeks without favorites/)).not.toBeInTheDocument();
    });

    it('should use singular "week" when only 1 week without favorites', () => {
      const weeks = [
        createTestWeek(1, 2024, [createTestPhoto('1', 'photo1.jpg', true)], 1),
        createTestWeek(2, 2024, [createTestPhoto('2', 'photo2.jpg', false)], 0),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(screen.getByText('1 week without favorites')).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should apply warning color to weeks with >4 favorites', () => {
      const weeks = [
        createTestWeek(
          1,
          2024,
          [
            createTestPhoto('1', 'photo1.jpg', true),
            createTestPhoto('2', 'photo2.jpg', true),
            createTestPhoto('3', 'photo3.jpg', true),
            createTestPhoto('4', 'photo4.jpg', true),
            createTestPhoto('5', 'photo5.jpg', true),
          ],
          5
        ),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const photoCountElement = screen.getByText(/5 photos/);
      expect(photoCountElement.className).toContain('text-orange-600');
    });

    it('should apply normal color to weeks with ≤4 favorites', () => {
      const weeks = [
        createTestWeek(
          1,
          2024,
          [
            createTestPhoto('1', 'photo1.jpg', true),
            createTestPhoto('2', 'photo2.jpg', true),
          ],
          2
        ),
      ];

      render(
        <FavoritesSummary
          weeks={weeks}
          onPhotoClick={mockOnPhotoClick}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      const photoCountElement = screen.getByText(/2 photos/);
      expect(photoCountElement.className).toContain('text-yellow-600');
    });
  });
});
