'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileText, Download, Loader2, Check, AlertCircle } from 'lucide-react';
import { BatchFile } from '@/types';
import { formatFileSize, generateId } from '@/lib/utils';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function BatchPage() {
  const t = useTranslations('batch');
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(async (fileList: FileList) => {
    const validTypes = ['.md', '.markdown', '.txt'];
    const newFiles: BatchFile[] = [];

    for (let i = 0; i < Math.min(fileList.length, 20 - files.length); i++) {
      const file = fileList[i];
      const fileName = file.name.toLowerCase();
      const isValid = validTypes.some((ext) => fileName.endsWith(ext));

      if (isValid) {
        try {
          const content = await file.text();
          newFiles.push({
            id: generateId(),
            name: file.name,
            content,
            size: file.size,
            status: 'pending',
          });
        } catch (error) {
          console.error('Error reading file:', error);
        }
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
  }, [files.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
    setProgress(0);
  };

  const convertAll = async () => {
    if (files.length === 0) return;

    setIsConverting(true);
    setProgress(0);

    const updatedFiles = [...files];
    let completed = 0;

    for (let i = 0; i < updatedFiles.length; i++) {
      const file = updatedFiles[i];
      updatedFiles[i] = { ...file, status: 'converting' };
      setFiles([...updatedFiles]);

      try {
        const response = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown: file.content }),
        });

        if (response.ok) {
          const blob = await response.blob();
          updatedFiles[i] = { ...updatedFiles[i], status: 'success', result: blob };
        } else {
          updatedFiles[i] = { ...updatedFiles[i], status: 'failed', error: 'Conversion failed' };
        }
      } catch (error) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      completed++;
      setProgress((completed / files.length) * 100);
      setFiles([...updatedFiles]);
    }

    setIsConverting(false);
  };

  const downloadAll = async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.result);
    if (successFiles.length === 0) return;

    const zip = new JSZip();

    successFiles.forEach((file) => {
      if (file.result) {
        const pdfName = file.name.replace(/\.(md|markdown|txt)$/i, '.pdf');
        zip.file(pdfName, file.result);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'converted-documents.zip');
  };

  const successCount = files.filter((f) => f.status === 'success').length;
  const failedCount = files.filter((f) => f.status === 'failed').length;
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
      </div>

      {/* Dropzone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer mb-8',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        )}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".md,.markdown,.txt"
          multiple
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-muted">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{isDragging ? t('dropzoneActive') : t('dropzone')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('supportedFormats')}</p>
            <p className="text-sm text-muted-foreground">{t('maxFiles', { max: 20 })}</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {t('filesSelected', { count: files.length })} ({formatFileSize(totalSize)})
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              {t('clearAll')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === 'pending' && (
                      <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
                    )}
                    {file.status === 'converting' && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                    {file.status === 'success' && (
                      <Check className="h-4 w-4 text-green-500" />
                    )}
                    {file.status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(file.id)}
                      disabled={isConverting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {isConverting && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  {t('converting', {
                    current: Math.ceil((progress / 100) * files.length),
                    total: files.length,
                  })}
                </p>
              </div>
            )}

            {!isConverting && (successCount > 0 || failedCount > 0) && (
              <div className="mt-4 p-4 rounded-lg bg-muted">
                <h4 className="font-medium mb-2">{t('results.title')}</h4>
                {successCount > 0 && (
                  <p className="text-sm text-green-600">
                    {t('results.success', { count: successCount })}
                  </p>
                )}
                {failedCount > 0 && (
                  <p className="text-sm text-destructive">
                    {t('results.failed', { count: failedCount })}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex gap-4">
          <Button
            onClick={convertAll}
            disabled={isConverting || files.every((f) => f.status !== 'pending')}
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('converting', { current: '...', total: files.length })}
              </>
            ) : (
              t('convertAll')
            )}
          </Button>

          {successCount > 0 && (
            <Button variant="outline" onClick={downloadAll}>
              <Download className="h-4 w-4 me-2" />
              {t('downloadAll')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
