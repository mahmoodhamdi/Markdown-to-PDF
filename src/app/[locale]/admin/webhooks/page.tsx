'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WebhookEvent {
  id: string;
  gateway: string;
  eventType: string;
  status: 'success' | 'failed' | 'processing' | 'pending';
  createdAt: string;
}

interface WebhooksResponse {
  events: WebhookEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const STATUS_DOTS: Record<string, string> = {
  success: 'bg-green-500',
  failed: 'bg-red-500',
  processing: 'bg-yellow-500',
  pending: 'bg-gray-400',
};

function WebhooksSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-5 w-80 mt-2" />
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-36" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminWebhooksPage() {
  const t = useTranslations('admin');

  const [data, setData] = useState<WebhooksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      const res = await fetch(`/api/admin/webhooks?${params}`);
      if (!res.ok) throw new Error('Failed to fetch webhook events');
      const json = await res.json();
      setData(json);
    } catch {
      setError(t('webhooks.fetchError'));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  if (loading && !data) {
    return <WebhooksSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('webhooks.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('webhooks.subtitle')}</p>
      </div>

      {/* Error state */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={fetchWebhooks}>
              {t('webhooks.retry')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {!error && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Webhook className="h-4 w-4" />
              {data ? t('webhooks.showing', { count: data.total }) : t('webhooks.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                ))}
              </div>
            ) : data?.events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Webhook className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm">{t('webhooks.noEvents')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('webhooks.columnGateway')}</TableHead>
                    <TableHead>{t('webhooks.columnEventType')}</TableHead>
                    <TableHead>{t('webhooks.columnStatus')}</TableHead>
                    <TableHead>{t('webhooks.columnCreatedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium capitalize">
                          {event.gateway}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                          {event.eventType}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full',
                            STATUS_STYLES[event.status] ?? STATUS_STYLES.pending
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              STATUS_DOTS[event.status] ?? STATUS_DOTS.pending
                            )}
                          />
                          {t(`webhooks.status_${event.status}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('webhooks.pageInfo', { page: data.page, total: data.totalPages })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('webhooks.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page >= data.totalPages || loading}
            >
              {t('webhooks.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
