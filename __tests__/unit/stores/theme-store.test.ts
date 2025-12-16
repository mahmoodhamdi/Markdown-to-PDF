import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '@/stores/theme-store';

const getStore = () => useThemeStore.getState();

describe('Theme Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useThemeStore.setState({
      mode: 'system',
      documentTheme: 'github',
      codeTheme: 'github-light',
      customCss: '',
    });
  });

  describe('mode', () => {
    it('should have default mode as system', () => {
      expect(getStore().mode).toBe('system');
    });

    it('should set mode to light', () => {
      getStore().setMode('light');
      expect(getStore().mode).toBe('light');
    });

    it('should set mode to dark', () => {
      getStore().setMode('dark');
      expect(getStore().mode).toBe('dark');
    });

    it('should set mode back to system', () => {
      getStore().setMode('dark');
      getStore().setMode('system');
      expect(getStore().mode).toBe('system');
    });
  });

  describe('documentTheme', () => {
    it('should have default document theme as github', () => {
      expect(getStore().documentTheme).toBe('github');
    });

    it('should set document theme to academic', () => {
      getStore().setDocumentTheme('academic');
      expect(getStore().documentTheme).toBe('academic');
    });

    it('should set document theme to minimal', () => {
      getStore().setDocumentTheme('minimal');
      expect(getStore().documentTheme).toBe('minimal');
    });

    it('should set document theme to dark', () => {
      getStore().setDocumentTheme('dark');
      expect(getStore().documentTheme).toBe('dark');
    });

    it('should set document theme to professional', () => {
      getStore().setDocumentTheme('professional');
      expect(getStore().documentTheme).toBe('professional');
    });
  });

  describe('codeTheme', () => {
    it('should have default code theme as github-light', () => {
      expect(getStore().codeTheme).toBe('github-light');
    });

    it('should set code theme to github-dark', () => {
      getStore().setCodeTheme('github-dark');
      expect(getStore().codeTheme).toBe('github-dark');
    });

    it('should set code theme to monokai', () => {
      getStore().setCodeTheme('monokai');
      expect(getStore().codeTheme).toBe('monokai');
    });

    it('should set code theme to dracula', () => {
      getStore().setCodeTheme('dracula');
      expect(getStore().codeTheme).toBe('dracula');
    });

    it('should set code theme to nord', () => {
      getStore().setCodeTheme('nord');
      expect(getStore().codeTheme).toBe('nord');
    });

    it('should set code theme to one-dark', () => {
      getStore().setCodeTheme('one-dark');
      expect(getStore().codeTheme).toBe('one-dark');
    });

    it('should set code theme to vs-code', () => {
      getStore().setCodeTheme('vs-code');
      expect(getStore().codeTheme).toBe('vs-code');
    });
  });

  describe('customCss', () => {
    it('should have empty custom CSS by default', () => {
      expect(getStore().customCss).toBe('');
    });

    it('should set custom CSS', () => {
      const customCss = 'body { font-size: 16px; }';
      getStore().setCustomCss(customCss);
      expect(getStore().customCss).toBe(customCss);
    });

    it('should update custom CSS', () => {
      getStore().setCustomCss('h1 { color: red; }');
      getStore().setCustomCss('h1 { color: blue; }');
      expect(getStore().customCss).toBe('h1 { color: blue; }');
    });

    it('should clear custom CSS', () => {
      getStore().setCustomCss('body { margin: 0; }');
      getStore().setCustomCss('');
      expect(getStore().customCss).toBe('');
    });
  });

  describe('combined operations', () => {
    it('should handle multiple theme changes', () => {
      getStore().setMode('dark');
      getStore().setDocumentTheme('dark');
      getStore().setCodeTheme('dracula');
      getStore().setCustomCss('.dark { background: #1a1a2e; }');

      expect(getStore().mode).toBe('dark');
      expect(getStore().documentTheme).toBe('dark');
      expect(getStore().codeTheme).toBe('dracula');
      expect(getStore().customCss).toBe('.dark { background: #1a1a2e; }');
    });
  });
});
