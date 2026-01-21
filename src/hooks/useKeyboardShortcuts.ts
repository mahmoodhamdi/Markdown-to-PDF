'use client';

import { useEffect, useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';

interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts() {
  const { wrapSelection, insertAtCursor, toggleFullscreen, setViewMode, viewMode, toggleToc } =
    useEditorStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const shortcuts: ShortcutHandler[] = [
        // Formatting shortcuts
        {
          key: 'b',
          ctrl: true,
          action: () => wrapSelection('**'),
          preventDefault: true,
        },
        {
          key: 'i',
          ctrl: true,
          action: () => wrapSelection('_'),
          preventDefault: true,
        },
        {
          key: 'k',
          ctrl: true,
          action: () => wrapSelection('[', '](url)'),
          preventDefault: true,
        },
        {
          key: '`',
          ctrl: true,
          action: () => wrapSelection('`'),
          preventDefault: true,
        },
        // View shortcuts
        {
          key: 'p',
          ctrl: true,
          shift: true,
          action: () => setViewMode(viewMode === 'preview' ? 'editor' : 'preview'),
          preventDefault: true,
        },
        {
          key: '\\',
          ctrl: true,
          action: () => setViewMode(viewMode === 'split' ? 'editor' : 'split'),
          preventDefault: true,
        },
        {
          key: 'Enter',
          ctrl: true,
          shift: true,
          action: () => toggleFullscreen(),
          preventDefault: true,
        },
        {
          key: 't',
          ctrl: true,
          shift: true,
          action: () => toggleToc(),
          preventDefault: true,
        },
        // Heading shortcuts
        {
          key: '1',
          ctrl: true,
          alt: true,
          action: () => insertAtCursor('\n# '),
          preventDefault: true,
        },
        {
          key: '2',
          ctrl: true,
          alt: true,
          action: () => insertAtCursor('\n## '),
          preventDefault: true,
        },
        {
          key: '3',
          ctrl: true,
          alt: true,
          action: () => insertAtCursor('\n### '),
          preventDefault: true,
        },
        // List shortcuts
        {
          key: 'l',
          ctrl: true,
          shift: true,
          action: () => insertAtCursor('\n- '),
          preventDefault: true,
        },
        {
          key: 'o',
          ctrl: true,
          shift: true,
          action: () => insertAtCursor('\n1. '),
          preventDefault: true,
        },
        // Quote and code block
        {
          key: 'q',
          ctrl: true,
          shift: true,
          action: () => insertAtCursor('\n> '),
          preventDefault: true,
        },
        {
          key: 'c',
          ctrl: true,
          alt: true,
          action: () => insertAtCursor('\n```\n\n```'),
          preventDefault: true,
        },
        // Horizontal rule
        {
          key: 'h',
          ctrl: true,
          shift: true,
          action: () => insertAtCursor('\n---\n'),
          preventDefault: true,
        },
      ];

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.action();
          return;
        }
      }
    },
    [wrapSelection, insertAtCursor, toggleFullscreen, setViewMode, viewMode, toggleToc]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
