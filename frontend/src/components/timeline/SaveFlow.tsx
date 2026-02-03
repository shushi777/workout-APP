import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTimelineStore } from '@/stores/timelineStore';
import { saveTimeline } from '@/lib/api';

type SaveStatus = 'idle' | 'confirming' | 'saving' | 'success' | 'error';

export function SaveFlow() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const { videoUrl, cutPoints, segments } = useTimelineStore();

  // Get segments with details
  const segmentsWithDetails = segments.filter(seg => seg.details !== null);
  const canSave = segmentsWithDetails.length > 0;

  const handleSaveClick = () => {
    if (!canSave) return;
    setStatus('confirming');
  };

  const handleConfirm = async () => {
    if (!videoUrl) return;

    setStatus('saving');
    setError(null);

    try {
      // Prepare data for backend
      const data = {
        videoUrl,
        cutPoints,
        segments: segmentsWithDetails.map(seg => ({
          start: seg.start,
          end: seg.end,
          details: seg.details!,
        })),
      };

      const result = await saveTimeline(data);

      if (result.success) {
        setSavedCount(result.saved_count);
        setStatus('success');

        // Navigate to library after 2 seconds
        setTimeout(() => {
          navigate('/library');
        }, 2000);
      } else {
        throw new Error(result.message || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setStatus('error');
    }
  };

  const handleCancel = () => {
    setStatus('idle');
    setError(null);
  };

  const handleRetry = () => {
    setStatus('confirming');
    setError(null);
  };

  return (
    <>
      {/* Save Button */}
      <Button
        onClick={handleSaveClick}
        disabled={!canSave}
        className="flex items-center gap-2"
      >
        <Save className="w-4 h-4" />
        <span>({segmentsWithDetails.length})</span>
        <span>שמור</span>
      </Button>

      {/* Modal Overlay */}
      {status !== 'idle' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full space-y-4 text-center" dir="rtl">
            {/* Confirming State */}
            {status === 'confirming' && (
              <>
                <h3 className="text-xl font-bold text-white">שמירת תרגילים</h3>
                <p className="text-gray-300">
                  האם לשמור {segmentsWithDetails.length} תרגילים למאגר?
                </p>
                <p className="text-sm text-gray-500">
                  הפעולה תחתוך את הוידאו לקטעים נפרדים
                </p>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleConfirm} className="flex-1">
                    שמור
                  </Button>
                  <Button onClick={handleCancel} variant="secondary" className="flex-1">
                    ביטול
                  </Button>
                </div>
              </>
            )}

            {/* Saving State */}
            {status === 'saving' && (
              <>
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
                <h3 className="text-xl font-bold text-white">שומר תרגילים...</h3>
                <p className="text-gray-400">
                  מעבד ושומר את קטעי הוידאו
                </p>
                <p className="text-sm text-gray-500">
                  פעולה זו עשויה לקחת מספר דקות
                </p>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-xl font-bold text-white">נשמר בהצלחה!</h3>
                <p className="text-gray-300">
                  {savedCount} תרגילים נשמרו למאגר
                </p>
                <p className="text-sm text-gray-500">
                  מעביר לספריית התרגילים...
                </p>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-bold text-white">שגיאה בשמירה</h3>
                <p className="text-gray-300">{error}</p>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleRetry} className="flex-1">
                    נסה שוב
                  </Button>
                  <Button onClick={handleCancel} variant="secondary" className="flex-1">
                    סגור
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
