'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StorageQuotaCard } from '@/components/dashboard/StorageQuotaCard';
import { FileUploadZone } from '@/components/dashboard/FileUploadZone';
import { FileList } from '@/components/dashboard/FileList';
import { getPlanLimits } from '@/lib/plans/config';

interface UserFile {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  createdAt: string;
  url?: string;
}

interface QuotaData {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  usedFormatted: string;
  limitFormatted: string;
}

export default function FilesPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('dashboard.files');
  const tAuth = useTranslations('auth');

  const [files, setFiles] = useState<UserFile[]>([]);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [filesResponse, quotaResponse] = await Promise.all([
        fetch('/api/storage/files'),
        fetch('/api/storage/quota'),
      ]);

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData.files || []);
      }

      if (quotaResponse.ok) {
        const quotaData = await quotaResponse.json();
        setQuota(quotaData.quota);
      }
    } catch (error) {
      console.error('Failed to fetch files data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, fetchData]);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  // Loading state
  if (status === 'loading') {
    return <FilesSkeleton />;
  }

  const user = session?.user;
  const plan = user?.plan || 'free';
  const limits = getPlanLimits(plan);
  const storageEnabled = limits.cloudStorageBytes > 0;

  const planLabels: Record<string, string> = {
    free: tAuth('free'),
    pro: tAuth('pro'),
    team: tAuth('team'),
    enterprise: tAuth('enterprise'),
  };

  const handleUploadSuccess = (file: UserFile) => {
    setFiles(prev => [file, ...prev]);
    // Refresh quota after upload
    fetch('/api/storage/quota')
      .then(res => res.json())
      .then(data => setQuota(data.quota))
      .catch(console.error);
  };

  const handleFileDelete = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    // Refresh quota after delete
    fetch('/api/storage/quota')
      .then(res => res.json())
      .then(data => setQuota(data.quota))
      .catch(console.error);
  };

  const handleFilesDelete = (fileIds: string[]) => {
    setFiles(prev => prev.filter(f => !fileIds.includes(f.id)));
    // Refresh quota after bulk delete
    fetch('/api/storage/quota')
      .then(res => res.json())
      .then(data => setQuota(data.quota))
      .catch(console.error);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {planLabels[plan] || plan} {t('plan')}
        </Badge>
      </div>

      {/* Storage Quota and Upload */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StorageQuotaCard
          used={quota?.used || 0}
          limit={quota?.limit || limits.cloudStorageBytes}
          usedFormatted={quota?.usedFormatted}
          limitFormatted={quota?.limitFormatted}
          loading={loading}
          storageEnabled={storageEnabled}
        />
        <div className="md:col-span-2">
          <FileUploadZone
            onUploadSuccess={handleUploadSuccess}
            maxSizeBytes={limits.maxFileSize}
            disabled={!storageEnabled}
          />
        </div>
      </div>

      {/* File List */}
      {storageEnabled && (
        <FileList
          files={files}
          loading={loading}
          onFileDelete={handleFileDelete}
          onFilesDelete={handleFilesDelete}
          onRefresh={fetchData}
        />
      )}
    </div>
  );
}

function FilesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-lg" />
        <Skeleton className="h-32 md:col-span-2 rounded-lg" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
    </div>
  );
}
