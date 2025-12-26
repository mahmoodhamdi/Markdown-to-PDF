'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PLANS, PlanType } from '@/lib/plans/config';
import { cn } from '@/lib/utils';

interface CurrentPlanProps {
  plan: PlanType;
  status: 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';
  billing: 'monthly' | 'yearly';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  onChangePlan?: () => void;
  onCancelSubscription?: () => void;
}

export function CurrentPlan({
  plan,
  status,
  billing,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  onChangePlan,
  onCancelSubscription,
}: CurrentPlanProps) {
  const t = useTranslations('dashboard.subscription');
  const tAuth = useTranslations('auth');
  const tPricing = useTranslations('pricing');

  const planConfig = PLANS[plan];
  const price = billing === 'yearly' ? planConfig.priceYearly : planConfig.priceMonthly;
  const billingLabel = billing === 'yearly' ? t('yearly') : t('monthly');

  const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    past_due: 'bg-yellow-500',
    canceled: 'bg-red-500',
    paused: 'bg-gray-500',
    trialing: 'bg-blue-500',
  };

  const statusLabels: Record<string, string> = {
    active: t('statusActive'),
    past_due: t('statusPastDue'),
    canceled: t('statusCanceled'),
    paused: t('statusPaused'),
    trialing: t('statusTrialing'),
  };

  const planLabels: Record<string, string> = {
    free: tAuth('free'),
    pro: tAuth('pro'),
    team: tAuth('team'),
    enterprise: tAuth('enterprise'),
  };

  // Get plan features from translations
  const getPlanFeatures = () => {
    const features = tPricing.raw(`${plan}.features`) as string[];
    return features?.slice(0, 4) || [];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('currentPlan')}</CardTitle>
          <Badge className={cn('text-white', statusColors[status])}>
            {statusLabels[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Info */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">{planLabels[plan]} {t('plan')}</h3>
            {plan !== 'free' && (
              <p className="text-muted-foreground">
                ${price}/{billingLabel}
              </p>
            )}
          </div>
          {plan === 'free' && (
            <Badge variant="secondary">{t('freeForever')}</Badge>
          )}
        </div>

        {/* Features */}
        <div className="space-y-2">
          {getPlanFeatures().map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {/* Billing Info */}
        {plan !== 'free' && currentPeriodEnd && (
          <div className="pt-4 border-t">
            {cancelAtPeriodEnd ? (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span>{t('cancelsOn', { date: formatDate(currentPeriodEnd) })}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('nextBilling', { date: formatDate(currentPeriodEnd) })}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4">
          {plan === 'free' ? (
            <Button asChild>
              <Link href="/pricing">{t('upgrade')}</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onChangePlan}>
                {t('changePlan')}
              </Button>
              {!cancelAtPeriodEnd && status !== 'canceled' && (
                <Button variant="ghost" className="text-destructive" onClick={onCancelSubscription}>
                  {t('cancelSubscription')}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
