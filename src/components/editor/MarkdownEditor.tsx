'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Editor from '@monaco-editor/react';
import { useEditorStore } from '@/stores/editor-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

interface MarkdownEditorProps {
  className?: string;
}

export function MarkdownEditor({ className }: MarkdownEditorProps) {
  const t = useTranslations('editor');
  const { content, setContent } = useEditorStore();
  const { editorSettings } = useSettingsStore();
  const { mode } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      setContent(value || '');
    },
    [setContent]
  );

  const getEditorTheme = () => {
    if (mode === 'system') {
      return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'vs-dark'
        : 'light';
    }
    return mode === 'dark' ? 'vs-dark' : 'light';
  };

  if (!mounted) {
    return (
      <div
        className={cn(
          'w-full h-full bg-background flex items-center justify-center',
          className
        )}
      >
        <div className="text-muted-foreground">{t('title')}</div>
      </div>
    );
  }

  return (
    <div className={cn('w-full h-full', className)} data-testid="editor">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={content}
        onChange={handleEditorChange}
        theme={getEditorTheme()}
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
