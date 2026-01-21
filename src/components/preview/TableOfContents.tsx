'use client';

import { useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useEditorStore } from '@/stores/editor-store';
import { extractHeadings } from '@/lib/markdown/parser';
import { useActiveHeading, scrollToHeading } from '@/hooks/useActiveHeading';
import { cn } from '@/lib/utils';

interface TableOfContentsProps {
  className?: string;
}

export function TableOfContents({ className }: TableOfContentsProps) {
  const t = useTranslations('preview');
  const { content } = useEditorStore();

  const headings = useMemo(() => {
    if (!content.trim()) return [];
    return extractHeadings(content);
  }, [content]);

  const activeId = useActiveHeading(headings);

  const handleHeadingClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToHeading(id);
  }, []);

  if (headings.length === 0) {
    return (
      <nav className={cn('p-4 border rounded-lg bg-muted/50', className)}>
        <h3 className="font-semibold mb-3 text-sm">{t('tocTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('toc.empty')}</p>
      </nav>
    );
  }

  return (
    <nav className={cn('p-4', className)} aria-label={t('tocTitle')}>
      <h3 className="font-semibold mb-3 text-sm border-b pb-2">{t('tocTitle')}</h3>
      <ul className="space-y-0.5 text-sm">
        {headings.map((item, index) => {
          const isActive = activeId === item.id;
          const indent = (item.level - 1) * 12;

          return (
            <li key={`${item.id}-${index}`} style={{ paddingInlineStart: `${indent}px` }}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleHeadingClick(e, item.id)}
                className={cn(
                  'block py-1.5 px-2 rounded-md transition-colors truncate',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground'
                )}
                aria-current={isActive ? 'location' : undefined}
                title={item.text}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
