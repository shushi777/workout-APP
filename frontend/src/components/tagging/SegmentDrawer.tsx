import { useState, useEffect, useRef } from 'react';
import { X, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { AutocompleteChips } from './AutocompleteChips';
import { Button } from '@/components/ui/Button';
import { useTimelineStore } from '@/stores/timelineStore';
import { formatTime } from '@/hooks/useCanvasTimeline';

export function SegmentDrawer() {
  const {
    videoUrl,
    segments,
    selectedSegmentIndex,
    existingTags,
    selectSegment,
    updateSegmentDetails,
  } = useTimelineStore();

  const segment =
    selectedSegmentIndex !== null ? segments[selectedSegmentIndex] : null;
  const isOpen = selectedSegmentIndex !== null;

  // Video preview ref and state
  const drawerVideoRef = useRef<HTMLVideoElement>(null);
  const [drawerTime, setDrawerTime] = useState(0);
  const [isDrawerPlaying, setIsDrawerPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Local form state
  const [name, setName] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [removeAudio, setRemoveAudio] = useState(false);

  // Drawer video time tracking and segment boundary enforcement
  useEffect(() => {
    const video = drawerVideoRef.current;
    if (!video || !segment) return;

    const handleTimeUpdate = () => {
      setDrawerTime(video.currentTime);
      // Stop at segment end and loop back to start
      if (video.currentTime >= segment.end - 0.1) {
        video.pause();
        video.currentTime = segment.start;
        setDrawerTime(segment.start);
      }
    };

    const handlePlay = () => setIsDrawerPlaying(true);
    const handlePause = () => setIsDrawerPlaying(false);
    const handleVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    // Initialize time to segment start
    setDrawerTime(segment.start);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [segment]);

  // Load existing details when segment changes
  useEffect(() => {
    if (segment?.details) {
      setName(segment.details.name);
      setMuscleGroups(segment.details.muscleGroups);
      setEquipment(segment.details.equipment);
      setRemoveAudio(segment.details.removeAudio);
    } else {
      setName('');
      setMuscleGroups([]);
      setEquipment([]);
      setRemoveAudio(false);
    }
  }, [segment]);

  const handleClose = () => {
    selectSegment(null);
  };

  const handleSave = () => {
    if (selectedSegmentIndex === null) return;

    if (!name.trim()) {
      alert('Please enter exercise name');
      return;
    }

    updateSegmentDetails(selectedSegmentIndex, {
      name: name.trim(),
      muscleGroups,
      equipment,
      removeAudio,
    });

    handleClose();
  };

  const handleDelete = () => {
    if (selectedSegmentIndex === null) return;

    if (confirm('Delete segment details?')) {
      updateSegmentDetails(selectedSegmentIndex, null);
      handleClose();
    }
  };

  const togglePlayPause = () => {
    const video = drawerVideoRef.current;
    if (!video || !segment) return;

    if (isDrawerPlaying) {
      video.pause();
    } else {
      // Reset to start if at or past segment end
      if (video.currentTime >= segment.end - 0.1) {
        video.currentTime = segment.start;
      }
      video.play();
    }
  };

  // Video preview URL with Media Fragments
  const previewUrl =
    segment && videoUrl ? `${videoUrl}#t=${segment.start},${segment.end}` : '';

  return (
    <Drawer open={isOpen} onOpenChange={(open) => {
      if (!open) {
        const video = drawerVideoRef.current;
        if (video) {
          video.pause();
        }
        handleClose();
      }
    }}>
      <DrawerContent className="bg-gray-900 border-gray-800 max-h-[90vh]">
        <DrawerHeader className="border-b border-gray-800 pb-3">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-white">
              Segment #{selectedSegmentIndex !== null ? selectedSegmentIndex + 1 : ''}
            </DrawerTitle>
            <DrawerClose asChild>
              <button className="rounded-full p-2 hover:bg-gray-800 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </div>
          {segment && (
            <p className="text-sm text-gray-400 mt-1">
              {formatTime(segment.start)} - {formatTime(segment.end)}
              <span className="mr-2">
                (Duration: {formatTime(segment.end - segment.start)})
              </span>
            </p>
          )}
        </DrawerHeader>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* Video Preview */}
          {previewUrl && segment && (
            <div className="rounded-lg overflow-hidden bg-black">
              <video
                ref={drawerVideoRef}
                key={previewUrl} // Force reload when segment changes
                src={previewUrl}
                className="w-full aspect-video object-contain"
                playsInline
                onLoadedMetadata={() => {
                  const video = drawerVideoRef.current;
                  if (!video || !segment) return;

                  video.currentTime = segment.start;
                  video.muted = false;

                  video.play().then(() => {
                    setIsDrawerPlaying(true);  // Sync state immediately after autoplay
                  }).catch(() => {
                    // Browser blocked autoplay with sound - fall back to muted
                    video.muted = true;
                    setIsMuted(true);
                    video.play().then(() => {
                      setIsDrawerPlaying(true);  // Sync state for muted fallback too
                    }).catch(console.error);
                  });
                }}
              />
              {/* Custom Controls - Segment-relative seekbar */}
              <div className="bg-black/80 p-3 flex items-center gap-3">
                <button
                  onClick={togglePlayPause}
                  className="w-11 h-11 flex items-center justify-center rounded-lg
                             bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
                  aria-label={isDrawerPlaying ? 'Pause' : 'Play'}
                >
                  {isDrawerPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
                  )}
                </button>
                <span className="text-white text-sm font-medium min-w-[80px]">
                  {formatTime(Math.max(0, drawerTime - segment.start))} / {formatTime(segment.end - segment.start)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={segment.end > segment.start
                    ? ((drawerTime - segment.start) / (segment.end - segment.start)) * 100
                    : 0}
                  onChange={(e) => {
                    const video = drawerVideoRef.current;
                    if (video && segment) {
                      const progress = parseFloat(e.target.value) / 100;
                      const newTime = segment.start + progress * (segment.end - segment.start);
                      video.currentTime = newTime;
                      setDrawerTime(newTime);
                    }
                  }}
                  dir="ltr"
                  className="flex-1 h-2 bg-white/30 rounded-full appearance-none cursor-pointer
                             [&::-webkit-slider-thumb]:appearance-none
                             [&::-webkit-slider-thumb]:w-5
                             [&::-webkit-slider-thumb]:h-5
                             [&::-webkit-slider-thumb]:rounded-full
                             [&::-webkit-slider-thumb]:bg-blue-500
                             [&::-webkit-slider-thumb]:cursor-pointer
                             [&::-webkit-slider-thumb]:shadow-lg
                             [&::-moz-range-thumb]:w-5
                             [&::-moz-range-thumb]:h-5
                             [&::-moz-range-thumb]:rounded-full
                             [&::-moz-range-thumb]:bg-blue-500
                             [&::-moz-range-thumb]:border-0"
                  aria-label="Seek video"
                />
                <button
                  onClick={() => {
                    const video = drawerVideoRef.current;
                    if (video) {
                      video.muted = !video.muted;
                      setIsMuted(video.muted);
                    }
                  }}
                  className="w-11 h-11 flex items-center justify-center rounded-lg
                             bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-6 h-6 text-white" />
                  ) : (
                    <Volume2 className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Exercise Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Exercise Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Squat, Push-ups..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white
                         placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Muscle Groups */}
          <AutocompleteChips
            label="Muscle Groups"
            placeholder="Type or select muscle group..."
            options={existingTags.muscleGroups}
            value={muscleGroups}
            onChange={setMuscleGroups}
          />

          {/* Equipment */}
          <AutocompleteChips
            label="Equipment"
            placeholder="Type or select equipment..."
            options={existingTags.equipment}
            value={equipment}
            onChange={setEquipment}
          />

          {/* Remove Audio Toggle */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {removeAudio ? (
                <VolumeX className="w-5 h-5 text-gray-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-400" />
              )}
              <span className="text-gray-300">Remove Audio</span>
            </div>
            <button
              type="button"
              onClick={() => setRemoveAudio(!removeAudio)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                removeAudio ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  removeAudio ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-800 p-4 flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Save
          </Button>
          {segment?.details && (
            <Button onClick={handleDelete} variant="destructive">
              Delete
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
