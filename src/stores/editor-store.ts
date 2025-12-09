import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorState {
  content: string;
  setContent: (content: string) => void;
  viewMode: 'editor' | 'preview' | 'split';
  setViewMode: (mode: 'editor' | 'preview' | 'split') => void;
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
  toggleFullscreen: () => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      content: '',
      setContent: (content) => set({ content }),
      viewMode: 'split',
      setViewMode: (viewMode) => set({ viewMode }),
      isFullscreen: false,
      setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        content: state.content,
        viewMode: state.viewMode,
      }),
    }
  )
);
