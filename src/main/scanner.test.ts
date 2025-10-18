import { getWeekNumber } from './scanner';

describe('getWeekNumber', () => {
  it('should calculate week 1 for January 1st, 2024', () => {
    const date = new Date('2024-01-01');
    const result = getWeekNumber(date);
    expect(result.year).toBe(2024);
    expect(result.week).toBe(1);
  });

  it('should calculate week 52 for December 25, 2024', () => {
    const date = new Date('2024-12-25');
    const result = getWeekNumber(date);
    expect(result.year).toBe(2024);
    expect(result.week).toBe(52);
  });

  it('should handle leap years correctly', () => {
    const date = new Date('2024-02-29'); // Leap year
    const result = getWeekNumber(date);
    expect(result.year).toBe(2024);
    expect(result.week).toBeGreaterThan(0);
    expect(result.week).toBeLessThanOrEqual(53);
  });

  it('should handle year boundaries correctly', () => {
    // December 31, 2023 might belong to week 52 or week 1 of 2024
    const date = new Date('2023-12-31');
    const result = getWeekNumber(date);
    expect(result.week).toBeGreaterThan(0);
    expect(result.week).toBeLessThanOrEqual(53);
  });

  it('should consistently calculate the same week for dates in the same week', () => {
    const monday = new Date('2024-01-08'); // Monday of week 2
    const sunday = new Date('2024-01-14'); // Sunday of week 2

    const mondayResult = getWeekNumber(monday);
    const sundayResult = getWeekNumber(sunday);

    expect(mondayResult.week).toBe(sundayResult.week);
    expect(mondayResult.year).toBe(sundayResult.year);
  });

  it('should handle different months correctly', () => {
    const dates = [
      new Date('2024-01-15'),
      new Date('2024-03-15'),
      new Date('2024-06-15'),
      new Date('2024-09-15'),
      new Date('2024-12-15'),
    ];

    dates.forEach((date) => {
      const result = getWeekNumber(date);
      expect(result.year).toBe(2024);
      expect(result.week).toBeGreaterThan(0);
      expect(result.week).toBeLessThanOrEqual(53);
    });
  });
});
