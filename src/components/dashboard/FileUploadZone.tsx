'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileUploadZoneProps {
  onUploadSuccess?: (file: UploadedFile) => void;
  maxSizeBytes?: number;
  disabled?: boolean;
}

interface UploadedFile {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export function FileUploadZone({
  onUploadSuccess,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB default
  disabled = false,
}: FileUploadZoneProps) {
  const t = useTranslations('dashboard.files');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      // Validate size
      if (file.size > maxSizeBytes) {
        toast.error(t('fileTooLarge'));
        return;
      }

      setSelectedFile(file);
    },
    [maxSizeBytes, t]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      const firstFile = files[0];
      if (files.length > 0 && firstFile) {
        handleFile(firstFile);
      }
    },
    [disabled, handleFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      const firstFile = files?.[0];
      if (files && files.length > 0 && firstFile) {
        handleFile(firstFile);
      }
      // Reset input
      e.target.value = '';
    },
    [handleFile]
  );

  const uploadFile = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate progress (real progress would need XHR or fetch with progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t('uploadError'));
      }

      const data = await response.json();

      toast.success(t('uploadSuccess'));
      setSelectedFile(null);
      setUploadProgress(0);

      if (onUploadSuccess && data.file) {
        onUploadSuccess(data.file);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('uploadError'));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const cancelUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (disabled) {
    return (
      <Card className="border-dashed border-2 p-8 text-center opacity-50">
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">{t('upgradeRequired')}</p>
      </Card>
    );
  }

  return (
    <Card
      className={`border-dashed border-2 p-8 text-center transition-colors ${
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div className="text-start">
              <p className="font-medium truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
            {!isUploading && (
              <Button variant="ghost" size="icon" onClick={cancelUpload} className="ms-2">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground">{uploadProgress}%</p>
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Button onClick={uploadFile} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('uploading')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 me-2" />
                  {t('upload')}
                </>
              )}
            </Button>
            {!isUploading && (
              <Button variant="outline" onClick={cancelUpload}>
                {t('cancel')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-4">{t('dragDrop')}</p>
          <label>
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".md,.markdown,.txt,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
            />
            <Button asChild variant="outline">
              <span className="cursor-pointer">{t('browse')}</span>
            </Button>
          </label>
          <p className="text-xs text-muted-foreground mt-4">
            {t('maxSize', { size: formatFileSize(maxSizeBytes) })}
          </p>
        </>
      )}
    </Card>
  );
}
