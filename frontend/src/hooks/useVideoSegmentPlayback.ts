import { useEffect, useRef } from 'react';

interface Segment {
  start: number;
  end: number;
}

/**
 * Hook for controlling segment playback with automatic looping.
 * Seeks to segment start, optionally plays, and stops at segment end.
 * Includes proper event listener cleanup to prevent memory leaks.
 *
 * @param videoRef - Reference to the video element
 * @param segment - Segment with start/end times
 * @param isActive - Whether segment playback is active
 * @param autoPlay - Whether to auto-play when segment is selected (default: true)
 */
export function useVideoSegmentPlayback(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  segment: Segment | null,
  isActive: boolean,
  autoPlay: boolean = true
) {
  const listenerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !segment || !isActive) return;

    // Seek to segment start
    video.currentTime = segment.start;

    // Auto-play segment only if autoPlay is true
    if (autoPlay) {
      video.play().catch((err) => {
        console.log('[useVideoSegmentPlayback] Auto-play prevented:', err);
      });
    }

    // Create listener to stop at segment end
    const listener = () => {
      // Use >= because timeupdate fires every ~250ms
      // Add small buffer (0.1s) to ensure we catch the end
      if (video.currentTime >= segment.end - 0.1) {
        video.pause();
        video.currentTime = segment.start; // Loop back to start
      }
    };

    // Store listener for cleanup
    listenerRef.current = listener;
    video.addEventListener('timeupdate', listener);

    // Cleanup on unmount or segment change
    return () => {
      if (listenerRef.current) {
        video.removeEventListener('timeupdate', listenerRef.current);
        listenerRef.current = null;
      }
    };
  }, [videoRef, segment?.start, segment?.end, isActive, autoPlay]);
}
