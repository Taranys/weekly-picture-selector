import React, { useState } from 'react';

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);

  const handleSelectDirectory = async () => {
    const directory = await window.electronAPI.selectDirectory();
    if (directory) {
      setSelectedDirectory(directory);
      // TODO: Start scanning photos
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Weekly Picture Selector
          </h1>
          <button
            onClick={handleSelectDirectory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Select Folder
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6">
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
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Selected folder:</p>
              <p className="text-lg font-medium text-gray-900">{selectedDirectory}</p>
            </div>

            <div className="text-center py-8">
              <p className="text-gray-600">Photo scanning will be implemented in the next step...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
