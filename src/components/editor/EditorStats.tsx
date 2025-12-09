'use client';

import { useTranslations } from 'next-intl';
import { useEditorStore } from '@/stores/editor-store';
import { calculateEditorStats } from '@/lib/utils';
import { useMemo } from 'react';

export function EditorStats() {
  const t = useTranslations('editor.stats');
  const { content } = useEditorStore();

  const stats = useMemo(() => calculateEditorStats(content), [content]);

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground px-4 py-2 border-t bg-muted/50">
      <span>
        {stats.words} {t('words')}
      </span>
      <span>
        {stats.characters} {t('characters')}
      </span>
      <span>
        {stats.lines} {t('lines')}
      </span>
      <span>
        {stats.readingTime} {t('minutes')} {t('readingTime')}
      </span>
    </div>
  );
}
