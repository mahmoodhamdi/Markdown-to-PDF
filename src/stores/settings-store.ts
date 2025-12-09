import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PageSettings, PageSize, Orientation } from '@/types';
import { defaultPageSettings } from '@/lib/pdf/page-settings';

interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  lineNumbers: boolean;
  minimap: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

interface SettingsState {
  editorSettings: EditorSettings;
  setEditorSettings: (settings: Partial<EditorSettings>) => void;
  pageSettings: PageSettings;
  setPageSettings: (settings: Partial<PageSettings>) => void;
  defaultDocumentTheme: string;
  setDefaultDocumentTheme: (theme: string) => void;
  defaultPageSize: PageSize;
  setDefaultPageSize: (size: PageSize) => void;
  defaultOrientation: Orientation;
  setDefaultOrientation: (orientation: Orientation) => void;
  resetToDefaults: () => void;
}

const defaultEditorSettings: EditorSettings = {
  fontSize: 14,
  fontFamily: 'monospace',
  tabSize: 2,
  wordWrap: true,
  lineNumbers: true,
  minimap: false,
  autoSave: true,
  autoSaveInterval: 30,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      editorSettings: defaultEditorSettings,
      setEditorSettings: (settings) =>
        set((state) => ({
          editorSettings: { ...state.editorSettings, ...settings },
        })),
      pageSettings: defaultPageSettings,
      setPageSettings: (settings) =>
        set((state) => ({
          pageSettings: {
            ...state.pageSettings,
            ...settings,
            margins: {
              ...state.pageSettings.margins,
              ...settings.margins,
            },
            headerFooter: {
              ...state.pageSettings.headerFooter,
              ...settings.headerFooter,
            },
            pageNumbers: {
              ...state.pageSettings.pageNumbers,
              ...settings.pageNumbers,
            },
            watermark: {
              ...state.pageSettings.watermark,
              ...settings.watermark,
            },
          },
        })),
      defaultDocumentTheme: 'github',
      setDefaultDocumentTheme: (theme) => set({ defaultDocumentTheme: theme }),
      defaultPageSize: 'a4',
      setDefaultPageSize: (size) => set({ defaultPageSize: size }),
      defaultOrientation: 'portrait',
      setDefaultOrientation: (orientation) => set({ defaultOrientation: orientation }),
      resetToDefaults: () =>
        set({
          editorSettings: defaultEditorSettings,
          pageSettings: defaultPageSettings,
          defaultDocumentTheme: 'github',
          defaultPageSize: 'a4',
          defaultOrientation: 'portrait',
        }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
