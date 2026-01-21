'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CurrentPlan, PlanComparison, BillingHistory, Invoice } from '@/components/dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PlanType } from '@/lib/plans/config';

interface SubscriptionData {
  plan: PlanType;
  status: 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';
  billing: 'monthly' | 'yearly' | null;
  gateway: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionId: string | null;
  customerId: string | null;
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('dashboard.subscription');

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [changePlanDialogOpen, setChangePlanDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    try {
      const [subRes, invoicesRes] = await Promise.all([
        fetch('/api/subscriptions'),
        fetch('/api/subscriptions/invoices'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
      toast.error(t('fetchError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchSubscription();
    }
  }, [session, fetchSubscription]);

  // Handle plan change
  const handleChangePlan = async (
    plan: Exclude<PlanType, 'free'>,
    billing: 'monthly' | 'yearly'
  ) => {
    try {
      // Redirect to checkout
      const params = new URLSearchParams({
        plan,
        billing,
      });
      router.push(`/pricing?${params.toString()}`);
    } catch (error) {
      console.error('Failed to change plan:', error);
      toast.error(t('changePlanError'));
    }
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate: false }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel');
      }

      await response.json();
      toast.success(t('cancelSuccess'));
      setCancelDialogOpen(false);

      // Refresh subscription data
      await fetchSubscription();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      toast.error(t('cancelError'));
    } finally {
      setCanceling(false);
    }
  };

  if (status === 'loading' || loading) {
    return <SubscriptionSkeleton />;
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t('noSubscription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      {/* Current Plan */}
      <CurrentPlan
        plan={subscription.plan}
        status={subscription.status}
        billing={subscription.billing || 'monthly'}
        currentPeriodEnd={subscription.currentPeriodEnd || undefined}
        cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
        onChangePlan={() => setChangePlanDialogOpen(true)}
        onCancelSubscription={() => setCancelDialogOpen(true)}
      />

      {/* Billing History */}
      <BillingHistory invoices={invoices} />

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cancelDialogTitle')}</DialogTitle>
            <DialogDescription>{t('cancelDialogDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• {t('cancelWarning1')}</li>
              <li>• {t('cancelWarning2')}</li>
              <li>• {t('cancelWarning3')}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              {t('keepSubscription')}
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={canceling}>
              {canceling ? t('canceling') : t('confirmCancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={changePlanDialogOpen} onOpenChange={setChangePlanDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t('changePlanTitle')}</DialogTitle>
            <DialogDescription>{t('changePlanDescription')}</DialogDescription>
          </DialogHeader>
          <PlanComparison
            currentPlan={subscription.plan}
            onSelectPlan={(plan, billing) => {
              setChangePlanDialogOpen(false);
              handleChangePlan(plan, billing);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-48 rounded-lg" />
    </div>
  );
}
