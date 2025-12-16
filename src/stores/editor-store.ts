import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface EditorState {
  content: string;
  setContent: (content: string) => void;
  viewMode: 'editor' | 'preview' | 'split';
  setViewMode: (mode: 'editor' | 'preview' | 'split') => void;
  isFullscreen: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
  toggleFullscreen: () => void;
  // Auto-save state
  lastSaved: number | null;
  setLastSaved: (timestamp: number | null) => void;
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      content: '',
      setContent: (content) => set({ content, isDirty: true }),
      viewMode: 'split',
      setViewMode: (viewMode) => set({ viewMode }),
      isFullscreen: false,
      setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
      toggleFullscreen: () => set((state) => ({ isFullscreen: !state.isFullscreen })),
      // Auto-save state
      lastSaved: null,
      setLastSaved: (lastSaved) => set({ lastSaved }),
      saveStatus: 'idle',
      setSaveStatus: (saveStatus) => set({ saveStatus }),
      isDirty: false,
      setIsDirty: (isDirty) => set({ isDirty }),
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        content: state.content,
        viewMode: state.viewMode,
        lastSaved: state.lastSaved,
      }),
    }
  )
);
