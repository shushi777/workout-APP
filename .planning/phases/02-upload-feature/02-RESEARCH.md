# Phase 2: Upload Feature - Research

**Researched:** 2026-02-03
**Domain:** React File Upload with Drag-and-Drop, Progress Tracking, and Async State Management
**Confidence:** HIGH

## Summary

This phase implements video file upload with drag-and-drop, progress tracking, and automatic navigation to the Editor tab after processing. The key technical challenges are: (1) implementing drag-and-drop that works on both desktop and mobile, (2) tracking upload progress with XMLHttpRequest (since Fetch API doesn't support upload progress), (3) managing async upload/processing state with Zustand, and (4) programmatic navigation with React Router after processing completes.

The recommended approach uses **react-dropzone** for drag-and-drop handling (well-tested, accessible, TypeScript support) combined with **XMLHttpRequest** for upload progress tracking. Zustand handles the upload state (file, progress, status, error) with simple async actions. After processing completes, `useNavigate` from React Router handles navigation to `/editor` with state (video URL, cuts).

**Primary recommendation:** Use react-dropzone for drop zone UI with XMLHttpRequest for progress tracking. Store upload state in Zustand. Navigate to `/editor?video=...&cuts=...` after processing using React Router's `useNavigate` with `replace: true`.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-dropzone | 14.x | Drag-and-drop file zone | Standard React hook for HTML5 drag-drop, accessible, TypeScript types included |
| XMLHttpRequest | native | Upload with progress | Only option for upload progress tracking (Fetch API doesn't support upload.onprogress) |
| Zustand | 5.x | Upload state management | Already established in Phase 1, simple async actions without middleware |
| React Router | 7.x | Programmatic navigation | Already established in Phase 1, useNavigate hook for post-upload redirect |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| clsx + tailwind-merge | (cn utility) | Conditional styling | Drop zone active/hover/error states |
| lucide-react | 0.562.x | Icons | Upload, video, loading icons |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-dropzone | Native drag-drop API | Native is lighter but lacks file validation, accessibility, edge case handling |
| XMLHttpRequest | Fetch + ReadableStream | Fetch workaround is complex and inconsistent across browsers |
| Zustand | React Query | React Query is better for server state caching; Zustand simpler for upload-specific state |

**Installation:**
```bash
cd frontend
npm install react-dropzone
```

Note: XMLHttpRequest is native (no install needed). Zustand and React Router are already installed from Phase 1.

## Architecture Patterns

### Recommended Project Structure
```
frontend/src/
├── components/
│   ├── ui/
│   │   ├── Button.tsx           # Already exists from Phase 1
│   │   └── ProgressBar.tsx      # NEW: Reusable progress bar
│   └── upload/
│       ├── DropZone.tsx         # NEW: Drag-drop area component
│       ├── FileInfo.tsx         # NEW: Selected file display
│       └── ProcessingStatus.tsx # NEW: Processing status display
├── stores/
│   ├── uiStore.ts               # Already exists from Phase 1
│   └── uploadStore.ts           # NEW: Upload state management
├── lib/
│   ├── utils.ts                 # Already exists from Phase 1
│   └── api.ts                   # NEW: API helpers with XHR upload
├── pages/
│   └── UploadPage.tsx           # UPDATE: Replace placeholder
└── ...
```

### Pattern 1: react-dropzone with Video File Validation
**What:** useDropzone hook configured for video files with validation
**When to use:** Drop zone component that accepts only video files
**Example:**
```typescript
// Source: react-dropzone official docs
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { useCallback } from 'react';

const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/x-matroska': ['.mkv'],
  'video/x-flv': ['.flv'],
  'video/x-ms-wmv': ['.wmv'],
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB (matches Flask config)

function DropZone({ onFileSelect }: { onFileSelect: (file: File) => void }) {
  const onDrop = useCallback<NonNullable<DropzoneOptions['onDrop']>>(
    (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        // Handle validation errors
        const error = rejectedFiles[0].errors[0];
        console.error('File rejected:', error.message);
        return;
      }
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_VIDEO_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
        "transition-colors min-h-[200px] flex flex-col items-center justify-center",
        isDragActive && !isDragReject && "border-blue-500 bg-blue-500/10",
        isDragReject && "border-red-500 bg-red-500/10",
        !isDragActive && "border-gray-700 hover:border-gray-600"
      )}
    >
      <input {...getInputProps()} />
      {/* Content based on state */}
    </div>
  );
}
```

### Pattern 2: XMLHttpRequest with Upload Progress
**What:** Upload function using XHR to track progress
**When to use:** Any file upload requiring progress feedback
**Example:**
```typescript
// Source: MDN XMLHttpRequest, standard pattern for upload progress
export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percent: number;
}

export function uploadVideo(
  file: File,
  options: {
    threshold?: number;
    minSceneLength?: number;
  },
  onProgress: (event: UploadProgressEvent) => void,
  onComplete: (response: ProcessResponse) => void,
  onError: (error: Error) => void
): () => void {
  const xhr = new XMLHttpRequest();

  // Track upload progress
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      onProgress({
        loaded: e.loaded,
        total: e.total,
        percent: Math.round((e.loaded / e.total) * 100),
      });
    }
  };

  // Handle completion
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response = JSON.parse(xhr.responseText);
        onComplete(response);
      } catch {
        onError(new Error('Invalid response from server'));
      }
    } else {
      try {
        const errorData = JSON.parse(xhr.responseText);
        onError(new Error(errorData.error || 'Upload failed'));
      } catch {
        onError(new Error(`Upload failed with status ${xhr.status}`));
      }
    }
  };

  xhr.onerror = () => onError(new Error('Network error during upload'));
  xhr.ontimeout = () => onError(new Error('Upload timed out'));

  // Prepare form data (matches Flask /process endpoint)
  const formData = new FormData();
  formData.append('video', file);
  formData.append('threshold', String(options.threshold ?? 27));
  formData.append('min_scene_length', String(options.minSceneLength ?? 0.6));

  // Send request
  xhr.open('POST', '/process');
  xhr.send(formData);

  // Return abort function
  return () => xhr.abort();
}
```

### Pattern 3: Zustand Upload Store with Async Actions
**What:** Zustand store for upload state with progress, error handling
**When to use:** Managing upload flow state across components
**Example:**
```typescript
// Source: Zustand docs pattern for async actions
import { create } from 'zustand';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface ProcessResponse {
  success: boolean;
  video_url: string;
  suggested_cuts: number[];
  video_duration: number;
  redirect_url: string;
}

interface UploadState {
  // State
  file: File | null;
  status: UploadStatus;
  progress: number; // 0-100
  error: string | null;
  result: ProcessResponse | null;

  // Actions
  setFile: (file: File | null) => void;
  startUpload: () => void;
  setProgress: (progress: number) => void;
  setProcessing: () => void;
  setComplete: (result: ProcessResponse) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  file: null,
  status: 'idle',
  progress: 0,
  error: null,
  result: null,

  setFile: (file) => set({ file, status: 'idle', progress: 0, error: null, result: null }),
  startUpload: () => set({ status: 'uploading', progress: 0, error: null }),
  setProgress: (progress) => set({ progress }),
  setProcessing: () => set({ status: 'processing', progress: 100 }),
  setComplete: (result) => set({ status: 'complete', result }),
  setError: (error) => set({ status: 'error', error }),
  reset: () => set({ file: null, status: 'idle', progress: 0, error: null, result: null }),
}));
```

### Pattern 4: Programmatic Navigation After Upload
**What:** Navigate to Editor tab with video data after processing
**When to use:** After upload completes successfully
**Example:**
```typescript
// Source: React Router docs - useNavigate hook
import { useNavigate } from 'react-router-dom';
import { useUploadStore } from '@/stores/uploadStore';
import { useEffect } from 'react';

function UploadPage() {
  const navigate = useNavigate();
  const { status, result } = useUploadStore();

  useEffect(() => {
    if (status === 'complete' && result) {
      // Navigate to editor with video data
      // Using query params to match existing Flask URL pattern
      const cutsParam = result.suggested_cuts.join(',');
      navigate(`/editor?video=${encodeURIComponent(result.video_url)}&cuts=${cutsParam}`, {
        replace: true, // Prevent back button returning to upload
      });
    }
  }, [status, result, navigate]);

  // ... rest of component
}
```

### Pattern 5: Progress Bar Component
**What:** Reusable progress bar with Tailwind
**When to use:** Upload progress, processing status
**Example:**
```typescript
// Source: Standard accessible progress bar pattern
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  label,
  showPercent = true,
  className
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <div className="flex justify-between mb-1 text-sm">
          <span className="text-gray-400">{label}</span>
          {showPercent && <span className="text-gray-400">{clampedValue}%</span>}
        </div>
      )}
      <div
        className="h-2 bg-gray-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Using Fetch API for upload progress:** Fetch doesn't support upload progress events; use XMLHttpRequest
- **Storing File objects in URL state:** Files are not serializable; keep in Zustand store
- **Polling for progress:** XHR provides real-time progress events; no need to poll
- **Not handling abort:** Always return abort function for upload cancellation
- **Hardcoding file size limits:** Use constants that match Flask's MAX_CONTENT_LENGTH (500MB)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-drop zone | Native HTML5 drag events | react-dropzone | Handles edge cases, file validation, accessibility |
| Upload progress | Fake progress with setInterval | XMLHttpRequest upload.onprogress | Real progress, accurate timing |
| File type detection | Extension parsing | MIME type checking | More reliable, matches server validation |
| Form data construction | Manual multipart encoding | FormData API | Browser handles encoding correctly |

**Key insight:** File upload has many edge cases (drag leave without drop, browser differences, mobile quirks). react-dropzone handles these. Progress tracking requires XHR since Fetch lacks support. Don't fake progress with timers.

## Common Pitfalls

### Pitfall 1: Fetch API Doesn't Support Upload Progress
**What goes wrong:** Progress bar never updates or shows fake values
**Why it happens:** Fetch API only supports download progress (via response.body stream), not upload progress
**How to avoid:** Use XMLHttpRequest with xhr.upload.onprogress event
**Warning signs:** Progress bar jumps from 0 to 100 instantly

### Pitfall 2: react-dropzone Ref Warning
**What goes wrong:** React warning about setting ref on spread props
**Why it happens:** getRootProps() spreads ref prop which conflicts with component refs
**How to avoid:** Don't set ref on elements using getRootProps; use rootRef from useDropzone instead
**Warning signs:** Console warning about ref prop

### Pitfall 3: File Lost After Navigation
**What goes wrong:** Selected file disappears when navigating between tabs
**Why it happens:** File object stored in component state resets on unmount
**How to avoid:** Store file reference in Zustand (persists across route changes)
**Warning signs:** User has to reselect file after clicking away and back

### Pitfall 4: Mobile Tap Not Working
**What goes wrong:** Tapping drop zone doesn't open file picker on mobile
**Why it happens:** Missing input element or click handler not connected
**How to avoid:** Always include hidden input via getInputProps(); touch target must be 44px+
**Warning signs:** Works on desktop, fails on mobile

### Pitfall 5: Large File Upload Timeout
**What goes wrong:** Upload fails for large videos (>100MB)
**Why it happens:** Default timeout too short, no progress feedback makes users think it's stuck
**How to avoid:** Set longer timeout on XHR (or none), show progress, handle timeout gracefully
**Warning signs:** Uploads fail after exactly 2 minutes (default timeout)

### Pitfall 6: CORS Error on Upload
**What goes wrong:** Upload fails with CORS error in development
**Why it happens:** Vite proxy not configured for /process endpoint
**How to avoid:** Already configured in Phase 1 vite.config.ts; verify proxy is active
**Warning signs:** Network error in console mentioning CORS

### Pitfall 7: Processing Status Stuck
**What goes wrong:** UI shows "processing" indefinitely
**Why it happens:** Backend returns success but frontend doesn't transition to complete state
**How to avoid:** Ensure onload handler parses response and calls setComplete
**Warning signs:** Progress shows 100% but status never updates

## Code Examples

### Complete DropZone Component
```typescript
// src/components/upload/DropZone.tsx
import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, Video, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_VIDEO_TYPES = {
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
  'video/x-matroska': ['.mkv'],
  'video/x-flv': ['.flv'],
  'video/x-ms-wmv': ['.wmv'],
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export function DropZone({ onFileSelect, onError, disabled }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (rejectedFiles.length > 0) {
        const error = rejectedFiles[0].errors[0];
        if (error.code === 'file-too-large') {
          onError('File is too large. Maximum size is 500MB.');
        } else if (error.code === 'file-invalid-type') {
          onError('Invalid file type. Please upload MP4, MOV, AVI, or MKV.');
        } else {
          onError(error.message);
        }
        return;
      }
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
        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer",
        "transition-colors min-h-[200px] flex flex-col items-center justify-center",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        isDragActive && !isDragReject && "border-blue-500 bg-blue-500/10",
        isDragReject && "border-red-500 bg-red-500/10",
        !isDragActive && !disabled && "border-gray-700 hover:border-gray-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {isDragReject ? (
        <>
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-red-400 font-medium">Invalid file type</p>
        </>
      ) : isDragActive ? (
        <>
          <Upload className="w-12 h-12 text-blue-500 mb-4 animate-bounce" />
          <p className="text-blue-400 font-medium">Drop the video here</p>
        </>
      ) : (
        <>
          <Video className="w-12 h-12 text-gray-500 mb-4" />
          <p className="text-gray-300 font-medium mb-2">
            Drag and drop a video file
          </p>
          <p className="text-gray-500 text-sm">or tap to select from device</p>
          <p className="text-gray-600 text-xs mt-4">
            MP4, MOV, AVI, MKV (max 500MB)
          </p>
        </>
      )}
    </div>
  );
}
```

### Complete Upload API with Progress
```typescript
// src/lib/api.ts
export interface ProcessResponse {
  success: boolean;
  scene_count: number;
  video_url: string;
  suggested_cuts: number[];
  video_duration: number;
  redirect_url: string;
}

export interface UploadOptions {
  threshold?: number;
  minSceneLength?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export type UploadCallbacks = {
  onProgress: (progress: UploadProgress) => void;
  onComplete: (response: ProcessResponse) => void;
  onError: (error: Error) => void;
};

export function uploadVideoWithProgress(
  file: File,
  options: UploadOptions,
  callbacks: UploadCallbacks
): () => void {
  const { onProgress, onComplete, onError } = callbacks;
  const xhr = new XMLHttpRequest();

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      onProgress({
        loaded: e.loaded,
        total: e.total,
        percent: Math.round((e.loaded / e.total) * 100),
      });
    }
  };

  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response: ProcessResponse = JSON.parse(xhr.responseText);
        if (response.success) {
          onComplete(response);
        } else {
          onError(new Error('Processing failed'));
        }
      } catch {
        onError(new Error('Invalid response from server'));
      }
    } else {
      try {
        const errorData = JSON.parse(xhr.responseText);
        onError(new Error(errorData.error || `Upload failed (${xhr.status})`));
      } catch {
        onError(new Error(`Upload failed with status ${xhr.status}`));
      }
    }
  };

  xhr.onerror = () => onError(new Error('Network error during upload'));
  xhr.ontimeout = () => onError(new Error('Upload timed out'));

  const formData = new FormData();
  formData.append('video', file);
  formData.append('threshold', String(options.threshold ?? 27));
  formData.append('min_scene_length', String(options.minSceneLength ?? 0.6));

  xhr.open('POST', '/process');
  xhr.timeout = 0; // No timeout for large files
  xhr.send(formData);

  return () => xhr.abort();
}
```

### Complete Upload Store
```typescript
// src/stores/uploadStore.ts
import { create } from 'zustand';
import { ProcessResponse } from '@/lib/api';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface UploadState {
  file: File | null;
  status: UploadStatus;
  progress: number;
  error: string | null;
  result: ProcessResponse | null;

  setFile: (file: File | null) => void;
  startUpload: () => void;
  updateProgress: (progress: number) => void;
  setProcessing: () => void;
  setComplete: (result: ProcessResponse) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  file: null,
  status: 'idle',
  progress: 0,
  error: null,
  result: null,

  setFile: (file) => set({
    file,
    status: file ? 'idle' : 'idle',
    progress: 0,
    error: null,
    result: null
  }),

  startUpload: () => set({
    status: 'uploading',
    progress: 0,
    error: null
  }),

  updateProgress: (progress) => set({ progress }),

  setProcessing: () => set({
    status: 'processing',
    progress: 100
  }),

  setComplete: (result) => set({
    status: 'complete',
    result
  }),

  setError: (error) => set({
    status: 'error',
    error
  }),

  reset: () => set({
    file: null,
    status: 'idle',
    progress: 0,
    error: null,
    result: null
  }),
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fetch API for uploads | XMLHttpRequest for progress | Still current | Fetch still lacks upload progress support |
| Redux for upload state | Zustand async actions | 2024+ | Simpler, no middleware needed |
| FormData manual | FormData API | Browser standard | Built-in, no libraries needed |
| File reader for preview | URL.createObjectURL | Browser standard | Faster, no base64 encoding needed |

**Deprecated/outdated:**
- **axios onUploadProgress:** Still works but adds dependency; native XHR is sufficient
- **redux-thunk for async:** Zustand async actions are simpler
- **Fake progress timers:** Real XHR progress is always preferred

## Open Questions

1. **Detection Settings UI**
   - What we know: Existing Flask app has threshold (1-100) and min scene length inputs
   - What's unclear: Should React UI expose these or use defaults?
   - Recommendation: Use defaults initially (threshold: 27, min scene: 0.6s), add settings in future phase if needed

2. **Upload Cancellation**
   - What we know: XHR abort() is available, store has reset()
   - What's unclear: Should we show cancel button during upload?
   - Recommendation: Include cancel button for better UX, especially for large files

3. **Retry Logic**
   - What we know: Network errors can occur, especially on mobile
   - What's unclear: Should we auto-retry or let user manually retry?
   - Recommendation: Manual retry via reset + re-upload is sufficient for v1

## Sources

### Primary (HIGH confidence)
- [react-dropzone GitHub](https://github.com/react-dropzone/react-dropzone) - Official repo with hook API documentation
- [MDN XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API) - upload.onprogress documentation
- [React Router useNavigate](https://reactrouter.com/api/hooks/useNavigate) - Programmatic navigation API
- [Zustand GitHub](https://github.com/pmndrs/zustand) - Async actions pattern

### Secondary (MEDIUM confidence)
- [LogRocket react-dropzone Guide](https://blog.logrocket.com/create-drag-and-drop-component-react-dropzone/) - TypeScript integration patterns
- [BezKoder React Drag Drop Upload](https://www.bezkoder.com/react-drag-drop-file-upload/) - Complete upload flow example
- [Zustand Async Actions Discussion](https://github.com/pmndrs/zustand/discussions/1415) - Best practices for async state

### Tertiary (LOW confidence)
- [XHR vs Fetch Comparison](https://blog.openreplay.com/ajax-battle-xmlhttprequest-vs-fetch/) - Progress tracking limitations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-dropzone is widely adopted, XHR for progress is documented necessity
- Architecture: HIGH - Zustand patterns verified from Phase 1, React Router already working
- Pitfalls: HIGH - XHR requirement for progress is well-documented, common issues catalogued

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - libraries are stable)
