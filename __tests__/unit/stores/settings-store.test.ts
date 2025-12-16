import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore } from '@/stores/settings-store';

const getStore = () => useSettingsStore.getState();

describe('Settings Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    getStore().resetToDefaults();
  });

  describe('editor settings', () => {
    it('should have default editor settings', () => {
      const settings = getStore().editorSettings;
      expect(settings.fontSize).toBe(14);
      expect(settings.fontFamily).toBe('monospace');
      expect(settings.tabSize).toBe(2);
      expect(settings.wordWrap).toBe(true);
      expect(settings.lineNumbers).toBe(true);
      expect(settings.minimap).toBe(false);
      expect(settings.autoSave).toBe(true);
      expect(settings.autoSaveInterval).toBe(30);
    });

    it('should update fontSize', () => {
      getStore().setEditorSettings({ fontSize: 16 });
      expect(getStore().editorSettings.fontSize).toBe(16);
    });

    it('should update fontFamily', () => {
      getStore().setEditorSettings({ fontFamily: 'Fira Code' });
      expect(getStore().editorSettings.fontFamily).toBe('Fira Code');
    });

    it('should update tabSize', () => {
      getStore().setEditorSettings({ tabSize: 4 });
      expect(getStore().editorSettings.tabSize).toBe(4);
    });

    it('should update wordWrap', () => {
      getStore().setEditorSettings({ wordWrap: false });
      expect(getStore().editorSettings.wordWrap).toBe(false);
    });

    it('should update lineNumbers', () => {
      getStore().setEditorSettings({ lineNumbers: false });
      expect(getStore().editorSettings.lineNumbers).toBe(false);
    });

    it('should update minimap', () => {
      getStore().setEditorSettings({ minimap: true });
      expect(getStore().editorSettings.minimap).toBe(true);
    });

    it('should update autoSave', () => {
      getStore().setEditorSettings({ autoSave: false });
      expect(getStore().editorSettings.autoSave).toBe(false);
    });

    it('should update autoSaveInterval', () => {
      getStore().setEditorSettings({ autoSaveInterval: 60 });
      expect(getStore().editorSettings.autoSaveInterval).toBe(60);
    });

    it('should update multiple settings at once', () => {
      getStore().setEditorSettings({ fontSize: 18, tabSize: 4, minimap: true });
      const settings = getStore().editorSettings;
      expect(settings.fontSize).toBe(18);
      expect(settings.tabSize).toBe(4);
      expect(settings.minimap).toBe(true);
    });
  });

  describe('page settings', () => {
    it('should have default page settings', () => {
      const settings = getStore().pageSettings;
      expect(settings.pageSize).toBe('a4');
      expect(settings.orientation).toBe('portrait');
    });

    it('should update page size', () => {
      getStore().setPageSettings({ pageSize: 'letter' });
      expect(getStore().pageSettings.pageSize).toBe('letter');
    });

    it('should update orientation', () => {
      getStore().setPageSettings({ orientation: 'landscape' });
      expect(getStore().pageSettings.orientation).toBe('landscape');
    });

    it('should update margins', () => {
      getStore().setPageSettings({
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
      });
      const margins = getStore().pageSettings.margins;
      expect(margins.top).toBe(30);
      expect(margins.bottom).toBe(30);
      expect(margins.left).toBe(30);
      expect(margins.right).toBe(30);
    });

    it('should update header footer settings', () => {
      getStore().setPageSettings({
        headerFooter: { showHeader: true, headerText: 'My Header' },
      });
      expect(getStore().pageSettings.headerFooter.showHeader).toBe(true);
      expect(getStore().pageSettings.headerFooter.headerText).toBe('My Header');
    });

    it('should update page numbers settings', () => {
      getStore().setPageSettings({
        pageNumbers: { show: true, position: 'bottom-center' },
      });
      expect(getStore().pageSettings.pageNumbers.show).toBe(true);
      expect(getStore().pageSettings.pageNumbers.position).toBe('bottom-center');
    });

    it('should update watermark settings', () => {
      getStore().setPageSettings({
        watermark: { show: true, text: 'DRAFT', opacity: 0.3 },
      });
      const watermark = getStore().pageSettings.watermark;
      expect(watermark.show).toBe(true);
      expect(watermark.text).toBe('DRAFT');
      expect(watermark.opacity).toBe(0.3);
    });
  });

  describe('default settings', () => {
    it('should have default document theme', () => {
      expect(getStore().defaultDocumentTheme).toBe('github');
    });

    it('should update default document theme', () => {
      getStore().setDefaultDocumentTheme('academic');
      expect(getStore().defaultDocumentTheme).toBe('academic');
    });

    it('should have default page size', () => {
      expect(getStore().defaultPageSize).toBe('a4');
    });

    it('should update default page size', () => {
      getStore().setDefaultPageSize('letter');
      expect(getStore().defaultPageSize).toBe('letter');
    });

    it('should have default orientation', () => {
      expect(getStore().defaultOrientation).toBe('portrait');
    });

    it('should update default orientation', () => {
      getStore().setDefaultOrientation('landscape');
      expect(getStore().defaultOrientation).toBe('landscape');
    });
  });

  describe('reset to defaults', () => {
    it('should reset all settings to defaults', () => {
      // Change various settings
      getStore().setEditorSettings({ fontSize: 20, autoSave: false });
      getStore().setDefaultDocumentTheme('minimal');
      getStore().setDefaultPageSize('letter');
      getStore().setDefaultOrientation('landscape');

      // Reset
      getStore().resetToDefaults();

      // Verify all are reset
      expect(getStore().editorSettings.fontSize).toBe(14);
      expect(getStore().editorSettings.autoSave).toBe(true);
      expect(getStore().defaultDocumentTheme).toBe('github');
      expect(getStore().defaultPageSize).toBe('a4');
      expect(getStore().defaultOrientation).toBe('portrait');
    });
  });
});
