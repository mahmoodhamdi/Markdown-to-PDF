'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { useSettingsStore } from '@/stores/settings-store';

/**
 * Custom hook for auto-saving editor content
 * Uses the editor store's persist middleware for actual storage
 */
export function useAutoSave() {
  const {
    content,
    isDirty,
    setIsDirty,
    saveStatus,
    setSaveStatus,
    setLastSaved,
  } = useEditorStore();

  const { editorSettings } = useSettingsStore();
  const { autoSave, autoSaveInterval } = editorSettings;

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastContentRef = useRef<string>(content);

  /**
   * Perform the save operation
   * Since Zustand persist middleware auto-saves to localStorage,
   * we just need to update the status and timestamp
   */
  const performSave = useCallback(() => {
    if (!isDirty) return;

    setSaveStatus('saving');

    // Simulate a small delay to show saving state
    // The actual save happens automatically via Zustand persist
    setTimeout(() => {
      try {
        // Verify the content was saved to localStorage
        const stored = localStorage.getItem('editor-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.state?.content === content) {
            setSaveStatus('saved');
            setLastSaved(Date.now());
            setIsDirty(false);
            lastContentRef.current = content;

            // Reset to idle after showing "saved" status
            setTimeout(() => {
              setSaveStatus('idle');
            }, 2000);
          }
        }
      } catch (error) {
        console.error('Auto-save error:', error);
        setSaveStatus('error');
        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      }
    }, 100);
  }, [content, isDirty, setIsDirty, setSaveStatus, setLastSaved]);

  /**
   * Schedule a save after the interval
   */
  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, autoSaveInterval * 1000);
  }, [autoSaveInterval, performSave]);

  /**
   * Manual save function
   */
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    performSave();
  }, [performSave]);

  // Effect to handle auto-save
  useEffect(() => {
    if (!autoSave) {
      // Clear any pending save if auto-save is disabled
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      return;
    }

    // Only schedule save if content changed
    if (content !== lastContentRef.current && isDirty) {
      scheduleSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [autoSave, content, isDirty, scheduleSave]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (isDirty && autoSave) {
        // Perform immediate save on unmount
        try {
          const stored = localStorage.getItem('editor-storage');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.state.content = content;
            localStorage.setItem('editor-storage', JSON.stringify(parsed));
          }
        } catch (error) {
          console.error('Save on unmount error:', error);
        }
      }
    };
  }, [isDirty, autoSave, content]);

  return {
    saveStatus,
    saveNow,
    isDirty,
  };
}
