import { ExerciseCard } from './ExerciseCard';
import type { Exercise } from '@/lib/api';

interface ExerciseGridProps {
  exercises: Exercise[];
  onExerciseClick?: (exercise: Exercise) => void;
}

export function ExerciseGrid({ exercises, onExerciseClick }: ExerciseGridProps) {
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No exercises found</p>
        <p className="text-gray-500 text-sm mt-2">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onClick={() => onExerciseClick?.(exercise)}
        />
      ))}
    </div>
  );
}
