import React, { useEffect, useState } from 'react';
import type { Person } from '../../shared/types';

interface FaceFilterProps {
  selectedPeople: number[];
  onSelectPeople: (personIds: number[]) => void;
  filterMode: 'any' | 'only';
  onFilterModeChange: (mode: 'any' | 'only') => void;
}

export function FaceFilter({
  selectedPeople,
  onSelectPeople,
  filterMode,
  onFilterModeChange,
}: FaceFilterProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const allPeople = await window.electronAPI.getAllPeople();
      setPeople(allPeople);
    } catch (error) {
      console.error('Error loading people:', error);
    }
  };

  const togglePerson = (personId: number) => {
    if (selectedPeople.includes(personId)) {
      onSelectPeople(selectedPeople.filter((id) => id !== personId));
    } else {
      onSelectPeople([...selectedPeople, personId]);
    }
  };

  const clearFilters = () => {
    onSelectPeople([]);
  };

  useEffect(() => {
    const handleClick = () => setIsOpen(false);
    if (isOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [isOpen]);

  if (people.length === 0) {
    return null; // Don't show filter if no people identified yet
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
          selectedPeople.length > 0
            ? 'bg-purple-50 border-purple-300 text-purple-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="font-medium">
          {selectedPeople.length === 0
            ? 'Filter by Person'
            : selectedPeople.length === 1
            ? people.find((p) => p.id === selectedPeople[0])?.name || '1 person'
            : `${selectedPeople.length} people`}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 z-50 w-80"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">Filter by People</h3>
              {selectedPeople.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Mode Toggle */}
            {selectedPeople.length > 0 && (
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onFilterModeChange('any')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterMode === 'any'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Any of these
                </button>
                <button
                  onClick={() => onFilterModeChange('only')}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    filterMode === 'only'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Only these
                </button>
              </div>
            )}
          </div>

          {/* People List */}
          <div className="max-h-80 overflow-y-auto py-2">
            {people.map((person) => {
              const isSelected = selectedPeople.includes(person.id);
              return (
                <button
                  key={person.id}
                  onClick={() => togglePerson(person.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-purple-50' : ''
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-purple-600 border-purple-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">{person.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {person.photoCount} {person.photoCount === 1 ? 'photo' : 'photos'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Help Text */}
          {selectedPeople.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              {filterMode === 'any' ? (
                <>
                  <strong>Any of these:</strong> Shows photos with at least one selected person
                </>
              ) : (
                <>
                  <strong>Only these:</strong> Shows photos with only the selected people (no others)
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
