import React from 'react';
import type { Week } from '../../shared/types';

interface WeekSidebarProps {
  weeks: Week[];
  selectedWeek: Week | null;
  onSelectWeek: (week: Week | null) => void;
}

export function WeekSidebar({ weeks, selectedWeek, onSelectWeek }: WeekSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Weeks</h2>
        <p className="text-sm text-gray-600">{weeks.length} weeks</p>
      </div>

      <div className="p-2">
        <button
          onClick={() => onSelectWeek(null)}
          className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
            selectedWeek === null
              ? 'bg-blue-100 text-blue-900 font-medium'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
        >
          All Photos
        </button>

        {weeks.map((week, index) => {
          // Show year separator when year changes
          const showYearSeparator = index === 0 || weeks[index - 1].year !== week.year;

          return (
            <React.Fragment key={`${week.year}-${week.weekNumber}`}>
              {showYearSeparator && (
                <div className="px-3 py-2 mt-2 mb-1">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {week.year}
                  </div>
                </div>
              )}
              <button
                onClick={() => onSelectWeek(week)}
                className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                  selectedWeek?.year === week.year && selectedWeek?.weekNumber === week.weekNumber
                    ? 'bg-blue-100 text-blue-900 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Week {week.weekNumber}</div>
                    <div className="text-xs text-gray-500">
                      {week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {week.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{week.photos.length}</span>
                    {week.favoriteCount > 0 && (
                      <span className="flex items-center text-sm text-yellow-600">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {week.favoriteCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </aside>
  );
}
