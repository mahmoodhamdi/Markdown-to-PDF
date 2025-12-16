import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { editor } from 'monaco-editor';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type MonacoEditor = editor.IStandaloneCodeEditor;

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
  // TOC state
  showToc: boolean;
  setShowToc: (show: boolean) => void;
  toggleToc: () => void;
  // Editor instance
  editorInstance: MonacoEditor | null;
  setEditorInstance: (editor: MonacoEditor | null) => void;
  insertAtCursor: (text: string) => void;
  wrapSelection: (before: string, after?: string) => void;
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
      // TOC state
      showToc: false,
      setShowToc: (showToc) => set({ showToc }),
      toggleToc: () => set((state) => ({ showToc: !state.showToc })),
      // Editor instance
      editorInstance: null,
      setEditorInstance: (editorInstance) => set({ editorInstance }),
      insertAtCursor: (text) => {
        const { editorInstance, content, setContent } = useEditorStore.getState();
        if (!editorInstance) {
          // Fallback: append to content
          set({ content: content + text, isDirty: true });
          return;
        }
        const selection = editorInstance.getSelection();
        if (!selection) {
          set({ content: content + text, isDirty: true });
          return;
        }
        editorInstance.executeEdits('toolbar', [
          {
            range: selection,
            text,
            forceMoveMarkers: true,
          },
        ]);
        editorInstance.focus();
      },
      wrapSelection: (before, after = before) => {
        const { editorInstance, content } = useEditorStore.getState();
        if (!editorInstance) {
          // Fallback: append to content
          set({ content: content + before + after, isDirty: true });
          return;
        }
        const selection = editorInstance.getSelection();
        const model = editorInstance.getModel();
        if (!selection || !model) {
          set({ content: content + before + after, isDirty: true });
          return;
        }
        const selectedText = model.getValueInRange(selection);
        const newText = before + selectedText + after;
        editorInstance.executeEdits('toolbar', [
          {
            range: selection,
            text: newText,
            forceMoveMarkers: true,
          },
        ]);
        // Move cursor to after the inserted text if no selection
        if (selectedText === '') {
          const newPosition = {
            lineNumber: selection.startLineNumber,
            column: selection.startColumn + before.length,
          };
          editorInstance.setPosition(newPosition);
        }
        editorInstance.focus();
      },
    }),
    {
      name: 'editor-storage',
      partialize: (state) => ({
        content: state.content,
        viewMode: state.viewMode,
        lastSaved: state.lastSaved,
        showToc: state.showToc,
      }),
    }
  )
);
