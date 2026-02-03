import { Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/lib/api';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-gray-900 rounded-xl overflow-hidden cursor-pointer",
        "transition-all hover:ring-2 hover:ring-blue-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      )}
      tabIndex={0}
      role="button"
      aria-label={`Play ${exercise.exercise_name}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-800 group">
        {exercise.thumbnail_url ? (
          <img
            src={exercise.thumbnail_url}
            alt={exercise.exercise_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <Play className="w-12 h-12" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-blue-600 rounded-full p-3">
            <Play className="w-8 h-8 text-white" fill="white" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(exercise.duration)}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        {/* Exercise name */}
        <h3 className="font-medium text-white text-lg line-clamp-2">
          {exercise.exercise_name}
        </h3>

        {/* Muscle groups */}
        {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {exercise.muscle_groups.map((muscle) => (
              <span
                key={muscle}
                className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded-full"
              >
                {muscle}
              </span>
            ))}
          </div>
        )}

        {/* Equipment */}
        {exercise.equipment && exercise.equipment.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {exercise.equipment.map((equip) => (
              <span
                key={equip}
                className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
              >
                {equip}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
