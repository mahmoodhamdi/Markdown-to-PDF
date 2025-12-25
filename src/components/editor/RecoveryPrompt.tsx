'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useEditorStore } from '@/stores/editor-store';

/**
 * Component that checks for unsaved content on mount and prompts the user to recover it.
 * Uses Zustand's persist middleware to detect if there's content that wasn't explicitly saved.
 */
export function RecoveryPrompt() {
  const t = useTranslations('editor.recovery');
  const { content, isDirty, lastSaved, setIsDirty } = useEditorStore();
  const hasShownPrompt = useRef(false);

  useEffect(() => {
    // Only show once per mount
    if (hasShownPrompt.current) return;
    hasShownPrompt.current = true;

    // Check if there's unsaved content from a previous session
    // The editor store persists to localStorage, so if isDirty was true when the user left,
    // we should offer to recover or discard
    if (isDirty && content && content.length > 0) {
      const lastEditedText = lastSaved
        ? `${t('lastEdited')}: ${new Date(lastSaved).toLocaleString()}`
        : '';

      toast(t('title'), {
        description: `${t('description')}${lastEditedText ? `\n${lastEditedText}` : ''}`,
        duration: Infinity, // Keep showing until user takes action
        action: {
          label: t('recover'),
          onClick: () => {
            // Content is already loaded from localStorage, just mark as not dirty
            setIsDirty(false);
            toast.success(t('recover'));
          },
        },
        cancel: {
          label: t('discard'),
          onClick: () => {
            // Clear the content and reset state
            useEditorStore.getState().setContent('');
            setIsDirty(false);
          },
        },
      });
    }
  }, [content, isDirty, lastSaved, setIsDirty, t]);

  return null;
}
