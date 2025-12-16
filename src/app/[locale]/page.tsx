'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { EditorStats } from '@/components/editor/EditorStats';
import { MarkdownPreview } from '@/components/preview/MarkdownPreview';
import { TableOfContents } from '@/components/preview/TableOfContents';
import { ConvertButton } from '@/components/converter/ConvertButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const t = useTranslations('editor');
  const tPreview = useTranslations('preview');
  const { viewMode, setViewMode, content, setContent, showToc } = useEditorStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Set default content if empty
  useEffect(() => {
    if (!content) {
      setContent(t('placeholder'));
    }
  }, [content, setContent, t]);

  // Mobile view with tabs
  if (isMobile) {
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem-4rem)]">
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
    <div className="flex flex-col h-[calc(100vh-3.5rem-4rem)]">
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
