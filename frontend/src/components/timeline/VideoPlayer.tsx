import { useRef, useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { useTimelineStore } from '@/stores/timelineStore';
import { useVideoSegmentPlayback } from '@/hooks/useVideoSegmentPlayback';
import { cn } from '@/lib/utils';
import { formatTime } from '@/hooks/useCanvasTimeline';

/**
 * Custom video player with segment preview functionality.
 * - No native browser controls
 * - Click-to-play/pause with icon animation
 * - Seekbar (LTR direction)
 * - Segment preview indicator
 * - Syncs with timeline store
 */
export function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showIcon, setShowIcon] = useState(false);

  const {
    videoUrl,
    videoDuration,
    currentTime,
    isPlaying,
    selectedSegmentIndex,
    segments,
    setCurrentTime,
    setPlaying,
  } = useTimelineStore();

  // Get selected segment for preview
  const selectedSegment = selectedSegmentIndex !== null
    ? segments[selectedSegmentIndex]
    : null;

  // Use segment playback hook when segment is selected
  // Pass autoPlay: false to prevent auto-play when clicking segment cards
  // User can still manually play/pause via click on video
  useVideoSegmentPlayback(videoRef, selectedSegment, selectedSegmentIndex !== null, false);

  // Sync currentTime with store (when not in segment preview mode)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      // Only update store if not in segment preview mode
      if (selectedSegmentIndex === null) {
        setCurrentTime(video.currentTime);
      }
    };

    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [setCurrentTime, setPlaying, selectedSegmentIndex]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }

    // Show icon animation
    setShowIcon(true);
    setTimeout(() => setShowIcon(false), 800);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || videoDuration === 0) return;

    const newTime = (parseFloat(e.target.value) / 100) * videoDuration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  if (!videoUrl) {
    return (
      <div className="bg-black rounded-xl aspect-video flex items-center justify-center">
        <span className="text-gray-500">Loading video...</span>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-xl overflow-hidden">
      {/* Video */}
      <div
        className="relative aspect-video bg-black cursor-pointer"
        onClick={togglePlayPause}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          playsInline
        />

        {/* Play/Pause Icon Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300",
            showIcon ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="bg-black/60 rounded-full w-20 h-20 flex items-center justify-center">
            {isPlaying ? (
              <Pause className="w-10 h-10 text-white" />
            ) : (
              <Play className="w-10 h-10 text-white ml-1" />
            )}
          </div>
        </div>

        {/* Segment preview indicator */}
        {selectedSegmentIndex !== null && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded">
            תצוגה מקדימה: סגמנט #{selectedSegmentIndex + 1}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gradient-to-b from-black/70 to-black/90 p-3 flex items-center gap-3">
        <div className="text-white text-sm font-medium min-w-[90px] text-center">
          {formatTime(currentTime)} / {formatTime(videoDuration)}
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}
          onChange={handleSeek}
          dir="ltr"
          className="flex-1 h-2 bg-white/30 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
}
