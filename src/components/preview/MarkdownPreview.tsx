'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useEditorStore } from '@/stores/editor-store';
import { useThemeStore } from '@/stores/theme-store';
import { parseMarkdownFull } from '@/lib/markdown/parser';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  className?: string;
  content?: string;
}

const DEBOUNCE_DELAY = 300; // 300ms debounce for preview rendering

export function MarkdownPreview({ className, content: propContent }: MarkdownPreviewProps) {
  const t = useTranslations('preview');
  const { content: storeContent } = useEditorStore();
  const { documentTheme } = useThemeStore();
  const previewRef = useRef<HTMLDivElement>(null);

  // Track whether mermaid has been initialized and which theme it was initialized with.
  // Using a ref means this value persists across renders without causing re-renders.
  const mermaidInitializedThemeRef = useRef<string | null>(null);

  const content = propContent ?? storeContent;

  // Debounce content changes to prevent excessive re-renders during typing
  const debouncedContent = useDebounce(content, DEBOUNCE_DELAY);

  const { html } = useMemo(() => {
    if (!debouncedContent.trim()) {
      return { html: '', toc: [] };
    }
    return parseMarkdownFull(debouncedContent);
  }, [debouncedContent]);

  // Initialize KaTeX after html changes
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
  }, [html]);

  // Process Mermaid diagrams. Mermaid is only re-initialized when the theme
  // actually changes; diagram re-rendering runs on every html change independently.
  useEffect(() => {
    if (!previewRef.current || !html || typeof window === 'undefined') return;

    const mermaidElements = previewRef.current.querySelectorAll('.mermaid:not([data-processed])');
    if (mermaidElements.length === 0) return;

    const mermaidTheme = documentTheme === 'dark' ? 'dark' : 'default';

    import('mermaid').then((mermaid) => {
      // Only call initialize() when the theme has changed (or on first use).
      // This avoids resetting internal mermaid state on every keystroke.
      if (mermaidInitializedThemeRef.current !== mermaidTheme) {
        mermaid.default.initialize({
          startOnLoad: false,
          theme: mermaidTheme,
        });
        mermaidInitializedThemeRef.current = mermaidTheme;
      }

      mermaidElements.forEach((el, index) => {
        el.setAttribute('data-processed', 'true');
        mermaid.default
          .render(`mermaid-${index}`, el.textContent || '')
          .then((result) => {
            el.innerHTML = result.svg;
          })
          .catch((e) => {
            console.error('Mermaid error:', e);
          });
      });
    });
  }, [html, documentTheme]);

  // Use debouncedContent for the empty-state check so it stays in sync with
  // HTML generation. Using raw `content` here would cause a flash: the
  // placeholder would disappear immediately on the first keystroke while the
  // parsed HTML is still blank (waiting for the debounce to fire).
  if (!debouncedContent.trim()) {
    return (
      <div
        className={cn('flex items-center justify-center h-full text-muted-foreground', className)}
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
