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

// Response type for getTags API
export interface TagsResponse {
  muscle_groups: string[];
  equipment: string[];
}

/**
 * Fetch existing tags (muscle groups and equipment) for autocomplete
 */
export async function getTags(): Promise<TagsResponse> {
  const response = await fetch('/get-tags');
  if (!response.ok) {
    throw new Error('Failed to fetch tags');
  }
  return response.json();
}

// Types for segment details (matches timelineStore SegmentDetails)
export interface SegmentDetails {
  name: string;
  muscleGroups: string[];
  equipment: string[];
  removeAudio: boolean;
}

export interface SaveTimelineSegment {
  start: number;
  end: number;
  details: SegmentDetails;
}

export interface SaveTimelineRequest {
  videoUrl: string;
  cutPoints: Array<{ time: number; type: string; id: string }>;
  segments: SaveTimelineSegment[];
}

export interface SaveTimelineResponse {
  success: boolean;
  saved_count: number;
  message: string;
}

/**
 * Save timeline with cut points and exercise segments to the backend.
 * Backend will cut the video into segments and store them.
 */
export async function saveTimeline(data: SaveTimelineRequest): Promise<SaveTimelineResponse> {
  const response = await fetch('/api/timeline/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save timeline: ${errorText}`);
  }

  return response.json();
}

// Exercise Library API Types and Functions

export interface Exercise {
  id: number;
  video_file_path: string;
  video_url: string;
  exercise_name: string;
  duration: number;
  start_time: number;
  end_time: number;
  remove_audio: boolean;
  thumbnail_url: string | null;
  created_at: string;
  muscle_groups: string[];
  equipment: string[];
}

export interface ExercisesFilters {
  search?: string;
  muscle_groups?: string[];
  equipment?: string[];
  page?: number;
  per_page?: number;
  sort_by?: 'created_at' | 'duration' | 'exercise_name';
  sort_order?: 'asc' | 'desc';
}

export interface PaginationInfo {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ExercisesResponse {
  success: boolean;
  exercises: Exercise[];
  muscle_groups: string[];
  equipment: string[];
  pagination: PaginationInfo;
}

/**
 * Fetch exercises with optional filtering and pagination
 */
export async function fetchExercises(filters: ExercisesFilters = {}): Promise<ExercisesResponse> {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.muscle_groups?.length) params.append('muscle_groups', filters.muscle_groups.join(','));
  if (filters.equipment?.length) params.append('equipment', filters.equipment.join(','));
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.per_page) params.append('per_page', filters.per_page.toString());
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);

  const url = `/api/exercises${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch exercises');
  }

  return response.json();
}

export interface UpdateExerciseRequest {
  exercise_name?: string;
  muscle_groups?: string[];
  equipment?: string[];
  remove_audio?: boolean;
}

export interface UpdateExerciseResponse {
  success: boolean;
  message: string;
  exercise: Exercise;
}

/**
 * Update an existing exercise
 */
export async function updateExercise(
  exerciseId: number,
  data: UpdateExerciseRequest
): Promise<UpdateExerciseResponse> {
  const response = await fetch(`/api/exercises/${exerciseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update exercise: ${errorText}`);
  }

  return response.json();
}

export interface DeleteExerciseResponse {
  success: boolean;
  message: string;
}

/**
 * Delete an exercise
 */
export async function deleteExercise(exerciseId: number): Promise<DeleteExerciseResponse> {
  const response = await fetch(`/api/exercises/${exerciseId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete exercise: ${errorText}`);
  }

  return response.json();
}

// Reprocess Video API Types and Function

export interface ReprocessResponse {
  success: boolean;
  scene_count: number;
  suggested_cuts: number[];
  message?: string;
}

/**
 * Reprocess video with new scene detection settings
 */
export async function reprocessVideo(
  videoPath: string,
  threshold: number,
  minSceneLength: number
): Promise<ReprocessResponse> {
  const params = new URLSearchParams({
    path: videoPath,
    threshold: threshold.toString(),
    min_scene_length: minSceneLength.toString(),
  });

  const response = await fetch(`/reprocess?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to reprocess video');
  }

  return response.json();
}
