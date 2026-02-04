import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Default values for scene detection settings
export const DEFAULT_THRESHOLD = 27;
export const DEFAULT_MIN_SCENE_LEN = 0.6;

interface SceneDetectorStore {
  // Settings (persisted)
  threshold: number;        // Default: 27, Range: 8-50
  minSceneLen: number;      // Default: 0.6, Range: 0.3-3.0

  // Actions
  setThreshold: (threshold: number) => void;
  setMinSceneLen: (minSceneLen: number) => void;
  resetToDefaults: () => void;
}

export const useSceneDetectorStore = create<SceneDetectorStore>()(
  persist(
    (set) => ({
      // Initial state with defaults
      threshold: DEFAULT_THRESHOLD,
      minSceneLen: DEFAULT_MIN_SCENE_LEN,

      // Actions
      setThreshold: (threshold) => set({ threshold }),
      setMinSceneLen: (minSceneLen) => set({ minSceneLen }),
      resetToDefaults: () => set({
        threshold: DEFAULT_THRESHOLD,
        minSceneLen: DEFAULT_MIN_SCENE_LEN,
      }),
    }),
    {
      name: 'scene-detector-settings',
      partialize: (state) => ({
        threshold: state.threshold,
        minSceneLen: state.minSceneLen,
      }),
    }
  )
);
