import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useUploadStore } from '@/stores/uploadStore';
import { uploadVideoWithProgress } from '@/lib/api';
import { DropZone } from '@/components/upload/DropZone';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';

export function UploadPage() {
  const navigate = useNavigate();
  const abortRef = useRef<(() => void) | null>(null);

  const {
    file,
    status,
    progress,
    error,
    result,
    setFile,
    startUpload,
    updateProgress,
    setProcessing,
    setComplete,
    setError,
    reset,
  } = useUploadStore();

  // Navigate to editor when processing completes
  useEffect(() => {
    if (status === 'complete' && result) {
      const url = `/editor?video=${encodeURIComponent(result.video_url)}&cuts=${result.suggested_cuts.join(',')}`;
      navigate(url, { replace: true });
    }
  }, [status, result, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.();
    };
  }, []);

  const handleFileSelect = (file: File) => {
    setFile(file);
  };

  const handleUpload = () => {
    if (!file) return;

    startUpload();
    abortRef.current = uploadVideoWithProgress(
      file,
      { threshold: 27, minSceneLength: 0.6 },
      {
        onProgress: ({ percent }) => {
          if (percent < 100) {
            updateProgress(percent);
          } else {
            setProcessing();
          }
        },
        onComplete: (response) => {
          setComplete(response);
        },
        onError: (error) => {
          setError(error.message);
        },
      }
    );
  };

  const handleCancel = () => {
    abortRef.current?.();
    reset();
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-right">העלאת סרטון</h1>

      {status === 'idle' && (
        <>
          <DropZone onFileSelect={handleFileSelect} onError={setError} />
          {file && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 truncate text-right">{file.name}</p>
              <p className="text-gray-500 text-sm text-right">
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="primary" onClick={handleUpload} className="flex-1">
                  העלה
                </Button>
                <Button variant="ghost" onClick={reset}>
                  ביטול
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {status === 'uploading' && (
        <div className="text-center py-8">
          <ProgressBar value={progress} label="מעלה..." className="mb-4" />
          <Button variant="ghost" onClick={handleCancel}>
            ביטול
          </Button>
        </div>
      )}

      {status === 'processing' && (
        <div className="text-center py-8">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-300">מזהה סצנות...</p>
          <p className="text-gray-500 text-sm mt-2">זה עשוי לקחת כמה שניות</p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <Button variant="primary" onClick={reset}>
            נסה שנית
          </Button>
        </div>
      )}
    </div>
  );
}
