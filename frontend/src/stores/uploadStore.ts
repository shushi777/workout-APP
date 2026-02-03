import { create } from 'zustand';
import type { ProcessResponse } from '@/lib/api';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';

interface UploadState {
  file: File | null;
  status: UploadStatus;
  progress: number;
  error: string | null;
  result: ProcessResponse | null;
  sharedFile: File | null;

  // Actions
  setFile: (file: File) => void;
  startUpload: () => void;
  updateProgress: (progress: number) => void;
  setProcessing: () => void;
  setComplete: (result: ProcessResponse) => void;
  setError: (error: string) => void;
  reset: () => void;
  setSharedFile: (file: File | null) => void;
}

export const useUploadStore = create<UploadState>()((set) => ({
  file: null,
  status: 'idle',
  progress: 0,
  error: null,
  result: null,
  sharedFile: null,

  setFile: (file) => set({ file, error: null }),
  startUpload: () => set({ status: 'uploading', progress: 0, error: null }),
  updateProgress: (progress) => set({ progress }),
  setProcessing: () => set({ status: 'processing' }),
  setComplete: (result) => set({ status: 'complete', result, progress: 100 }),
  setError: (error) => set({ status: 'error', error }),
  reset: () => set({
    file: null,
    status: 'idle',
    progress: 0,
    error: null,
    result: null,
    sharedFile: null,
  }),
  setSharedFile: (file) => set({ sharedFile: file }),
}));
