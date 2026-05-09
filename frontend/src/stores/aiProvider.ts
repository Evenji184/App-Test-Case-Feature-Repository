import { create } from 'zustand';

interface AiProviderState {
  selectedProviderId?: string;
  generatedContent: string;
  isGenerating: boolean;
  setSelectedProviderId: (id?: string) => void;
  setGeneratedContent: (content: string) => void;
  setIsGenerating: (generating: boolean) => void;
  reset: () => void;
}

export const useAiProviderStore = create<AiProviderState>((set) => ({
  selectedProviderId: undefined,
  generatedContent: '',
  isGenerating: false,
  setSelectedProviderId: (selectedProviderId) => set({ selectedProviderId }),
  setGeneratedContent: (generatedContent) => set({ generatedContent }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  reset: () => set({ selectedProviderId: undefined, generatedContent: '', isGenerating: false }),
}));
