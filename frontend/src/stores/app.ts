import { create } from 'zustand';

interface AppState {
  selectedNodeIds: Set<string>;
  keyword: string;
  mobileMenuVisible: boolean;
  setSelectedNodeIds: (nodeIds: Set<string>) => void;
  toggleNodeSelection: (nodeId: string) => void;
  clearNodeSelection: () => void;
  setKeyword: (keyword: string) => void;
  setMobileMenuVisible: (visible: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedNodeIds: new Set(),
  keyword: '',
  mobileMenuVisible: false,
  setSelectedNodeIds: (selectedNodeIds) => set({ selectedNodeIds }),
  toggleNodeSelection: (nodeId) =>
    set((state) => {
      const next = new Set(state.selectedNodeIds);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return { selectedNodeIds: next };
    }),
  clearNodeSelection: () => set({ selectedNodeIds: new Set() }),
  setKeyword: (keyword) => set({ keyword }),
  setMobileMenuVisible: (mobileMenuVisible) => set({ mobileMenuVisible }),
}));