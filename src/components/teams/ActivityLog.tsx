'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityItem } from './ActivityItem';
import { Download, RefreshCw, ChevronDown, Activity } from 'lucide-react';

interface ActivityData {
  id: string;
  teamId: string;
  teamName: string;
  userId: string;
  userEmail: string;
  userName?: string;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

interface ActivityLogProps {
  teamId: string;
  canExport?: boolean;
}

const ACTION_FILTERS = [
  'all',
  'member_invited',
  'member_joined',
  'member_removed',
  'member_left',
  'role_changed',
  'settings_updated',
  'team_updated',
] as const;

export function ActivityLog({ teamId, canExport = false }: ActivityLogProps) {
  const t = useTranslations('dashboard.teams.activity');
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchActivities = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const skip = reset ? 0 : activities.length;
        const params = new URLSearchParams({
          limit: '20',
          skip: skip.toString(),
        });

        if (filter !== 'all') {
          params.set('action', filter);
        }

        const response = await fetch(`/api/teams/${teamId}/activity?${params}`);
        const data = await response.json();

        if (response.ok && data.success) {
          if (reset) {
            setActivities(data.activities);
          } else {
            setActivities((prev) => [...prev, ...data.activities]);
          }
          setTotal(data.total);
          setHasMore(
            (reset ? data.activities.length : activities.length + data.activities.length) <
              data.total
          );
        } else {
          setError(data.error || 'Failed to load activities');
        }
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [teamId, filter, activities.length]
  );

  useEffect(() => {
    fetchActivities(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, filter]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch(`/api/teams/${teamId}/activity?format=csv`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `team-activity-${teamId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to export');
      }
    } catch (err) {
      console.error('Failed to export activities:', err);
      setError('Failed to export activities');
    } finally {
      setExporting(false);
    }
  };

  const groupActivitiesByDate = (items: ActivityData[]) => {
    const groups: Record<string, ActivityData[]> = {};

    items.forEach((activity) => {
      const date = new Date(activity.createdAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'yesterday';
      } else {
        key = date.toLocaleDateString();
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(activity);
    });

    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => fetchActivities(true)}>
          <RefreshCw className="h-4 w-4 me-2" />
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filter and export */}
      <div className="flex items-center justify-between gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('filterPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            {ACTION_FILTERS.map((action) => (
              <SelectItem key={action} value={action}>
                {t(`filters.${action}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting || activities.length === 0}
          >
            <Download className="h-4 w-4 me-2" />
            {exporting ? t('exporting') : t('export')}
          </Button>
        )}
      </div>

      {/* Activity list */}
      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">{t('noActivities')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {date === 'today'
                  ? t('time.today')
                  : date === 'yesterday'
                    ? t('time.yesterday')
                    : date}
              </h3>
              <div className="border rounded-lg divide-y">
                {items.map((activity) => (
                  <div key={activity.id} className="px-4">
                    <ActivityItem activity={activity} />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Load more button */}
          {hasMore && (
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => fetchActivities(false)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <RefreshCw className="h-4 w-4 me-2 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4 me-2" />
                )}
                {loadingMore ? t('loading') : t('loadMore')}
              </Button>
            </div>
          )}

          {/* Total count */}
          <p className="text-sm text-muted-foreground text-center">
            {t('totalActivities', { count: total })}
          </p>
        </div>
      )}
    </div>
  );
}
