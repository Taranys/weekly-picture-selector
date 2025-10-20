import React, { useState, useEffect } from 'react';
import type { Person, Face, Photo } from '../../shared/types';

interface FaceCluster {
  id: number;
  faces: Face[];
  sampleFaceId: number;
  averageDescriptor: number[];
  personId: number | null;
}

interface PeopleTabProps {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}

export function PeopleTab({ photos, onPhotoClick }: PeopleTabProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [clusters, setClusters] = useState<FaceCluster[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<FaceCluster | null>(null);
  const [isLabeling, setIsLabeling] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [isClustering, setIsClustering] = useState(false);
  const [photoMap, setPhotoMap] = useState<Map<number, Photo>>(new Map());

  useEffect(() => {
    // Create photo map for quick lookups
    const map = new Map<number, Photo>();
    photos.forEach((photo) => {
      map.set(photo.id, photo);
    });
    setPhotoMap(map);
  }, [photos]);

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

  const handleClusterFaces = async () => {
    setIsClustering(true);
    try {
      // Check if there are any faces first
      const allFaces = await window.electronAPI.getAllFaces();

      if (allFaces.length === 0) {
        alert('No faces detected yet!\n\nGo to "All Photos" view and click "Detect Faces" to scan your photos first.');
        setIsClustering(false);
        return;
      }

      const clusterResults = await window.electronAPI.clusterFaces(0.6);

      // Convert cluster results to FaceCluster objects
      const faceClusters: FaceCluster[] = clusterResults.map((cluster, idx) => {
        const clusterFaces = allFaces.filter((face: Face) => cluster.faceIds.includes(face.id));
        return {
          id: idx + 1,
          faces: clusterFaces,
          sampleFaceId: cluster.faceIds[0],
          averageDescriptor: cluster.averageDescriptor,
          personId: clusterFaces[0]?.personId || null,
        };
      });

      setClusters(faceClusters);

      if (faceClusters.length === 0) {
        alert('No face groups found.\n\nThis usually means all detected faces are too different from each other to group together.');
      }
    } catch (error) {
      console.error('Error clustering faces:', error);
      alert('Error clustering faces: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsClustering(false);
    }
  };

  const handleLabelCluster = async (cluster: FaceCluster) => {
    setSelectedCluster(cluster);
    setIsLabeling(true);
    setLabelInput('');
  };

  const handleSaveLabel = async () => {
    if (!selectedCluster || !labelInput.trim()) return;

    try {
      // Create or update person
      const person = await window.electronAPI.createPerson(labelInput.trim(), selectedCluster.sampleFaceId);

      if (person) {
        // Assign all faces in cluster to this person
        for (const face of selectedCluster.faces) {
          await window.electronAPI.assignFaceToPerson(face.id, person.id);
        }

        // Reload people and close dialog
        await loadPeople();
        setIsLabeling(false);
        setSelectedCluster(null);
        setLabelInput('');

        // Update cluster
        await handleClusterFaces();
      }
    } catch (error) {
      console.error('Error saving label:', error);
    }
  };

  const handleViewPersonPhotos = (person: Person) => {
    setSelectedPerson(person);
  };

  const handleDeletePerson = async (person: Person) => {
    if (!confirm(`Delete "${person.name}"? This will unassign all faces but not delete them.`)) {
      return;
    }

    try {
      await window.electronAPI.deletePerson(person.id);
      await loadPeople();
      if (selectedPerson?.id === person.id) {
        setSelectedPerson(null);
      }
    } catch (error) {
      console.error('Error deleting person:', error);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">People</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage detected faces and identify people in your photos
            </p>
          </div>
          <button
            onClick={handleClusterFaces}
            disabled={isClustering}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center space-x-2"
          >
            {isClustering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Clustering...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Group Similar Faces</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Labeled People Section */}
        {people.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Identified People ({people.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors p-4 cursor-pointer group"
                  onClick={() => handleViewPersonPhotos(person)}
                >
                  <div className="aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p className="font-medium text-gray-900 truncate" title={person.name}>
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {person.photoCount} {person.photoCount === 1 ? 'photo' : 'photos'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePerson(person);
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unlabeled Clusters Section */}
        {clusters.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Unlabeled Face Groups ({clusters.filter((c) => !c.personId).length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {clusters
                .filter((cluster) => !cluster.personId)
                .map((cluster) => (
                  <div
                    key={cluster.id}
                    className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors p-4 cursor-pointer"
                    onClick={() => handleLabelCluster(cluster)}
                  >
                    <div className="aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="font-medium text-gray-600 text-center">Unknown Person</p>
                    <p className="text-xs text-gray-600 text-center mt-1">
                      {cluster.faces.length} {cluster.faces.length === 1 ? 'face' : 'faces'}
                    </p>
                    <button className="mt-2 w-full text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Label This Person
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {people.length === 0 && clusters.length === 0 && (
          <div className="text-center py-16">
            <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Faces Detected Yet</h3>
            <p className="text-gray-600 mb-2">
              To get started with face recognition:
            </p>
            <ol className="text-left max-w-md mx-auto space-y-2 mb-6 text-gray-700">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Go to <strong>"All Photos"</strong> view</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Click <strong>"Detect Faces"</strong> button</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Return here and click <strong>"Group Similar Faces"</strong></span>
              </li>
            </ol>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Face detection runs in the background and may take a few minutes depending on the number of photos.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Label Dialog */}
      {isLabeling && selectedCluster && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Identify This Person</h3>
            <p className="text-sm text-gray-600 mb-4">
              This group contains {selectedCluster.faces.length} similar {selectedCluster.faces.length === 1 ? 'face' : 'faces'}.
              What is this person's name?
            </p>
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveLabel()}
              placeholder="Enter person's name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsLabeling(false);
                  setSelectedCluster(null);
                  setLabelInput('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLabel}
                disabled={!labelInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Person Photos View */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">{selectedPerson.name}</h3>
              <button
                onClick={() => setSelectedPerson(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                {selectedPerson.photoCount} {selectedPerson.photoCount === 1 ? 'photo' : 'photos'} with {selectedPerson.name}
              </p>
              {/* Photo grid would go here - implementation depends on how you want to fetch and display person photos */}
              <p className="text-sm text-gray-500 italic">Photo grid coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
