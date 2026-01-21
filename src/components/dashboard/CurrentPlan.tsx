'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Check, AlertCircle, CreditCard, Calendar, Clock, Zap } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { PLANS, PlanType } from '@/lib/plans/config';
import { cn } from '@/lib/utils';
import { UsageBar } from './UsageBar';

interface UsageData {
  conversions: number;
  apiCalls: number;
  storageUsed: number; // in bytes
}

interface PaymentMethod {
  type: 'card' | 'wallet' | 'bank';
  brand?: string; // visa, mastercard, etc.
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  walletType?: string; // apple_pay, google_pay
}

interface CurrentPlanProps {
  plan: PlanType;
  status: 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';
  billing: 'monthly' | 'yearly';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: string;
  gateway?: string;
  usage?: UsageData;
  paymentMethod?: PaymentMethod;
  loading?: boolean;
  onChangePlan?: () => void;
  onCancelSubscription?: () => void;
  onManagePayment?: () => void;
  onPauseSubscription?: () => void;
}

export function CurrentPlan({
  plan,
  status,
  billing,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  trialEndsAt,
  gateway,
  usage,
  paymentMethod,
  loading,
  onChangePlan,
  onCancelSubscription,
  onManagePayment,
  onPauseSubscription,
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
    try {
      const features = tPricing.raw(`${plan}.features`) as string[];
      return features?.slice(0, 4) || [];
    } catch {
      return [];
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPaymentMethodDisplay = () => {
    if (!paymentMethod) return null;

    if (paymentMethod.type === 'card') {
      const brand =
        paymentMethod.brand?.charAt(0).toUpperCase() + (paymentMethod.brand?.slice(1) || '');
      return `${brand} •••• ${paymentMethod.last4}`;
    }
    if (paymentMethod.type === 'wallet') {
      return paymentMethod.walletType === 'apple_pay' ? 'Apple Pay' : 'Google Pay';
    }
    return t('bankTransfer');
  };

  const canManagePayment = gateway === 'stripe' || gateway === 'paddle';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('currentPlan')}</CardTitle>
          <Badge className={cn('text-white', statusColors[status])}>{statusLabels[status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Info */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">
              {planLabels[plan]} {t('plan')}
            </h3>
            {plan !== 'free' && (
              <p className="text-muted-foreground">
                ${price}/{billingLabel}
              </p>
            )}
          </div>
          {plan === 'free' ? (
            <Badge variant="secondary">{t('freeForever')}</Badge>
          ) : (
            plan === 'pro' && (
              <Badge variant="outline" className="text-primary border-primary">
                <Zap className="h-3 w-3 me-1" />
                {tPricing('mostPopular')}
              </Badge>
            )
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

        {/* Usage Stats */}
        {usage && plan !== 'free' && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t('usageThisPeriod')}</h4>
              <UsageBar
                label={t('conversions')}
                used={usage.conversions}
                limit={planConfig.limits.conversionsPerDay}
              />
              <UsageBar
                label={t('apiCalls')}
                used={usage.apiCalls}
                limit={planConfig.limits.apiCallsPerDay}
              />
              {planConfig.limits.cloudStorageBytes > 0 && (
                <UsageBar
                  label={t('storage')}
                  used={Math.round(usage.storageUsed / (1024 * 1024))}
                  limit={Math.round(planConfig.limits.cloudStorageBytes / (1024 * 1024))}
                  unit="MB"
                />
              )}
            </div>
          </>
        )}

        {/* Billing Info */}
        {plan !== 'free' && (
          <>
            <Separator />
            <div className="space-y-3">
              {/* Trial Info */}
              {status === 'trialing' && trialEndsAt && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                  <span>{t('trialEnds', { days: getDaysUntil(trialEndsAt) })}</span>
                </div>
              )}

              {/* Next Billing */}
              {currentPeriodEnd && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t('nextBillingDate')}</span>
                  </div>
                  <span className="font-medium">
                    {formatDate(currentPeriodEnd)}
                    {getDaysUntil(currentPeriodEnd) <= 7 && getDaysUntil(currentPeriodEnd) > 0 && (
                      <span className="text-muted-foreground ms-1">
                        ({t('inDays', { days: getDaysUntil(currentPeriodEnd) })})
                      </span>
                    )}
                  </span>
                </div>
              )}

              {/* Cancellation Notice */}
              {cancelAtPeriodEnd && currentPeriodEnd && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm">
                    {t('cancelsOn', { date: formatDate(currentPeriodEnd) })}
                  </span>
                </div>
              )}

              {/* Payment Method */}
              {paymentMethod && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>{t('paymentMethod')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getPaymentMethodDisplay()}</span>
                    {canManagePayment && onManagePayment && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0"
                        onClick={onManagePayment}
                      >
                        {t('update')}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex flex-wrap gap-3">
          {plan === 'free' ? (
            <Button asChild>
              <Link href="/pricing">{t('upgrade')}</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onChangePlan}>
                {t('changePlan')}
              </Button>
              {canManagePayment && onManagePayment && (
                <Button variant="outline" onClick={onManagePayment}>
                  <CreditCard className="h-4 w-4 me-2" />
                  {t('managePayment')}
                </Button>
              )}
              {!cancelAtPeriodEnd && status === 'active' && onPauseSubscription && (
                <Button variant="ghost" onClick={onPauseSubscription}>
                  {t('pauseSubscription')}
                </Button>
              )}
              {!cancelAtPeriodEnd && status !== 'canceled' && onCancelSubscription && (
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
