'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  FileImage,
  File,
  MoreVertical,
  Download,
  Trash2,
  Link,
  Grid,
  List,
  ArrowUpDown,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserFile {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
  url?: string;
}

interface FileListProps {
  files: UserFile[];
  loading?: boolean;
  onFileDelete?: (fileId: string) => void;
  onFilesDelete?: (fileIds: string[]) => void;
  onRefresh?: () => void;
}

type SortField = 'filename' | 'size' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

export function FileList({
  files,
  loading = false,
  onFileDelete,
  onFilesDelete,
  onRefresh,
}: FileListProps) {
  const t = useTranslations('dashboard.files');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    if (
      mimeType === 'application/pdf' ||
      mimeType.includes('markdown') ||
      mimeType === 'text/plain'
    ) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'filename':
        comparison = a.filename.localeCompare(b.filename);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.id)));
    }
  };

  const handleDownload = useCallback(
    async (file: UserFile) => {
      try {
        const response = await fetch(`/api/storage/files/${file.id}`);
        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(t('downloadSuccess'));
      } catch {
        toast.error(t('downloadError'));
      }
    },
    [t]
  );

  const handleCopyLink = useCallback(
    async (file: UserFile) => {
      try {
        const response = await fetch(`/api/storage/files/${file.id}/link`);
        if (!response.ok) throw new Error('Failed to get link');

        const { url } = await response.json();
        await navigator.clipboard.writeText(url);
        toast.success(t('linkCopied'));
      } catch {
        toast.error(t('linkError'));
      }
    },
    [t]
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      setDeletingFiles((prev) => new Set(prev).add(fileId));
      try {
        const response = await fetch(`/api/storage/files/${fileId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Delete failed');

        toast.success(t('deleteSuccess'));
        onFileDelete?.(fileId);
        onRefresh?.();
      } catch {
        toast.error(t('deleteError'));
      } finally {
        setDeletingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
        setFileToDelete(null);
        setShowDeleteDialog(false);
      }
    },
    [t, onFileDelete, onRefresh]
  );

  const handleBulkDelete = useCallback(async () => {
    const fileIds = Array.from(selectedFiles);
    setDeletingFiles(new Set(fileIds));

    try {
      const results = await Promise.allSettled(
        fileIds.map((id) => fetch(`/api/storage/files/${id}`, { method: 'DELETE' }))
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.filter((r) => r.status === 'rejected').length;

      if (failCount === 0) {
        toast.success(t('bulkDeleteSuccess', { count: successCount }));
      } else {
        toast.warning(t('bulkDeletePartial', { success: successCount, failed: failCount }));
      }

      onFilesDelete?.(fileIds);
      setSelectedFiles(new Set());
      onRefresh?.();
    } catch {
      toast.error(t('bulkDeleteError'));
    } finally {
      setDeletingFiles(new Set());
      setShowBulkDeleteDialog(false);
    }
  }, [selectedFiles, t, onFilesDelete, onRefresh]);

  const confirmDelete = (fileId: string) => {
    setFileToDelete(fileId);
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    if (selectedFiles.size > 0) {
      setShowBulkDeleteDialog(true);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (files.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t('noFiles')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{t('yourFiles')}</CardTitle>
          <div className="flex items-center gap-2">
            {selectedFiles.size > 0 && (
              <Button variant="destructive" size="sm" onClick={confirmBulkDelete}>
                <Trash2 className="h-4 w-4 me-2" />
                {t('deleteSelected', { count: selectedFiles.size })}
              </Button>
            )}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-e-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-s-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'table' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={selectedFiles.size === files.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ms-3"
                      onClick={() => handleSort('filename')}
                    >
                      {t('fileName')}
                      <ArrowUpDown className="h-4 w-4 ms-2" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ms-3"
                      onClick={() => handleSort('size')}
                    >
                      {t('fileSize')}
                      <ArrowUpDown className="h-4 w-4 ms-2" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ms-3"
                      onClick={() => handleSort('createdAt')}
                    >
                      {t('uploadDate')}
                      <ArrowUpDown className="h-4 w-4 ms-2" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={() => toggleFileSelection(file.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.mimeType)}
                        <span className="truncate max-w-[200px]">{file.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(file.size)}</TableCell>
                    <TableCell>{formatDate(file.createdAt)}</TableCell>
                    <TableCell>
                      {deletingFiles.has(file.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="h-4 w-4 me-2" />
                              {t('download')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(file)}>
                              <Link className="h-4 w-4 me-2" />
                              {t('copyLink')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => confirmDelete(file.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 me-2" />
                              {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`relative p-4 rounded-lg border hover:border-primary transition-colors ${
                    selectedFiles.has(file.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="absolute top-2 start-2">
                    <Checkbox
                      checked={selectedFiles.has(file.id)}
                      onCheckedChange={() => toggleFileSelection(file.id)}
                    />
                  </div>
                  <div className="absolute top-2 end-2">
                    {deletingFiles.has(file.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="h-4 w-4 me-2" />
                            {t('download')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(file)}>
                            <Link className="h-4 w-4 me-2" />
                            {t('copyLink')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => confirmDelete(file.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 me-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <div className="pt-8 text-center">
                    <div className="mb-3">{getFileIcon(file.mimeType)}</div>
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmDeleteDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleDelete(fileToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmBulkDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmBulkDeleteDescription', { count: selectedFiles.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('deleteSelected', { count: selectedFiles.size })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
