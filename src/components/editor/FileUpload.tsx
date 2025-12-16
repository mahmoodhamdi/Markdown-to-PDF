'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, File } from 'lucide-react';
import { toast } from 'sonner';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';

export function FileUpload() {
  const t = useTranslations('editor');
  const tErrors = useTranslations('errors');
  const tCommon = useTranslations('common');
  const { setContent } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;

      const validTypes = ['.md', '.markdown', '.txt'];
      const fileName = file.name.toLowerCase();
      const isValid = validTypes.some((ext) => fileName.endsWith(ext));

      if (!isValid) {
        toast.error(tErrors('invalidFormat', { formats: '.md, .markdown, .txt' }));
        return;
      }

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(tErrors('fileTooBig', { max: '5' }));
        return;
      }

      try {
        const text = await file.text();
        setContent(text);
        toast.success(tCommon('success'));
      } catch (error) {
        console.error('Error reading file:', error);
        toast.error(tErrors('generic'));
      }
    },
    [setContent, tErrors, tCommon]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      <div className="flex flex-col items-center gap-2">
        <div className="p-3 rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-sm">
          <span className="font-medium">{t('uploadFile')}</span>
          <span className="text-muted-foreground"> {t('dropFile')}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t('supportedFormats')}</p>
      </div>
    </div>
  );
}
