'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Zap, HardDrive, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  colorClass?: string;
}

function StatCard({ icon, label, value, subtext, colorClass = 'text-primary' }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-lg bg-primary/10', colorClass)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtext && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickStatsProps {
  conversionsToday: number;
  conversionsLimit: number;
  storageUsed: string;
  storageLimit: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
}

export function QuickStats({
  conversionsToday,
  conversionsLimit,
  storageUsed,
  storageLimit,
  plan,
}: QuickStatsProps) {
  const t = useTranslations('dashboard.stats');
  const tAuth = useTranslations('auth');

  const formatLimit = (limit: number) => {
    if (limit === Infinity) return '∞';
    return limit.toString();
  };

  const planLabels: Record<string, string> = {
    free: tAuth('free'),
    pro: tAuth('pro'),
    team: tAuth('team'),
    enterprise: tAuth('enterprise'),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<FileText className="h-5 w-5 text-primary" />}
        label={t('conversionsToday')}
        value={`${conversionsToday}/${formatLimit(conversionsLimit)}`}
        subtext={t('today')}
      />
      <StatCard
        icon={<Zap className="h-5 w-5 text-orange-500" />}
        label={t('apiCalls')}
        value="-"
        subtext={t('today')}
        colorClass="text-orange-500"
      />
      <StatCard
        icon={<HardDrive className="h-5 w-5 text-blue-500" />}
        label={t('storageUsed')}
        value={storageUsed}
        subtext={`${t('of')} ${storageLimit}`}
        colorClass="text-blue-500"
      />
      <StatCard
        icon={<Crown className="h-5 w-5 text-yellow-500" />}
        label={t('currentPlan')}
        value={planLabels[plan] || plan}
        colorClass="text-yellow-500"
      />
    </div>
  );
}
