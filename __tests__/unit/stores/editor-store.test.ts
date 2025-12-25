import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from '@/stores/editor-store';

// Helper to get fresh state
const getStore = () => useEditorStore.getState();

describe('Editor Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEditorStore.setState({
      content: '',
      viewMode: 'split',
      isFullscreen: false,
      lastSaved: null,
      saveStatus: 'idle',
      isDirty: false,
      showToc: false,
    });
  });

  describe('content management', () => {
    it('should set content', () => {
      getStore().setContent('# Hello World');
      expect(getStore().content).toBe('# Hello World');
    });

    it('should mark as dirty when content changes', () => {
      getStore().setContent('New content');
      expect(getStore().isDirty).toBe(true);
    });
  });

  describe('view mode', () => {
    it('should set view mode to editor', () => {
      getStore().setViewMode('editor');
      expect(getStore().viewMode).toBe('editor');
    });

    it('should set view mode to preview', () => {
      getStore().setViewMode('preview');
      expect(getStore().viewMode).toBe('preview');
    });

    it('should set view mode to split', () => {
      getStore().setViewMode('split');
      expect(getStore().viewMode).toBe('split');
    });
  });

  describe('fullscreen', () => {
    it('should have initial state as not fullscreen', () => {
      expect(getStore().isFullscreen).toBe(false);
    });

    it('should set fullscreen to true', () => {
      getStore().setIsFullscreen(true);
      expect(getStore().isFullscreen).toBe(true);
    });

    it('should set fullscreen to false', () => {
      getStore().setIsFullscreen(true);
      getStore().setIsFullscreen(false);
      expect(getStore().isFullscreen).toBe(false);
    });

    it('should toggle fullscreen from false to true', () => {
      expect(getStore().isFullscreen).toBe(false);
      getStore().toggleFullscreen();
      expect(getStore().isFullscreen).toBe(true);
    });

    it('should toggle fullscreen from true to false', () => {
      getStore().setIsFullscreen(true);
      getStore().toggleFullscreen();
      expect(getStore().isFullscreen).toBe(false);
    });
  });

  describe('auto-save state', () => {
    it('should set lastSaved timestamp', () => {
      const timestamp = Date.now();
      getStore().setLastSaved(timestamp);
      expect(getStore().lastSaved).toBe(timestamp);
    });

    it('should clear lastSaved', () => {
      getStore().setLastSaved(Date.now());
      getStore().setLastSaved(null);
      expect(getStore().lastSaved).toBe(null);
    });

    it('should set save status to idle', () => {
      getStore().setSaveStatus('idle');
      expect(getStore().saveStatus).toBe('idle');
    });

    it('should set save status to saving', () => {
      getStore().setSaveStatus('saving');
      expect(getStore().saveStatus).toBe('saving');
    });

    it('should set save status to saved', () => {
      getStore().setSaveStatus('saved');
      expect(getStore().saveStatus).toBe('saved');
    });

    it('should set save status to error', () => {
      getStore().setSaveStatus('error');
      expect(getStore().saveStatus).toBe('error');
    });

    it('should set isDirty', () => {
      getStore().setIsDirty(true);
      expect(getStore().isDirty).toBe(true);
      getStore().setIsDirty(false);
      expect(getStore().isDirty).toBe(false);
    });
  });

  describe('state flow', () => {
    it('should handle typical save flow', () => {
      // Initial state
      expect(getStore().isDirty).toBe(false);
      expect(getStore().saveStatus).toBe('idle');

      // User types content
      getStore().setContent('# New content');
      expect(getStore().isDirty).toBe(true);

      // Auto-save starts
      getStore().setSaveStatus('saving');
      expect(getStore().saveStatus).toBe('saving');

      // Save completes
      getStore().setSaveStatus('saved');
      getStore().setLastSaved(Date.now());
      getStore().setIsDirty(false);

      expect(getStore().saveStatus).toBe('saved');
      expect(getStore().isDirty).toBe(false);
      expect(getStore().lastSaved).toBeTruthy();
    });

    it('should handle save error flow', () => {
      getStore().setContent('# Content');
      getStore().setSaveStatus('saving');
      getStore().setSaveStatus('error');

      expect(getStore().saveStatus).toBe('error');
      expect(getStore().isDirty).toBe(true); // Should still be dirty after error
    });
  });

  describe('table of contents', () => {
    it('should set showToc', () => {
      getStore().setShowToc(true);
      expect(getStore().showToc).toBe(true);
      getStore().setShowToc(false);
      expect(getStore().showToc).toBe(false);
    });

    it('should toggle showToc', () => {
      expect(getStore().showToc).toBe(false);
      getStore().toggleToc();
      expect(getStore().showToc).toBe(true);
      getStore().toggleToc();
      expect(getStore().showToc).toBe(false);
    });
  });
});
