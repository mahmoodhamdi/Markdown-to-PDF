'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Minimize2 } from 'lucide-react';
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorStats } from '@/components/editor/EditorStats';
import { RecoveryPrompt } from '@/components/editor/RecoveryPrompt';
import { MarkdownPreview } from '@/components/preview/MarkdownPreview';
import { TableOfContents } from '@/components/preview/TableOfContents';
import { ConvertButton } from '@/components/converter/ConvertButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const t = useTranslations('editor');
  const tPreview = useTranslations('preview');
  const { viewMode, content, setContent, showToc, isFullscreen, setIsFullscreen, toggleFullscreen } = useEditorStore();
  const [isMobile, setIsMobile] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set default content only on initial mount if no persisted content exists
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      if (!content) {
        setContent(t('placeholder'));
      }
    }
  }, [content, setContent, t]);

  // Add/remove fullscreen-active class to body
  useEffect(() => {
    if (isFullscreen) {
      document.body.classList.add('fullscreen-active');
    } else {
      document.body.classList.remove('fullscreen-active');
    }
    return () => document.body.classList.remove('fullscreen-active');
  }, [isFullscreen]);

  // Handle keyboard shortcuts (ESC to exit, F11 to toggle)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // F11 to toggle fullscreen
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
    // Escape to exit fullscreen
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen, setIsFullscreen, toggleFullscreen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Mobile view with tabs
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem-4rem)]">
        <RecoveryPrompt />
        <Tabs defaultValue="editor" className="flex-1 flex flex-col">
          <div className="border-b bg-background p-2">
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="editor">{t('title')}</TabsTrigger>
                <TabsTrigger value="preview">{tPreview('title')}</TabsTrigger>
              </TabsList>
              <ConvertButton />
            </div>
          </div>

          <TabsContent value="editor" className="flex-1 m-0 data-[state=inactive]:hidden">
            <div className="h-full flex flex-col">
              <EditorToolbar />
              <div className="flex-1 overflow-hidden">
                <MarkdownEditor />
              </div>
              <EditorStats />
            </div>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 m-0 data-[state=inactive]:hidden overflow-auto flex flex-col">
            {showToc && (
              <div className="border-b">
                <TableOfContents className="max-h-48 overflow-y-auto" />
              </div>
            )}
            <div className="flex-1 overflow-auto">
              <MarkdownPreview />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop view
  return (
    <div
      className={cn(
        'flex flex-col',
        isFullscreen
          ? 'fixed inset-0 z-50 bg-background'
          : 'h-[calc(100vh-3.5rem-4rem)]'
      )}
    >
      {/* Exit fullscreen overlay button */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-[60] opacity-0 hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullscreen(false)}
            className="shadow-lg bg-background/80 backdrop-blur-sm"
          >
            <Minimize2 className="h-4 w-4 me-2" />
            {t('toolbar.exitFullscreen')}
          </Button>
        </div>
      )}
      <RecoveryPrompt />
      <div className="border-b bg-background p-2 flex items-center justify-between">
        <EditorToolbar />
        <ConvertButton />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div
          className={cn(
            'flex flex-col overflow-hidden transition-all duration-200',
            viewMode === 'preview' ? 'w-0' : viewMode === 'split' ? 'w-1/2' : 'w-full'
          )}
        >
          <div className="flex-1 overflow-hidden">
            <MarkdownEditor />
          </div>
          <EditorStats />
        </div>

        {/* Divider */}
        {viewMode === 'split' && <div className="w-px bg-border" />}

        {/* Preview Panel */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200 flex',
            viewMode === 'editor' ? 'w-0' : viewMode === 'split' ? 'w-1/2' : 'w-full'
          )}
        >
          {showToc && viewMode !== 'editor' && (
            <div className="w-64 border-e overflow-y-auto shrink-0">
              <TableOfContents />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <MarkdownPreview />
          </div>
        </div>
      </div>
    </div>
  );
}
