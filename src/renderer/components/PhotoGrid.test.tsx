import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhotoGrid } from './PhotoGrid';
import type { Photo } from '../../shared/types';

const mockPhotos: Photo[] = [
  {
    id: 1,
    path: '/test/photo1.jpg',
    filename: 'photo1.jpg',
    captureDate: new Date('2024-01-15'),
    weekNumber: 3,
    year: 2024,
    exifData: null,
    thumbnailPath: '/test/thumb1.jpg',
    isFavorite: false,
    subdirectory: null,
    isHidden: false,
    createdAt: new Date(),
  },
  {
    id: 2,
    path: '/test/photo2.jpg',
    filename: 'photo2.jpg',
    captureDate: new Date('2024-01-16'),
    weekNumber: 3,
    year: 2024,
    exifData: null,
    thumbnailPath: '/test/thumb2.jpg',
    isFavorite: true,
    subdirectory: null,
    isHidden: false,
    createdAt: new Date(),
  },
];

describe('PhotoGrid', () => {
  const mockToggleFavorite = jest.fn();
  const mockPhotoClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render empty state when no photos', () => {
    render(
      <PhotoGrid
        photos={[]}
        onToggleFavorite={mockToggleFavorite}
        onPhotoClick={mockPhotoClick}
      />
    );

    expect(screen.getByText('No photos to display')).toBeInTheDocument();
  });

  it('should render photos in grid', () => {
    render(
      <PhotoGrid
        photos={mockPhotos}
        onToggleFavorite={mockToggleFavorite}
        onPhotoClick={mockPhotoClick}
      />
    );

    expect(screen.getByAltText('photo1.jpg')).toBeInTheDocument();
    expect(screen.getByAltText('photo2.jpg')).toBeInTheDocument();
  });

  it('should show favorite badge for favorited photos', () => {
    const { container } = render(
      <PhotoGrid
        photos={mockPhotos}
        onToggleFavorite={mockToggleFavorite}
        onPhotoClick={mockPhotoClick}
      />
    );

    // Check that only one photo has the favorite ring style
    const favoriteElements = container.querySelectorAll('.ring-4.ring-yellow-400');
    expect(favoriteElements).toHaveLength(1);
  });

  it('should call onPhotoClick when photo is clicked', () => {
    render(
      <PhotoGrid
        photos={mockPhotos}
        onToggleFavorite={mockToggleFavorite}
        onPhotoClick={mockPhotoClick}
      />
    );

    const photo = screen.getByAltText('photo1.jpg');
    fireEvent.click(photo.closest('.aspect-square')!);

    expect(mockPhotoClick).toHaveBeenCalledWith(mockPhotos[0]);
    expect(mockPhotoClick).toHaveBeenCalledTimes(1);
  });

  it('should call onToggleFavorite when favorite button is clicked', () => {
    const { container } = render(
      <PhotoGrid
        photos={mockPhotos}
        onToggleFavorite={mockToggleFavorite}
        onPhotoClick={mockPhotoClick}
      />
    );

    // Find the favorite button (it's in the top-right corner)
    const favoriteButtons = container.querySelectorAll('button');
    fireEvent.click(favoriteButtons[0]);

    expect(mockToggleFavorite).toHaveBeenCalledWith(1);
    expect(mockPhotoClick).not.toHaveBeenCalled(); // Event propagation stopped
  });

  it('should display photo filename on hover info', () => {
    const { container } = render(
      <PhotoGrid
        photos={mockPhotos}
        onToggleFavorite={mockToggleFavorite}
        onPhotoClick={mockPhotoClick}
      />
    );

    expect(container.textContent).toContain('photo1.jpg');
    expect(container.textContent).toContain('photo2.jpg');
  });

  it('should apply different styles to favorited photos', () => {
    const { container } = render(
      <PhotoGrid
        photos={mockPhotos}
        onToggleFavorite={mockToggleFavorite}
        onPhotoClick={mockPhotoClick}
      />
    );

    const photoContainers = container.querySelectorAll('.aspect-square');

    // First photo (not favorite) should not have ring style
    expect(photoContainers[0]).not.toHaveClass('ring-4');

    // Second photo (favorite) should have ring style
    expect(photoContainers[1]).toHaveClass('ring-4', 'ring-yellow-400');
  });
});
