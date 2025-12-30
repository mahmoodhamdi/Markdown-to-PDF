'use client';

import useSWR from 'swr';

/**
 * SWR fetcher function
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch');
  }
  return res.json();
};

interface StoredFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

interface StorageQuota {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
}

interface StorageFilesResponse {
  success: boolean;
  files: StoredFile[];
  quota: StorageQuota;
  error?: string;
}

/**
 * Hook for fetching storage files with SWR caching
 * - Revalidates on focus by default
 * - Dedupes requests within 30 seconds
 */
export function useStorageFiles() {
  const { data, error, isLoading, mutate } = useSWR<StorageFilesResponse>(
    '/api/storage/files',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 2,
    }
  );

  return {
    files: data?.files || [],
    quota: data?.quota,
    isLoading,
    isError: !!error || data?.success === false,
    error: error || data?.error,
    mutate,
  };
}

/**
 * Hook for fetching storage quota only
 */
export function useStorageQuota() {
  const { data, error, isLoading, mutate } = useSWR<StorageFilesResponse>(
    '/api/storage/files',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 60 seconds
      errorRetryCount: 2,
    }
  );

  return {
    quota: data?.quota,
    filesCount: data?.files?.length || 0,
    isLoading,
    isError: !!error,
    error,
    mutate,
  };
}

export type { StoredFile, StorageQuota };
