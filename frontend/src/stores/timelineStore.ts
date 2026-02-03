import { create } from 'zustand';

// Types
export interface CutPoint {
  time: number;
  type: 'auto' | 'manual';
  id: string;
}

export interface SegmentDetails {
  name: string;
  muscleGroups: string[];
  equipment: string[];
  removeAudio: boolean;
}

export interface Segment {
  start: number;
  end: number;
  details: SegmentDetails | null;
}

export interface ExistingTags {
  muscleGroups: string[];
  equipment: string[];
}

interface TimelineState {
  // Video
  videoUrl: string | null;
  videoDuration: number;

  // Timeline
  cutPoints: CutPoint[];
  segments: Segment[];
  selectedSegmentIndex: number | null;
  selectedCutPointId: string | null;
  zoomLevel: number; // 0.5 to 3.0, default 1.0

  // Playback
  currentTime: number;
  isPlaying: boolean;

  // Existing tags for autocomplete
  existingTags: ExistingTags;

  // Actions
  loadVideo: (url: string, duration: number, suggestedCuts: number[]) => void;
  addCutPoint: (time: number) => void;
  updateCutPoint: (id: string, newTime: number) => void;
  deleteCutPoint: (id: string) => void;
  clearAllCutPoints: () => void;
  selectCutPoint: (id: string | null) => void;
  selectSegment: (index: number | null) => void;
  updateSegmentDetails: (index: number, details: SegmentDetails | null) => void;
  setCurrentTime: (time: number) => void;
  setPlaying: (playing: boolean) => void;
  setZoomLevel: (level: number) => void;
  loadExistingTags: (tags: ExistingTags) => void;
  reset: () => void;
}

/**
 * Generate segments from cut points and video duration.
 * Preserves existing segment details for overlapping segments (within 1 second tolerance).
 */
function getSegmentsFromCutPoints(
  cutPoints: CutPoint[],
  duration: number,
  existingSegments: Segment[]
): Segment[] {
  if (duration === 0) return [];

  // Sort cut points by time
  const sortedCutPoints = [...cutPoints].sort((a, b) => a.time - b.time);

  // Calculate new segments
  const newSegments: Segment[] = [];

  if (sortedCutPoints.length === 0) {
    // Single segment covering entire duration
    newSegments.push({
      start: 0,
      end: duration,
      details: findMatchingDetails(0, duration, existingSegments),
    });
  } else {
    // First segment: 0 to first cut point
    newSegments.push({
      start: 0,
      end: sortedCutPoints[0].time,
      details: findMatchingDetails(0, sortedCutPoints[0].time, existingSegments),
    });

    // Middle segments: between cut points
    for (let i = 0; i < sortedCutPoints.length - 1; i++) {
      const start = sortedCutPoints[i].time;
      const end = sortedCutPoints[i + 1].time;
      newSegments.push({
        start,
        end,
        details: findMatchingDetails(start, end, existingSegments),
      });
    }

    // Last segment: last cut point to end
    const lastCutPoint = sortedCutPoints[sortedCutPoints.length - 1];
    newSegments.push({
      start: lastCutPoint.time,
      end: duration,
      details: findMatchingDetails(lastCutPoint.time, duration, existingSegments),
    });
  }

  return newSegments;
}

/**
 * Find matching segment details from existing segments.
 * Matches if segment overlaps within 1 second tolerance.
 */
function findMatchingDetails(
  start: number,
  end: number,
  existingSegments: Segment[]
): SegmentDetails | null {
  const TOLERANCE = 1; // 1 second tolerance

  for (const seg of existingSegments) {
    if (seg.details === null) continue;

    // Check if segments overlap within tolerance
    const startMatches = Math.abs(seg.start - start) <= TOLERANCE;
    const endMatches = Math.abs(seg.end - end) <= TOLERANCE;

    // If start and end both match (with tolerance), preserve details
    if (startMatches && endMatches) {
      return seg.details;
    }

    // Also match if significant overlap exists
    const overlap = Math.min(end, seg.end) - Math.max(start, seg.start);
    const segmentDuration = end - start;
    if (overlap > 0 && overlap >= segmentDuration * 0.8) {
      return seg.details;
    }
  }

  return null;
}

const initialState = {
  videoUrl: null,
  videoDuration: 0,
  cutPoints: [],
  segments: [],
  selectedSegmentIndex: null,
  selectedCutPointId: null,
  zoomLevel: 1.0,
  currentTime: 0,
  isPlaying: false,
  existingTags: {
    muscleGroups: [],
    equipment: [],
  },
};

export const useTimelineStore = create<TimelineState>()((set, get) => ({
  ...initialState,

  loadVideo: (url, duration, suggestedCuts) => {
    const cutPoints: CutPoint[] = suggestedCuts.map((time, index) => ({
      time,
      type: 'auto' as const,
      id: `auto_${index}`,
    }));

    const segments = getSegmentsFromCutPoints(cutPoints, duration, []);

    set({
      videoUrl: url,
      videoDuration: duration,
      cutPoints,
      segments,
      selectedSegmentIndex: null,
      selectedCutPointId: null,
      currentTime: 0,
      isPlaying: false,
    });
  },

  addCutPoint: (time) => {
    const { cutPoints, videoDuration, segments } = get();

    // Don't add if too close to start or end
    if (time <= 0.1 || time >= videoDuration - 0.1) return;

    // Don't add if too close to existing cut point (within 0.5s)
    const tooClose = cutPoints.some((cp) => Math.abs(cp.time - time) < 0.5);
    if (tooClose) return;

    const newCutPoint: CutPoint = {
      time,
      type: 'manual',
      id: `manual_${Date.now()}`,
    };

    const newCutPoints = [...cutPoints, newCutPoint].sort((a, b) => a.time - b.time);
    const newSegments = getSegmentsFromCutPoints(newCutPoints, videoDuration, segments);

    set({
      cutPoints: newCutPoints,
      segments: newSegments,
    });
  },

  updateCutPoint: (id, newTime) => {
    const { cutPoints, videoDuration, segments } = get();

    // Clamp time to valid range
    const clampedTime = Math.max(0.1, Math.min(videoDuration - 0.1, newTime));

    const newCutPoints = cutPoints
      .map((cp) => (cp.id === id ? { ...cp, time: clampedTime } : cp))
      .sort((a, b) => a.time - b.time);

    const newSegments = getSegmentsFromCutPoints(newCutPoints, videoDuration, segments);

    set({
      cutPoints: newCutPoints,
      segments: newSegments,
    });
  },

  deleteCutPoint: (id) => {
    const { cutPoints, videoDuration, segments, selectedCutPointId } = get();

    const newCutPoints = cutPoints.filter((cp) => cp.id !== id);
    const newSegments = getSegmentsFromCutPoints(newCutPoints, videoDuration, segments);

    set({
      cutPoints: newCutPoints,
      segments: newSegments,
      selectedCutPointId: selectedCutPointId === id ? null : selectedCutPointId,
    });
  },

  clearAllCutPoints: () => {
    const { videoDuration } = get();

    const newSegments = getSegmentsFromCutPoints([], videoDuration, []);

    set({
      cutPoints: [],
      segments: newSegments,
      selectedCutPointId: null,
    });
  },

  selectCutPoint: (id) => {
    set({ selectedCutPointId: id });
  },

  selectSegment: (index) => {
    set({ selectedSegmentIndex: index });
  },

  updateSegmentDetails: (index, details) => {
    const { segments } = get();

    if (index < 0 || index >= segments.length) return;

    const newSegments = [...segments];
    newSegments[index] = { ...newSegments[index], details };

    set({ segments: newSegments });
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  setPlaying: (playing) => {
    set({ isPlaying: playing });
  },

  setZoomLevel: (level) => {
    // Clamp zoom level between 0.5 and 3.0
    const clampedLevel = Math.max(0.5, Math.min(3.0, level));
    set({ zoomLevel: clampedLevel });
  },

  loadExistingTags: (tags) => {
    set({ existingTags: tags });
  },

  reset: () => {
    set(initialState);
  },
}));
