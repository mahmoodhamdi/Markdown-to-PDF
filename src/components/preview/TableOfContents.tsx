'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useEditorStore } from '@/stores/editor-store';
import { extractHeadings } from '@/lib/markdown/parser';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  className?: string;
}

export function TableOfContents({ className }: TableOfContentsProps) {
  const t = useTranslations('preview');
  const { content } = useEditorStore();

  const toc = useMemo(() => {
    if (!content.trim()) return [];
    return extractHeadings(content);
  }, [content]);

  if (toc.length === 0) {
    return null;
  }

  return (
    <nav className={cn('p-4 border rounded-lg bg-muted/50', className)}>
      <h3 className="font-semibold mb-3 text-sm">{t('tocTitle')}</h3>
      <ul className="space-y-1 text-sm">
        {toc.map((item, index) => (
          <li
            key={`${item.id}-${index}`}
            style={{ paddingInlineStart: `${(item.level - 1) * 12}px` }}
          >
            <a
              href={`#${item.id}`}
              className="text-muted-foreground hover:text-foreground transition-colors block py-0.5"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
