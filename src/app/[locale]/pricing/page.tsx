'use client';

import { Suspense, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, Zap, Users, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLANS, PlanType } from '@/lib/plans/config';
import { Link } from '@/i18n/routing';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

function PricingContent() {
  const t = useTranslations('pricing');
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const currentPlan = session?.user?.plan || 'free';

  // Handle success/cancel URL parameters from Stripe checkout
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const plan = searchParams.get('plan');
      toast.success(`Successfully upgraded to ${plan} plan!`);
      // Clear URL parameters
      window.history.replaceState({}, '', '/pricing');
    } else if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout was canceled.');
      window.history.replaceState({}, '', '/pricing');
    }
  }, [searchParams]);

  const planIcons: Record<PlanType, React.ReactNode> = {
    free: <Zap className="h-6 w-6" />,
    pro: <Zap className="h-6 w-6" />,
    team: <Users className="h-6 w-6" />,
    enterprise: <Building2 className="h-6 w-6" />,
  };

  const planStyles: Record<PlanType, string> = {
    free: 'border-gray-200 dark:border-gray-800',
    pro: 'border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/20',
    team: 'border-purple-500 dark:border-purple-400',
    enterprise: 'border-amber-500 dark:border-amber-400',
  };

  const getPrice = (plan: typeof PLANS.free) => {
    if (plan.priceMonthly === 0) return '$0';
    if (isYearly) {
      return `$${Math.round(plan.priceYearly / 12)}`;
    }
    return `$${plan.priceMonthly}`;
  };

  const getFeatures = (planId: PlanType): string[] => {
    const features = t.raw(`${planId}.features`) as string[];
    return features || [];
  };

  const handleCheckout = async (planId: PlanType) => {
    if (planId === 'free' || planId === 'enterprise') return;

    setLoadingPlan(planId);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planId,
          billing: isYearly ? 'yearly' : 'monthly',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-xl text-muted-foreground mb-8">{t('subtitle')}</p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="billing" className={cn(!isYearly && 'font-semibold')}>
            {t('monthly')}
          </Label>
          <Switch id="billing" checked={isYearly} onCheckedChange={setIsYearly} />
          <Label htmlFor="billing" className={cn(isYearly && 'font-semibold')}>
            {t('yearly')}
            <span className="ms-2 text-green-600 dark:text-green-400 text-sm">
              {t('save', { percent: '20' })}
            </span>
          </Label>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {(Object.keys(PLANS) as PlanType[]).map((planId) => {
          const plan = PLANS[planId];
          const isCurrentPlan = currentPlan === planId;
          const isPopular = planId === 'pro';
          const isLoading = loadingPlan === planId;

          return (
            <Card
              key={planId}
              className={cn(
                'relative flex flex-col transition-all duration-200 hover:shadow-lg',
                planStyles[planId],
                isPopular && 'scale-105'
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10">
                  {planIcons[planId]}
                </div>
                <CardTitle className="text-2xl">{t(`${planId}.name`)}</CardTitle>
                <CardDescription className="min-h-[48px]">
                  {t(`${planId}.description`)}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center flex-1">
                <div className="mb-6">
                  <span className="text-4xl font-bold">{getPrice(plan)}</span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-muted-foreground">/{t('monthly').toLowerCase()}</span>
                  )}
                </div>

                <ul className="space-y-3 text-sm text-start">
                  {getFeatures(planId).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" variant="outline" disabled>
                    {t('currentPlan')}
                  </Button>
                ) : planId === 'free' ? (
                  <Button className="w-full" variant="outline" disabled>
                    {t('currentPlan')}
                  </Button>
                ) : planId === 'enterprise' ? (
                  <Button className="w-full" variant="outline" asChild>
                    <a href="mailto:contact@md2pdf.com">{t('contactSales')}</a>
                  </Button>
                ) : !session ? (
                  <Button className="w-full" asChild>
                    <Link href="/auth/register">{t('getStarted')}</Link>
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={isPopular ? 'default' : 'outline'}
                    onClick={() => handleCheckout(planId)}
                    disabled={isLoading || loadingPlan !== null}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      t('getStarted')
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-muted-foreground">
              Yes, you can upgrade or downgrade your plan at any time. Changes take effect
              immediately.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-muted-foreground">
              We accept all major credit cards (Visa, MasterCard, American Express) through Stripe.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">
              Our Free plan is always available with generous limits. You can test all features
              before upgrading.
            </p>
          </div>
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">What happens when I reach my limit?</h3>
            <p className="text-muted-foreground">
              You&apos;ll receive a notification and can either wait for the daily reset or upgrade
              your plan for more capacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingLoading() {
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-48 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto mb-8" />
        <Skeleton className="h-8 w-64 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="text-center pb-2">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-24 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </CardHeader>
            <CardContent className="text-center flex-1">
              <Skeleton className="h-10 w-20 mx-auto mb-6" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingLoading />}>
      <PricingContent />
    </Suspense>
  );
}
