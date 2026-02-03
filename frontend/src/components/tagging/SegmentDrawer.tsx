import { useState, useEffect } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
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

  // Local form state
  const [name, setName] = useState('');
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [removeAudio, setRemoveAudio] = useState(false);

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

  // Video preview URL with Media Fragments
  const previewUrl =
    segment && videoUrl ? `${videoUrl}#t=${segment.start},${segment.end}` : '';

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleClose()}>
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
          {previewUrl && (
            <div className="rounded-lg overflow-hidden bg-black">
              <video
                key={previewUrl} // Force reload when segment changes
                src={previewUrl}
                className="w-full aspect-video object-contain"
                controls
                playsInline
                autoPlay
                muted
              />
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
