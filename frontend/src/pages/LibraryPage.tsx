import { useEffect, useState } from 'react';
import { useExerciseStore } from '@/stores/exerciseStore';
import { SearchFilters } from '@/components/library/SearchFilters';
import { ExerciseGrid } from '@/components/library/ExerciseGrid';
import type { Exercise } from '@/lib/api';

export function LibraryPage() {
  const {
    exercises,
    allMuscleGroups,
    allEquipment,
    searchQuery,
    selectedMuscleGroups,
    selectedEquipment,
    isLoading,
    error,
    setSearchQuery,
    toggleMuscleGroup,
    toggleEquipment,
    clearFilters,
    fetchExercises,
  } = useExerciseStore();

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // Fetch exercises on mount
  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    // TODO: Open video player modal or navigate to detail page
    console.log('Exercise clicked:', exercise);
  };

  return (
    <div className="p-4 pb-24 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Exercise Library</h1>
        <p className="text-gray-400">
          {isLoading
            ? 'Loading exercises...'
            : `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Search and filters */}
      <div className="mb-6">
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMuscleGroups={selectedMuscleGroups}
          onToggleMuscleGroup={toggleMuscleGroup}
          allMuscleGroups={allMuscleGroups}
          selectedEquipment={selectedEquipment}
          onToggleEquipment={toggleEquipment}
          allEquipment={allEquipment}
          onClearFilters={clearFilters}
        />
      </div>

      {/* Exercise grid */}
      {isLoading && exercises.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading exercises...</p>
        </div>
      ) : (
        <ExerciseGrid exercises={exercises} onExerciseClick={handleExerciseClick} />
      )}
    </div>
  );
}
