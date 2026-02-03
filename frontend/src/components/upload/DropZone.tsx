import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Video, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Video file types accepted - matches Flask backend configuration
const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/x-matroska': ['.mkv'],
  'video/x-flv': ['.flv'],
  'video/x-ms-wmv': ['.wmv'],
};

// Max file size: 500MB (matches Flask MAX_CONTENT_LENGTH)
const MAX_FILE_SIZE = 500 * 1024 * 1024;

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, onError, disabled }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files with Hebrew error messages
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        const errorCode = rejection.errors?.[0]?.code;

        switch (errorCode) {
          case 'file-too-large':
            onError('הקובץ גדול מדי. מקסימום 500MB');
            break;
          case 'file-invalid-type':
            onError('סוג קובץ לא נתמך. נא להעלות MP4, MOV, AVI או MKV');
            break;
          default:
            onError('שגיאה בבחירת הקובץ. נסה שוב.');
        }
        return;
      }

      // Handle accepted file
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect, onError]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_VIDEO_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        // Base styles
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
        'min-h-[200px] flex flex-col items-center justify-center gap-3',
        // Focus styles
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        // State-based styles
        isDragReject && 'border-red-500 bg-red-500/10',
        isDragActive && !isDragReject && 'border-blue-500 bg-blue-500/10',
        !isDragActive && !isDragReject && 'border-gray-700 hover:border-gray-600',
        // Disabled styles
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />

      {isDragReject ? (
        <>
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-red-400 font-medium">סוג קובץ לא תקין</p>
        </>
      ) : isDragActive ? (
        <>
          <Upload className="w-12 h-12 text-blue-500 animate-bounce" />
          <p className="text-blue-400 font-medium">שחרר את הקובץ כאן</p>
        </>
      ) : (
        <>
          <Video className="w-12 h-12 text-gray-400" />
          <div className="space-y-2">
            <p className="text-lg text-gray-300 font-medium">גרור ושחרר קובץ וידאו</p>
            <p className="text-sm text-gray-400">או הקש לבחירה מהמכשיר</p>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            MP4, MOV, AVI, MKV (עד 500MB)
          </p>
        </>
      )}
    </div>
  );
}
