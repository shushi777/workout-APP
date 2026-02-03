export interface ProcessResponse {
  success: boolean;
  scene_count: number;
  video_url: string;
  suggested_cuts: number[];
  video_duration: number;
  redirect_url: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadOptions {
  threshold?: number;
  minSceneLength?: number;
}

export interface UploadCallbacks {
  onProgress: (progress: UploadProgress) => void;
  onComplete: (response: ProcessResponse) => void;
  onError: (error: Error) => void;
}

export function uploadVideoWithProgress(
  file: File,
  options: UploadOptions = {},
  callbacks: UploadCallbacks
): () => void {
  const { threshold = 27, minSceneLength = 0.6 } = options;
  const { onProgress, onComplete, onError } = callbacks;

  const xhr = new XMLHttpRequest();
  const formData = new FormData();

  formData.append('video', file);
  formData.append('threshold', threshold.toString());
  formData.append('min_scene_length', minSceneLength.toString());

  // Track upload progress
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent,
      });
    }
  };

  // Handle successful response
  xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
      try {
        const response: ProcessResponse = JSON.parse(xhr.responseText);
        onComplete(response);
      } catch (error) {
        onError(new Error('Failed to parse server response'));
      }
    } else {
      onError(new Error(`Upload failed with status ${xhr.status}`));
    }
  };

  // Handle network errors
  xhr.onerror = () => {
    onError(new Error('Network error occurred during upload'));
  };

  // Handle timeout
  xhr.ontimeout = () => {
    onError(new Error('Upload timed out'));
  };

  // Configure and send request
  xhr.timeout = 0; // No timeout for large files
  xhr.open('POST', '/process');
  xhr.send(formData);

  // Return abort function
  return () => xhr.abort();
}
