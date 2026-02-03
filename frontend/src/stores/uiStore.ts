import { create } from 'zustand';

type Tab = 'upload' | 'editor' | 'library';

interface UIState {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  activeTab: 'upload',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
