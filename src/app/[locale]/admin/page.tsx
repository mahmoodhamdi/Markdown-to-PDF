'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, TrendingUp, HardDrive, Activity } from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  proUsers: number;
  teamUsers: number;
  enterpriseUsers: number;
  conversionsToday: number;
  totalStorageUsedBytes: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-80 mt-2" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  const t = useTranslations('admin');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data);
      } catch {
        setError(t('overview.fetchError'));
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [t]);

  if (loading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('overview.title')}</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: t('overview.totalUsers'),
      value: stats?.totalUsers ?? 0,
      icon: Users,
      description: t('overview.allRegisteredUsers'),
    },
    {
      title: t('overview.proUsers'),
      value: stats?.proUsers ?? 0,
      icon: Users,
      description: t('overview.activeProSubscriptions'),
    },
    {
      title: t('overview.teamUsers'),
      value: stats?.teamUsers ?? 0,
      icon: Users,
      description: t('overview.activeTeamSubscriptions'),
    },
    {
      title: t('overview.enterpriseUsers'),
      value: stats?.enterpriseUsers ?? 0,
      icon: Users,
      description: t('overview.activeEnterpriseSubscriptions'),
    },
    {
      title: t('overview.conversionsToday'),
      value: stats?.conversionsToday ?? 0,
      icon: Activity,
      description: t('overview.totalConversionsToday'),
    },
    {
      title: t('overview.totalStorageUsed'),
      value: formatBytes(stats?.totalStorageUsedBytes ?? 0),
      icon: HardDrive,
      description: t('overview.acrossAllUsers'),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('overview.title')}</h1>
        <p className="text-muted-foreground mt-1">{t('overview.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            description={card.description}
          />
        ))}
      </div>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('overview.planBreakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  label: t('overview.freePlan'),
                  count: stats.totalUsers - stats.proUsers - stats.teamUsers - stats.enterpriseUsers,
                  color: 'bg-gray-400',
                },
                { label: t('overview.proPlan'), count: stats.proUsers, color: 'bg-blue-500' },
                { label: t('overview.teamPlan'), count: stats.teamUsers, color: 'bg-purple-500' },
                {
                  label: t('overview.enterprisePlan'),
                  count: stats.enterpriseUsers,
                  color: 'bg-amber-500',
                },
              ].map((item) => {
                const percent =
                  stats.totalUsers > 0
                    ? Math.round((item.count / stats.totalUsers) * 100)
                    : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-muted-foreground shrink-0">{item.label}</span>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {item.count} <span className="text-muted-foreground">({percent}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
