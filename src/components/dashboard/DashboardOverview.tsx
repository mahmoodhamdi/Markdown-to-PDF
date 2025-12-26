'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuickStats } from './QuickStats';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { FileText, Upload, BookOpen, ArrowRight } from 'lucide-react';

interface QuickAction {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'secondary';
}

const quickActions: QuickAction[] = [
  { href: '/', labelKey: 'newDocument', icon: FileText, variant: 'default' },
  { href: '/batch', labelKey: 'uploadFiles', icon: Upload, variant: 'outline' },
  { href: '/templates', labelKey: 'browseTemplates', icon: BookOpen, variant: 'outline' },
];

interface DashboardOverviewProps {
  userName?: string;
  conversionsToday: number;
  conversionsLimit: number;
  storageUsed: string;
  storageLimit: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  emailVerified?: boolean;
}

export function DashboardOverview({
  userName,
  conversionsToday,
  conversionsLimit,
  storageUsed,
  storageLimit,
  plan,
  emailVerified = true,
}: DashboardOverviewProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-6">
      {/* Email Verification Banner */}
      {!emailVerified && <EmailVerificationBanner />}

      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          {t('welcome', { name: userName || t('user') })}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('welcomeSubtitle')}
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats
        conversionsToday={conversionsToday}
        conversionsLimit={conversionsLimit}
        storageUsed={storageUsed}
        storageLimit={storageLimit}
        plan={plan}
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.href}
                  variant={action.variant}
                  asChild
                >
                  <Link href={action.href}>
                    <Icon className="h-4 w-4 me-2" />
                    {t(`actions.${action.labelKey}`)}
                  </Link>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA for free users */}
      {plan === 'free' && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{t('upgrade.title')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('upgrade.description')}
                </p>
              </div>
              <Button asChild>
                <Link href="/pricing">
                  {t('upgrade.button')}
                  <ArrowRight className="h-4 w-4 ms-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
