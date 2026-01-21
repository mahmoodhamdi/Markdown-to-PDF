'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, HelpCircle, Zap, Building } from 'lucide-react';
import { PLANS, PlanType } from '@/lib/plans/config';
import { cn } from '@/lib/utils';

interface PlanComparisonProps {
  currentPlan: PlanType;
  onSelectPlan: (plan: Exclude<PlanType, 'free'>, billing: 'monthly' | 'yearly') => void;
  loading?: boolean;
  showProration?: boolean;
  proratedAmount?: number;
}

// Feature tooltips explaining what each feature means
const featureTooltips: Record<string, string> = {
  conversions: 'Number of markdown to PDF conversions allowed per day',
  storage: 'Cloud storage for saving your generated PDFs',
  themes: 'Premium document themes for professional-looking PDFs',
  watermark: 'Free tier includes a small watermark on generated PDFs',
  customCss: 'Add your own CSS styling to customize document appearance',
  headers: 'Add custom headers and footers to your PDFs',
  support: 'Level of customer support and response times',
  teamMembers: 'Number of team members who can access shared resources',
  api: 'API access for programmatic PDF generation',
  priority: 'Faster processing queue for PDF generation',
};

export function PlanComparison({
  currentPlan,
  onSelectPlan,
  loading,
  showProration,
  proratedAmount,
}: PlanComparisonProps) {
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

  const planDescriptions: Record<string, string> = {
    free: t('freePlan.description'),
    pro: t('proPlan.description'),
    team: t('teamPlan.description'),
    enterprise: t('enterprisePlan.description'),
  };

  const plans: PlanType[] = ['free', 'pro', 'team', 'enterprise'];

  const getPrice = (plan: PlanType) => {
    if (plan === 'free') return 0;
    return isYearly ? PLANS[plan].priceYearly : PLANS[plan].priceMonthly;
  };

  const getMonthlyEquivalent = (plan: PlanType) => {
    if (plan === 'free') return 0;
    return isYearly ? Math.round(PLANS[plan].priceYearly / 12) : PLANS[plan].priceMonthly;
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
  const isUpgrade = (plan: PlanType) => {
    const planOrder = { free: 0, pro: 1, team: 2, enterprise: 3 };
    return planOrder[plan] > planOrder[currentPlan];
  };

  const getActionButton = (plan: PlanType) => {
    if (isCurrentPlan(plan)) {
      return (
        <Button variant="outline" className="w-full" disabled>
          <Check className="h-4 w-4 me-2" />
          {t('currentPlanLabel')}
        </Button>
      );
    }

    if (plan === 'free') {
      return (
        <Button variant="outline" className="w-full" disabled>
          {t('downgradeToFree')}
        </Button>
      );
    }

    if (plan === 'enterprise') {
      return (
        <Button variant="outline" className="w-full" asChild>
          <a href="mailto:support@md2pdf.com">
            <Building className="h-4 w-4 me-2" />
            {tPricing('contactSales')}
          </a>
        </Button>
      );
    }

    return (
      <Button
        className="w-full"
        onClick={() =>
          onSelectPlan(plan as Exclude<PlanType, 'free'>, isYearly ? 'yearly' : 'monthly')
        }
        disabled={loading}
        variant={isDowngrade(plan) ? 'outline' : 'default'}
      >
        {isDowngrade(plan) ? t('downgrade') : t('upgrade')}
      </Button>
    );
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>{t('comparePlans')}</CardTitle>
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-2">
              <Label
                htmlFor="billing-toggle"
                className={cn(
                  'text-sm cursor-pointer transition-colors',
                  !isYearly && 'font-medium'
                )}
              >
                {t('monthly')}
              </Label>
              <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
              <Label
                htmlFor="billing-toggle"
                className={cn(
                  'text-sm cursor-pointer transition-colors flex items-center gap-2',
                  isYearly && 'font-medium'
                )}
              >
                {t('yearly')}
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  {tPricing('save', { percent: '20' })}
                </Badge>
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Proration notice */}
          {showProration && isUpgrade(currentPlan) && proratedAmount !== undefined && (
            <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                {t('prorationNotice', { amount: proratedAmount.toFixed(2) })}
              </p>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isPopular = plan === 'pro';
              const isCurrent = isCurrentPlan(plan);

              return (
                <div
                  key={plan}
                  className={cn(
                    'relative rounded-lg border p-4 transition-all flex flex-col',
                    isCurrent
                      ? 'border-primary ring-2 ring-primary'
                      : 'hover:border-primary/50 hover:shadow-md',
                    isPopular && !isCurrent && 'border-primary/50'
                  )}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-sm">
                        <Zap className="h-3 w-3 me-1" />
                        {tPricing('mostPopular')}
                      </Badge>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="text-center mb-4 pt-2">
                    <h3 className="font-semibold text-lg">{planLabels[plan]}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{planDescriptions[plan]}</p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${getMonthlyEquivalent(plan)}</span>
                      <span className="text-muted-foreground">/{t('mo')}</span>
                    </div>
                    {isYearly && plan !== 'free' && (
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="line-through">${PLANS[plan].priceMonthly * 12}</span>{' '}
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ${getPrice(plan)}/{t('year')}
                        </span>
                      </p>
                    )}
                    {isYearly && getSavings(plan) > 0 && (
                      <Badge
                        variant="secondary"
                        className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      >
                        {t('save', { percent: getSavings(plan) })}
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 text-sm mb-6 flex-1">
                    {getPlanFeatures(plan)
                      .slice(0, 6)
                      .map((feature, index) => {
                        const featureKey = Object.keys(featureTooltips)[index];
                        const tooltip = featureKey ? featureTooltips[featureKey] : null;

                        return (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span className="flex-1">{feature}</span>
                            {tooltip && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className="text-muted-foreground hover:text-foreground">
                                    <HelpCircle className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="text-sm">{tooltip}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </li>
                        );
                      })}
                  </ul>

                  {/* Action Button */}
                  <div className="mt-auto">{getActionButton(plan)}</div>
                </div>
              );
            })}
          </div>

          {/* Feature comparison link */}
          <div className="mt-6 text-center">
            <Button variant="link" asChild>
              <a href="/pricing#features">{t('seeAllFeatures')}</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
