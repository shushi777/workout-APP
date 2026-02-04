import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTimelineStore } from '@/stores/timelineStore';
import { TimelineCanvas, VideoPlayer, SaveFlow } from '@/components/timeline';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getTags } from '@/lib/api';
import { formatTime } from '@/hooks/useCanvasTimeline';
import { cn } from '@/lib/utils';
import { Scissors, Check, X, Trash2 } from 'lucide-react';
import { SegmentDrawer } from '@/components/tagging/SegmentDrawer';

export function EditorPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSingleConfirm, setShowDeleteSingleConfirm] = useState(false);

  // Get URL parameters
  const videoUrl = searchParams.get('video');
  const cutsParam = searchParams.get('cuts');

  // Timeline store
  const {
    videoDuration,
    currentTime,
    segments,
    cutPoints,
    selectedSegmentIndex,
    selectedCutPointId,
    loadVideo,
    addCutPoint,
    deleteCutPoint,
    clearAllCutPoints,
    selectSegment,
    selectCutPoint,
    loadExistingTags,
  } = useTimelineStore();

  // Load video metadata and initialize store
  useEffect(() => {
    if (!videoUrl) return;

    // Create video element to get duration
    const video = document.createElement('video');
    video.src = videoUrl;
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const suggestedCuts = cutsParam
        ? cutsParam.split(',').map((s) => parseFloat(s.trim())).filter((n) => !isNaN(n))
        : [];

      loadVideo(videoUrl, video.duration, suggestedCuts);
    };

    video.onerror = () => {
      console.error('[EditorPage] Failed to load video metadata');
    };

    return () => {
      video.src = '';
    };
  }, [videoUrl, cutsParam, loadVideo]);

  // Load existing tags on mount
  useEffect(() => {
    getTags()
      .then((tags) => {
        loadExistingTags({
          muscleGroups: tags.muscle_groups,
          equipment: tags.equipment,
        });
      })
      .catch((error) => {
        console.error('[EditorPage] Failed to load tags:', error);
      });
  }, [loadExistingTags]);

  // Handle add cut point at current time
  const handleAddCutPoint = () => {
    if (currentTime > 0 && currentTime < videoDuration) {
      addCutPoint(currentTime);
    } else if (videoDuration > 0) {
      // If currentTime is 0, add at 1 second for visibility
      addCutPoint(Math.min(1, videoDuration / 2));
    }
  };

  // If no video URL, show error
  if (!videoUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4" dir="rtl">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">
            לא נבחר וידאו לעריכה
          </p>
          <p className="text-gray-500 mb-6">
            אנא העלה וידאו תחילה מעמוד ההעלאה
          </p>
          <Button
            onClick={() => navigate('/')}
            variant="primary"
          >
            חזרה להעלאה
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">עורך טיימליין</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddCutPoint} variant="secondary" size="sm">
            <Scissors className="w-4 h-4 ml-1" />
            הוסף חיתוך
          </Button>
          {cutPoints.length > 0 && (
            <Button onClick={() => setShowDeleteConfirm(true)} variant="ghost" size="sm">
              <Trash2 className="w-4 h-4 ml-1" />
              מחק הכל
            </Button>
          )}
          <SaveFlow />
        </div>
      </div>

      {/* Status indicator: tagged vs total segments */}
      <div className="text-sm text-gray-400 text-right">
        <span>{segments.filter(s => s.details).length}</span>
        <span> / </span>
        <span>{segments.length}</span>
        <span className="mr-1">סגמנטים מתויגים</span>
      </div>

      {/* Video Player with segment preview */}
      <div className="relative">
        <VideoPlayer />
        {/* Close preview button when segment selected */}
        {selectedSegmentIndex !== null && (
          <button
            onClick={() => selectSegment(null)}
            className="absolute top-2 left-2 z-10 bg-gray-900/80 hover:bg-gray-800 text-white rounded-full p-2 transition-colors"
            aria-label="סגור תצוגה מקדימה"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Timeline Canvas */}
      <TimelineCanvas />

      {/* Segment cards */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-200 mb-2">
          סגמנטים ({segments.length})
        </h2>
        {segments.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-4 text-center text-gray-500">
            אין סגמנטים עדיין. הוסף נקודות חיתוך כדי ליצור סגמנטים.
          </div>
        ) : (
          segments.map((seg, i) => (
            <div
              key={i}
              onClick={() => selectSegment(i)}
              className={cn(
                "bg-gray-800 rounded-lg p-3 text-right cursor-pointer transition-all",
                "border-2",
                selectedSegmentIndex === i
                  ? "ring-2 ring-orange-500 bg-gray-700 border-orange-500"
                  : seg.details
                    ? "border-green-600 hover:border-green-500"
                    : "border-transparent hover:border-gray-600"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {seg.details && (
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-100">
                    סגמנט #{i + 1}
                  </span>
                  <span className="text-gray-400 text-sm mr-2">
                    {formatTime(seg.start)} - {formatTime(seg.end)}
                  </span>
                  <span className="text-gray-500 text-sm mr-2">
                    ({formatTime(seg.end - seg.start)})
                  </span>
                </div>
              </div>
              {seg.details && (
                <div className="mt-2 text-sm text-gray-400">
                  <span className="text-green-400 font-medium">{seg.details.name}</span>
                  {seg.details.muscleGroups.length > 0 && (
                    <span className="mr-2">
                      | {seg.details.muscleGroups.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Debug info - remove in production */}
      {import.meta.env.DEV && (
        <div className="bg-gray-900 rounded-lg p-3 text-xs text-gray-500 font-mono">
          <p>Video: {videoUrl}</p>
          <p>Duration: {formatTime(videoDuration)}</p>
          <p>Current Time: {formatTime(currentTime)}</p>
          <p>Segments: {segments.length}</p>
        </div>
      )}

      {/* Individual Delete FAB - appears when cut point selected */}
      {selectedCutPointId && (
        <div className="fixed bottom-20 right-4 z-50">
          <Button
            onClick={() => setShowDeleteSingleConfirm(true)}
            variant="destructive"
            className="w-14 h-14 rounded-full shadow-lg"
            aria-label="מחק נקודת חיתוך"
          >
            <Trash2 className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Segment Tagging Drawer */}
      <SegmentDrawer />

      {/* Delete Single Cut Point Confirmation Dialog */}
      <Dialog open={showDeleteSingleConfirm} onOpenChange={setShowDeleteSingleConfirm}>
        <DialogContent className="bg-gray-800 border-gray-700" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-gray-100">מחיקת נקודת חיתוך</DialogTitle>
            <DialogDescription className="text-gray-400">
              האם למחוק את נקודת החיתוך הנבחרת?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row-reverse">
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedCutPointId) {
                  deleteCutPoint(selectedCutPointId);
                }
                setShowDeleteSingleConfirm(false);
              }}
            >
              מחק
            </Button>
            <Button variant="secondary" onClick={() => setShowDeleteSingleConfirm(false)}>
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-gray-800 border-gray-700" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-gray-100">מחיקת כל נקודות החיתוך</DialogTitle>
            <DialogDescription className="text-gray-400">
              האם אתה בטוח שברצונך למחוק את כל {cutPoints.length} נקודות החיתוך?
              פעולה זו לא ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row-reverse">
            <Button
              variant="primary"
              onClick={() => {
                clearAllCutPoints();
                setShowDeleteConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              מחק הכל
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
            >
              ביטול
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
