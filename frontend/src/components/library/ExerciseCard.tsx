import { useState, useRef, useEffect } from 'react';
import { Play, Clock, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Exercise } from '@/lib/api';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
}

export function ExerciseCard({ exercise, onEdit, onDelete }: ExerciseCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [_isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Intersection Observer for scroll-triggered autoplay
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !showVideo) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Video is 50% visible - autoplay
            videoElement.play().catch(() => {
              // Autoplay blocked - user interaction needed
            });
            setIsPlaying(true);
          } else {
            // Video scrolled out of view - pause
            videoElement.pause();
            setIsPlaying(false);
          }
        });
      },
      {
        threshold: 0.5, // Trigger when 50% visible
      }
    );

    observer.observe(videoElement);

    return () => {
      observer.disconnect();
    };
  }, [showVideo]);

  const handleThumbnailClick = () => {
    setShowVideo(true);
  };

  const handleVideoClick = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (videoElement.paused) {
      videoElement.play();
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onEdit(exercise);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onDelete(exercise);
  };

  return (
    <div
      className={cn(
        "bg-gray-900 rounded-xl overflow-hidden",
        "transition-all hover:ring-2 hover:ring-blue-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      )}
      tabIndex={0}
      role="article"
      aria-label={exercise.exercise_name}
    >
      {/* Video/Thumbnail */}
      <div className="relative aspect-video bg-gray-800">
        {showVideo ? (
          <video
            ref={videoRef}
            src={exercise.video_url}
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleVideoClick}
            muted
            playsInline
            loop
            aria-label={`Video of ${exercise.exercise_name}`}
          />
        ) : (
          <>
            {exercise.thumbnail_url ? (
              <img
                src={exercise.thumbnail_url}
                alt={exercise.exercise_name}
                className="w-full h-full object-cover cursor-pointer"
                onClick={handleThumbnailClick}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-gray-600 cursor-pointer"
                onClick={handleThumbnailClick}
              >
                <Play className="w-12 h-12" />
              </div>
            )}

            {/* Play overlay on thumbnail */}
            <div
              className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={handleThumbnailClick}
            >
              <div className="bg-blue-600 rounded-full p-3">
                <Play className="w-8 h-8 text-white" fill="white" />
              </div>
            </div>
          </>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(exercise.duration)}
        </div>

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={handleEditClick}
            className="bg-black/80 hover:bg-blue-600 p-2 rounded-full transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Edit exercise"
          >
            <Edit className="w-4 h-4 text-white mx-auto" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="bg-black/80 hover:bg-red-600 p-2 rounded-full transition-colors"
            style={{ minWidth: '44px', minHeight: '44px' }}
            aria-label="Delete exercise"
          >
            <Trash2 className="w-4 h-4 text-white mx-auto" />
          </button>
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
