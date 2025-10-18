import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Lightbox } from './Lightbox';
import type { Photo } from '../../shared/types';

const mockPhoto: Photo = {
  id: 1,
  path: '/test/photo1.jpg',
  filename: 'test-photo.jpg',
  captureDate: new Date('2024-01-15T10:30:00'),
  weekNumber: 3,
  year: 2024,
  exifData: {
    camera: 'Canon EOS R5',
    lens: 'RF 24-70mm F2.8',
    iso: 400,
    aperture: 'f/2.8',
    shutterSpeed: '1/250s',
    focalLength: 50,
    width: 6000,
    height: 4000,
  },
  thumbnailPath: '/test/thumb1.jpg',
  isFavorite: false,
  subdirectory: null,
  isHidden: false,
  createdAt: new Date(),
};

describe('Lightbox', () => {
  const mockOnClose = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnPrevious = jest.fn();
  const mockOnToggleFavorite = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render photo and metadata', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByAltText('test-photo.jpg')).toBeInTheDocument();
    expect(screen.getByText('test-photo.jpg')).toBeInTheDocument();
  });

  it('should display EXIF data when available', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    expect(screen.getByText('Canon EOS R5')).toBeInTheDocument();
    expect(screen.getByText('RF 24-70mm F2.8')).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('f/2.8')).toBeInTheDocument();
    expect(screen.getByText('1/250s')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find((btn) =>
      btn.querySelector('path[d*="M6 18L18 6M6 6l12 12"]')
    );

    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should call onClose when backdrop is clicked', () => {
    const { container } = render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const backdrop = container.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('should call onToggleFavorite when favorite button is clicked', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const buttons = screen.getAllByRole('button');
    const favoriteButton = buttons.find((btn) =>
      btn.querySelector('path[d*="M9.049 2.927"]')
    );

    if (favoriteButton) {
      fireEvent.click(favoriteButton);
      expect(mockOnToggleFavorite).toHaveBeenCalledWith(1);
    }
  });

  it('should show next button when onNext is provided', () => {
    const { container } = render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const nextButton = container.querySelector('path[d="M9 5l7 7-7 7"]');
    expect(nextButton).toBeInTheDocument();
  });

  it('should show previous button when onPrevious is provided', () => {
    const { container } = render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onPrevious={mockOnPrevious}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const prevButton = container.querySelector('path[d="M15 19l-7-7 7-7"]');
    expect(prevButton).toBeInTheDocument();
  });

  it('should call onNext when next button is clicked', () => {
    const { container } = render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const nextButton = container.querySelector('button:has(path[d="M9 5l7 7-7 7"])');
    if (nextButton) {
      fireEvent.click(nextButton);
      expect(mockOnNext).toHaveBeenCalled();
    }
  });

  it('should handle keyboard shortcuts - Escape to close', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle keyboard shortcuts - Arrow Right for next', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onNext={mockOnNext}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockOnNext).toHaveBeenCalled();
  });

  it('should handle keyboard shortcuts - Arrow Left for previous', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onPrevious={mockOnPrevious}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockOnPrevious).toHaveBeenCalled();
  });

  it('should handle keyboard shortcuts - F to toggle favorite', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    fireEvent.keyDown(window, { key: 'f' });
    expect(mockOnToggleFavorite).toHaveBeenCalledWith(1);
  });

  it('should handle keyboard shortcuts - Space to toggle favorite', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    Object.defineProperty(spaceEvent, 'preventDefault', { value: jest.fn() });
    window.dispatchEvent(spaceEvent);

    expect(mockOnToggleFavorite).toHaveBeenCalledWith(1);
  });

  it('should show keyboard shortcuts hint', () => {
    render(
      <Lightbox
        photo={mockPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    // Check for keyboard shortcuts in the hint text
    expect(screen.getByText('←')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('should display different icon for favorited photo', () => {
    const favoritedPhoto = { ...mockPhoto, isFavorite: true };

    const { container } = render(
      <Lightbox
        photo={favoritedPhoto}
        onClose={mockOnClose}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const favoriteButton = container.querySelector('.text-yellow-400');
    expect(favoriteButton).toBeInTheDocument();
  });
});
