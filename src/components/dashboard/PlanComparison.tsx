'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { PLANS, PlanType } from '@/lib/plans/config';
import { cn } from '@/lib/utils';

interface PlanComparisonProps {
  currentPlan: PlanType;
  onSelectPlan: (plan: Exclude<PlanType, 'free'>, billing: 'monthly' | 'yearly') => void;
  loading?: boolean;
}

export function PlanComparison({ currentPlan, onSelectPlan, loading }: PlanComparisonProps) {
  const t = useTranslations('dashboard.subscription');
  const tPricing = useTranslations('pricing');
  const tAuth = useTranslations('auth');

  const [isYearly, setIsYearly] = useState(false);

  const planLabels: Record<string, string> = {
    free: tAuth('free'),
    pro: tAuth('pro'),
    team: tAuth('team'),
    enterprise: tAuth('enterprise'),
  };

  const plans: PlanType[] = ['free', 'pro', 'team', 'enterprise'];

  const getPrice = (plan: PlanType) => {
    if (plan === 'free') return 0;
    return isYearly ? PLANS[plan].priceYearly : PLANS[plan].priceMonthly;
  };

  const getMonthlyEquivalent = (plan: PlanType) => {
    if (plan === 'free') return 0;
    return isYearly
      ? Math.round(PLANS[plan].priceYearly / 12)
      : PLANS[plan].priceMonthly;
  };

  const getSavings = (plan: PlanType) => {
    if (plan === 'free') return 0;
    const monthlyTotal = PLANS[plan].priceMonthly * 12;
    const yearlyTotal = PLANS[plan].priceYearly;
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  };

  const getPlanFeatures = (plan: PlanType) => {
    try {
      const features = tPricing.raw(`${plan}.features`) as string[];
      return features || [];
    } catch {
      return [];
    }
  };

  const isCurrentPlan = (plan: PlanType) => plan === currentPlan;
  const isDowngrade = (plan: PlanType) => {
    const planOrder = { free: 0, pro: 1, team: 2, enterprise: 3 };
    return planOrder[plan] < planOrder[currentPlan];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t('comparePlans')}</CardTitle>
          <div className="flex items-center gap-3">
            <Label htmlFor="billing-toggle" className="text-sm">
              {t('monthly')}
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className="text-sm">
              {t('yearly')}
              <Badge variant="secondary" className="ms-2 text-xs">
                {tPricing('save', { percent: '20' })}
              </Badge>
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan}
              className={cn(
                'rounded-lg border p-4 transition-all',
                isCurrentPlan(plan)
                  ? 'border-primary ring-2 ring-primary'
                  : 'hover:border-primary/50'
              )}
            >
              {/* Plan Header */}
              <div className="text-center mb-4">
                <h3 className="font-semibold">{planLabels[plan]}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">${getMonthlyEquivalent(plan)}</span>
                  <span className="text-muted-foreground">/{t('mo')}</span>
                </div>
                {isYearly && plan !== 'free' && (
                  <p className="text-sm text-muted-foreground">
                    ${getPrice(plan)}/{t('year')}
                  </p>
                )}
                {isYearly && getSavings(plan) > 0 && (
                  <Badge variant="secondary" className="mt-1">
                    {t('save', { percent: getSavings(plan) })}
                  </Badge>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 text-sm mb-4">
                {getPlanFeatures(plan).slice(0, 5).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Action Button */}
              <div className="mt-auto">
                {isCurrentPlan(plan) ? (
                  <Button variant="outline" className="w-full" disabled>
                    {t('currentPlanLabel')}
                  </Button>
                ) : plan === 'free' ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onSelectPlan('pro', isYearly ? 'yearly' : 'monthly')}
                    disabled
                  >
                    {t('downgradeToFree')}
                  </Button>
                ) : plan === 'enterprise' ? (
                  <Button variant="outline" className="w-full" asChild>
                    <a href="mailto:support@md2pdf.com">{tPricing('contactSales')}</a>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => onSelectPlan(plan as Exclude<PlanType, 'free'>, isYearly ? 'yearly' : 'monthly')}
                    disabled={loading}
                    variant={isDowngrade(plan) ? 'outline' : 'default'}
                  >
                    {isDowngrade(plan) ? t('downgrade') : t('upgrade')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
