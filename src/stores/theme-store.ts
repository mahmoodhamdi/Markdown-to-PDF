import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DocumentTheme, CodeTheme, ThemeMode } from '@/types';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  documentTheme: DocumentTheme;
  setDocumentTheme: (theme: DocumentTheme) => void;
  codeTheme: CodeTheme;
  setCodeTheme: (theme: CodeTheme) => void;
  customCss: string;
  setCustomCss: (css: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
      documentTheme: 'github',
      setDocumentTheme: (documentTheme) => set({ documentTheme }),
      codeTheme: 'github-light',
      setCodeTheme: (codeTheme) => set({ codeTheme }),
      customCss: '',
      setCustomCss: (customCss) => set({ customCss }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
