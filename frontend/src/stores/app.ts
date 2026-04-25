import { create } from 'zustand';

interface AppState {
  selectedNodeId?: string;
  keyword: string;
  mobileMenuVisible: boolean;
  setSelectedNodeId: (nodeId?: string) => void;
  setKeyword: (keyword: string) => void;
  setMobileMenuVisible: (visible: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedNodeId: undefined,
  keyword: '',
  mobileMenuVisible: false,
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setKeyword: (keyword) => set({ keyword }),
  setMobileMenuVisible: (mobileMenuVisible) => set({ mobileMenuVisible }),
}));
