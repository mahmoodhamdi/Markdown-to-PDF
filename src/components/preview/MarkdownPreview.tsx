'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useEditorStore } from '@/stores/editor-store';
import { useThemeStore } from '@/stores/theme-store';
import { parseMarkdownFull } from '@/lib/markdown/parser';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  className?: string;
  content?: string;
}

export function MarkdownPreview({ className, content: propContent }: MarkdownPreviewProps) {
  const t = useTranslations('preview');
  const { content: storeContent } = useEditorStore();
  const { documentTheme } = useThemeStore();
  const previewRef = useRef<HTMLDivElement>(null);

  const content = propContent ?? storeContent;

  const { html, toc } = useMemo(() => {
    if (!content.trim()) {
      return { html: '', toc: [] };
    }
    return parseMarkdownFull(content);
  }, [content]);

  // Initialize KaTeX and Mermaid after render
  useEffect(() => {
    if (!previewRef.current || !html) return;

    // Process KaTeX elements
    const katexElements = previewRef.current.querySelectorAll('[data-math]');
    if (katexElements.length > 0 && typeof window !== 'undefined') {
      import('katex').then((katex) => {
        katexElements.forEach((el) => {
          const math = decodeURIComponent(el.getAttribute('data-math') || '');
          const displayMode = el.classList.contains('katex-display');
          try {
            katex.default.render(math, el as HTMLElement, {
              displayMode,
              throwOnError: false,
            });
          } catch (e) {
            console.error('KaTeX error:', e);
          }
        });
      });
    }

    // Process Mermaid diagrams
    const mermaidElements = previewRef.current.querySelectorAll('.mermaid:not([data-processed])');
    if (mermaidElements.length > 0 && typeof window !== 'undefined') {
      import('mermaid').then((mermaid) => {
        mermaid.default.initialize({
          startOnLoad: false,
          theme: documentTheme === 'dark' ? 'dark' : 'default',
        });
        mermaidElements.forEach((el, index) => {
          el.setAttribute('data-processed', 'true');
          mermaid.default.render(`mermaid-${index}`, el.textContent || '').then((result) => {
            el.innerHTML = result.svg;
          }).catch((e) => {
            console.error('Mermaid error:', e);
          });
        });
      });
    }
  }, [html, documentTheme]);

  if (!content.trim()) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full text-muted-foreground',
          className
        )}
      >
        {t('emptyState')}
      </div>
    );
  }

  return (
    <div
      ref={previewRef}
      className={cn(
        'markdown-preview p-6 overflow-auto h-full',
        `theme-${documentTheme}`,
        className
      )}
      data-testid="preview"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
