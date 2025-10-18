import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekSidebar } from './WeekSidebar';
import type { Week } from '../../shared/types';

const mockWeeks: Week[] = [
  {
    weekNumber: 1,
    year: 2024,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-07'),
    photos: [],
    favoriteCount: 2,
  },
  {
    weekNumber: 2,
    year: 2024,
    startDate: new Date('2024-01-08'),
    endDate: new Date('2024-01-14'),
    photos: [],
    favoriteCount: 5, // More than 4, should show warning
  },
  {
    weekNumber: 1,
    year: 2025,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-07'),
    photos: [],
    favoriteCount: 0,
  },
];

describe('WeekSidebar', () => {
  const mockOnSelectWeek = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render week count', () => {
    render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    expect(screen.getByText('3 weeks')).toBeInTheDocument();
  });

  it('should render "All Photos" button', () => {
    render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    expect(screen.getByText('All Photos')).toBeInTheDocument();
  });

  it('should highlight "All Photos" when no week is selected', () => {
    const { container } = render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    const allPhotosButton = screen.getByText('All Photos').closest('button');
    expect(allPhotosButton).toHaveClass('bg-blue-100', 'text-blue-900');
  });

  it('should call onSelectWeek when "All Photos" is clicked', () => {
    render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={mockWeeks[0]}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    const allPhotosButton = screen.getByText('All Photos');
    fireEvent.click(allPhotosButton);

    expect(mockOnSelectWeek).toHaveBeenCalledWith(null);
  });

  it('should render all weeks', () => {
    render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    // There are two weeks with number 1 (different years), so use getAllByText
    const week1Elements = screen.getAllByText('Week 1');
    expect(week1Elements).toHaveLength(2);
    expect(screen.getByText('Week 2')).toBeInTheDocument();
  });

  it('should show year separators', () => {
    render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  it('should display favorite count for weeks with favorites', () => {
    const { container } = render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    expect(container.textContent).toContain('2'); // Week 1 with 2 favorites
    expect(container.textContent).toContain('5'); // Week 2 with 5 favorites
  });

  it('should show warning color for weeks with >4 favorites', () => {
    const { container } = render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    // Find elements with warning color (orange-600)
    const warningElements = container.querySelectorAll('.text-orange-600');
    expect(warningElements.length).toBeGreaterThan(0);
  });

  it('should call onSelectWeek when a week is clicked', () => {
    render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    const weekButtons = screen.getAllByText(/Week \d+/);
    fireEvent.click(weekButtons[0]);

    expect(mockOnSelectWeek).toHaveBeenCalledWith(mockWeeks[0]);
  });

  it('should highlight selected week', () => {
    render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={mockWeeks[0]}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    const weekButtons = screen.getAllByText(/Week \d+/).map((el) => el.closest('button'));

    // First week should be highlighted
    expect(weekButtons[0]).toHaveClass('bg-blue-100', 'text-blue-900');

    // Other weeks should not be highlighted
    expect(weekButtons[1]).not.toHaveClass('bg-blue-100');
  });

  it('should show date ranges for weeks', () => {
    render(
      <WeekSidebar
        weeks={mockWeeks}
        selectedWeek={null}
        onSelectWeek={mockOnSelectWeek}
      />
    );

    // Check for date range format (e.g., "Jan 1 - Jan 7")
    // There are two weeks starting Jan 1 (different years)
    const jan1Elements = screen.getAllByText(/Jan 1/);
    expect(jan1Elements.length).toBeGreaterThan(0);
  });
});
