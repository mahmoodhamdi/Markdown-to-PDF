'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode2,
  Link,
  ImageIcon,
  Table,
  Minus,
  Columns,
  Maximize2,
  Minimize2,
  Eye,
  ListTree,
  Undo2,
  Redo2,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/stores/editor-store';
import { useAutoSave } from '@/hooks/useAutoSave';
import { cn } from '@/lib/utils';

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  shortcut?: string;
}

export function EditorToolbar() {
  const t = useTranslations('editor.toolbar');
  const {
    viewMode,
    setViewMode,
    isFullscreen,
    toggleFullscreen,
    showToc,
    toggleToc,
    insertAtCursor: storeInsertAtCursor,
    wrapSelection: storeWrapSelection,
    undo,
    redo,
  } = useEditorStore();
  const { saveNow, isDirty } = useAutoSave();

  // Handle Ctrl+S keyboard shortcut
  const handleSave = useCallback(() => {
    saveNow();
  }, [saveNow]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  const insertAtCursor = (before: string, after: string = '') => {
    storeInsertAtCursor(before + after);
  };

  const wrapSelection = (before: string, after: string = before) => {
    storeWrapSelection(before, after);
  };

  const insertMarkdown = (text: string) => {
    storeInsertAtCursor('\n' + text);
  };

  const toolbarGroups: ToolbarAction[][] = [
    [
      {
        icon: <Undo2 className="h-4 w-4" />,
        label: t('undo'),
        action: () => undo(),
      },
      {
        icon: <Redo2 className="h-4 w-4" />,
        label: t('redo'),
        action: () => redo(),
      },
      {
        icon: <Save className={cn('h-4 w-4', isDirty && 'text-yellow-500')} />,
        label: `${t('save')} (Ctrl+S)`,
        action: handleSave,
        shortcut: 'Ctrl+S',
      },
    ],
    [
      {
        icon: <Bold className="h-4 w-4" />,
        label: t('bold'),
        action: () => wrapSelection('**'),
      },
      {
        icon: <Italic className="h-4 w-4" />,
        label: t('italic'),
        action: () => wrapSelection('_'),
      },
      {
        icon: <Strikethrough className="h-4 w-4" />,
        label: t('strikethrough'),
        action: () => wrapSelection('~~'),
      },
    ],
    [
      {
        icon: <Heading1 className="h-4 w-4" />,
        label: t('heading1'),
        action: () => insertMarkdown('# '),
      },
      {
        icon: <Heading2 className="h-4 w-4" />,
        label: t('heading2'),
        action: () => insertMarkdown('## '),
      },
      {
        icon: <Heading3 className="h-4 w-4" />,
        label: t('heading3'),
        action: () => insertMarkdown('### '),
      },
    ],
    [
      {
        icon: <List className="h-4 w-4" />,
        label: t('bulletList'),
        action: () => insertMarkdown('- '),
      },
      {
        icon: <ListOrdered className="h-4 w-4" />,
        label: t('numberedList'),
        action: () => insertMarkdown('1. '),
      },
      {
        icon: <CheckSquare className="h-4 w-4" />,
        label: t('taskList'),
        action: () => insertMarkdown('- [ ] '),
      },
    ],
    [
      {
        icon: <Quote className="h-4 w-4" />,
        label: t('quote'),
        action: () => insertMarkdown('> '),
      },
      {
        icon: <Code className="h-4 w-4" />,
        label: t('code'),
        action: () => wrapSelection('`'),
      },
      {
        icon: <FileCode2 className="h-4 w-4" />,
        label: t('codeBlock'),
        action: () => insertMarkdown('```\n\n```'),
      },
    ],
    [
      {
        icon: <Link className="h-4 w-4" />,
        label: t('link'),
        action: () => insertAtCursor('[', '](url)'),
      },
      {
        icon: <ImageIcon className="h-4 w-4" />,
        label: t('image'),
        action: () => insertAtCursor('![alt](', ')'),
      },
      {
        icon: <Table className="h-4 w-4" />,
        label: t('table'),
        action: () =>
          insertMarkdown(
            '| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |'
          ),
      },
      {
        icon: <Minus className="h-4 w-4" />,
        label: t('horizontalRule'),
        action: () => insertMarkdown('---'),
      },
    ],
  ];

  const viewActions: ToolbarAction[] = [
    {
      icon: <Eye className="h-4 w-4" />,
      label: t('preview'),
      action: () => setViewMode(viewMode === 'preview' ? 'editor' : 'preview'),
    },
    {
      icon: <Columns className="h-4 w-4" />,
      label: t('split'),
      action: () => setViewMode(viewMode === 'split' ? 'editor' : 'split'),
    },
    {
      icon: <ListTree className="h-4 w-4" />,
      label: t('toc'),
      action: () => toggleToc(),
    },
    {
      icon: isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />,
      label: isFullscreen ? t('exitFullscreen') : t('fullscreen'),
      action: () => toggleFullscreen(),
    },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between border-b p-2 bg-background overflow-x-auto">
        <div className="flex items-center gap-1">
          {toolbarGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="flex items-center">
              {group.map((action, actionIndex) => (
                <Tooltip key={actionIndex}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={action.action}
                      aria-label={action.label}
                    >
                      {action.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {groupIndex < toolbarGroups.length - 1 && <div className="w-px h-6 bg-border mx-1" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 ms-4">
          <div className="w-px h-6 bg-border mx-1" />
          {viewActions.map((action, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    (action.label === t('preview') && viewMode === 'preview') ||
                      (action.label === t('split') && viewMode === 'split') ||
                      (action.label === t('toc') && showToc) ||
                      (action.label === t('exitFullscreen') && isFullscreen)
                      ? 'bg-accent'
                      : ''
                  )}
                  onClick={action.action}
                  aria-label={action.label}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{action.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
