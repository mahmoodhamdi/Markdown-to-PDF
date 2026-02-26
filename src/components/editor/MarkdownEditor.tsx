'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Editor, { OnMount } from '@monaco-editor/react';
import { useEditorStore, MonacoEditor } from '@/stores/editor-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useThemeStore } from '@/stores/theme-store';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function insertImageAtCursor(editor: MonacoEditor, markdown: string) {
  const position = editor.getPosition();
  if (!position) return;

  const model = editor.getModel();
  if (!model) return;

  // If cursor is not at the start of a line, prepend a newline
  const lineContent = model.getLineContent(position.lineNumber);
  const prefix = lineContent.length > 0 && position.column > 1 ? '\n' : '';

  const range = {
    startLineNumber: position.lineNumber,
    startColumn: position.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  };

  editor.executeEdits('image-drop', [
    { range, text: prefix + markdown + '\n', forceMoveMarkers: true },
  ]);
  editor.focus();
}

async function processImageFiles(files: File[], editor: MonacoEditor) {
  const imageFiles = Array.from(files).filter((f) => IMAGE_MIME_TYPES.includes(f.type));
  if (imageFiles.length === 0) return;

  for (const file of imageFiles) {
    if (file.size > MAX_IMAGE_SIZE) {
      console.warn(`Image "${file.name}" exceeds 5MB limit, skipping.`);
      continue;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const name = file.name.replace(/\.[^.]+$/, '') || 'image';
      insertImageAtCursor(editor, `![${name}](${dataUrl})`);
    } catch (err) {
      console.error('Failed to read image file:', err);
    }
  }
}

interface MarkdownEditorProps {
  className?: string;
}

export function MarkdownEditor({ className }: MarkdownEditorProps) {
  const t = useTranslations('editor');
  const { content, setContent, setEditorInstance } = useEditorStore();
  const { editorSettings } = useSettingsStore();
  const { mode } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<MonacoEditor | null>(null);

  // Initialize auto-save and keyboard shortcuts
  useAutoSave();
  useKeyboardShortcuts();

  useEffect(() => {
    setMounted(true);
    // Clean up editor instance on unmount
    return () => {
      setEditorInstance(null);
    };
  }, [setEditorInstance]);

  // Set up drag-drop and paste handlers on the editor DOM
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const domNode = editor.getDomNode();
    if (!domNode) return;

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) {
          e.dataTransfer.dropEffect = 'copy';
        }
      }
    };

    const handleDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const hasImages = Array.from(files).some((f) => IMAGE_MIME_TYPES.includes(f.type));
      if (!hasImages) return;

      e.preventDefault();
      e.stopPropagation();
      processImageFiles(Array.from(files), editor);
    };

    const handlePaste = (e: ClipboardEvent) => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;

      const hasImages = Array.from(files).some((f) => IMAGE_MIME_TYPES.includes(f.type));
      if (!hasImages) return;

      e.preventDefault();
      e.stopPropagation();
      processImageFiles(Array.from(files), editor);
    };

    domNode.addEventListener('dragover', handleDragOver);
    domNode.addEventListener('drop', handleDrop);
    domNode.addEventListener('paste', handlePaste);

    return () => {
      domNode.removeEventListener('dragover', handleDragOver);
      domNode.removeEventListener('drop', handleDrop);
      domNode.removeEventListener('paste', handlePaste);
    };
  }, [mounted]);

  const handleEditorMount: OnMount = useCallback(
    (editor) => {
      const monacoEditor = editor as MonacoEditor;
      editorRef.current = monacoEditor;
      setEditorInstance(monacoEditor);
    },
    [setEditorInstance]
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      setContent(value || '');
    },
    [setContent]
  );

  // Memoize the Monaco theme string so it is only recomputed when `mode`
  // changes, rather than being recalculated on every render.
  const editorTheme = useMemo(() => {
    if (mode === 'system') {
      return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'vs-dark'
        : 'light';
    }
    return mode === 'dark' ? 'vs-dark' : 'light';
  }, [mode]);

  if (!mounted) {
    return (
      <div
        className={cn('w-full h-full bg-background flex items-center justify-center', className)}
      >
        <div className="text-muted-foreground">{t('title')}</div>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-full', className)} dir="ltr" data-testid="editor">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={content}
        onChange={handleEditorChange}
        onMount={handleEditorMount}
        theme={editorTheme}
        options={{
          fontSize: editorSettings.fontSize,
          fontFamily: editorSettings.fontFamily,
          tabSize: editorSettings.tabSize,
          wordWrap: editorSettings.wordWrap ? 'on' : 'off',
          lineNumbers: editorSettings.lineNumbers ? 'on' : 'off',
          minimap: { enabled: editorSettings.minimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          acceptSuggestionOnEnter: 'off',
          tabCompletion: 'off',
          wordBasedSuggestions: 'off',
          renderWhitespace: 'selection',
          lineHeight: 1.6,
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">{t('title')}</div>
          </div>
        }
      />
    </div>
  );
}
