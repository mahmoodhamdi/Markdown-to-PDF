import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrentPlan } from '@/components/dashboard/CurrentPlan';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      'dashboard.subscription': {
        currentPlan: 'Current Plan',
        plan: 'Plan',
        monthly: 'Monthly',
        yearly: 'Yearly',
        statusActive: 'Active',
        statusPastDue: 'Past Due',
        statusCanceled: 'Canceled',
        statusPaused: 'Paused',
        statusTrialing: 'Trial',
        freeForever: 'Free Forever',
        changePlan: 'Change Plan',
        cancelSubscription: 'Cancel Subscription',
        upgrade: 'Upgrade',
        nextBilling: 'Next billing date: {date}',
        cancelsOn: 'Subscription cancels on {date}',
      },
      auth: {
        free: 'Free',
        pro: 'Pro',
        team: 'Team',
        enterprise: 'Enterprise',
      },
      pricing: {
        'free.features': ['20 conversions per day', '500 KB file size limit'],
        'pro.features': ['500 conversions per day', '5 MB file size limit'],
        'team.features': ['Unlimited conversions', '20 MB file size limit'],
        'enterprise.features': ['Everything unlimited', '100,000 API calls per day'],
      },
    };

    const t = (key: string, params?: Record<string, string>) => {
      const ns = namespace;
      const keys = key.split('.');
      let value = translations[ns]?.[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, v);
        });
      }
      return value;
    };

    t.raw = (key: string) => {
      const ns = namespace;
      return translations[ns]?.[key];
    };

    return t;
  },
}));

// Mock @/i18n/routing
vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock @/lib/plans/config
vi.mock('@/lib/plans/config', () => ({
  PLANS: {
    free: { priceMonthly: 0, priceYearly: 0 },
    pro: { priceMonthly: 5, priceYearly: 48 },
    team: { priceMonthly: 15, priceYearly: 144 },
    enterprise: { priceMonthly: 99, priceYearly: 948 },
  },
}));

describe('CurrentPlan', () => {
  const defaultProps = {
    plan: 'pro' as const,
    status: 'active' as const,
    billing: 'monthly' as const,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    cancelAtPeriodEnd: false,
    onChangePlan: vi.fn(),
    onCancelSubscription: vi.fn(),
  };

  it('should render current plan title', () => {
    render(<CurrentPlan {...defaultProps} />);
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });

  it('should render plan name', () => {
    render(<CurrentPlan {...defaultProps} />);
    expect(screen.getByText(/Pro/)).toBeInTheDocument();
  });

  it('should render status badge for active status', () => {
    render(<CurrentPlan {...defaultProps} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render status badge for past_due status', () => {
    render(<CurrentPlan {...defaultProps} status="past_due" />);
    expect(screen.getByText('Past Due')).toBeInTheDocument();
  });

  it('should render status badge for canceled status', () => {
    render(<CurrentPlan {...defaultProps} status="canceled" />);
    expect(screen.getByText('Canceled')).toBeInTheDocument();
  });

  it('should render price for paid plans', () => {
    render(<CurrentPlan {...defaultProps} />);
    expect(screen.getByText('$5/Monthly')).toBeInTheDocument();
  });

  it('should render yearly price when yearly billing', () => {
    render(<CurrentPlan {...defaultProps} billing="yearly" />);
    expect(screen.getByText('$48/Yearly')).toBeInTheDocument();
  });

  it('should render Free Forever badge for free plan', () => {
    render(<CurrentPlan {...defaultProps} plan="free" />);
    expect(screen.getByText('Free Forever')).toBeInTheDocument();
  });

  it('should render Upgrade button for free plan', () => {
    render(<CurrentPlan {...defaultProps} plan="free" />);
    expect(screen.getByText('Upgrade')).toBeInTheDocument();
  });

  it('should render Change Plan button for paid plans', () => {
    render(<CurrentPlan {...defaultProps} />);
    expect(screen.getByText('Change Plan')).toBeInTheDocument();
  });

  it('should render Cancel Subscription button for active paid plans', () => {
    render(<CurrentPlan {...defaultProps} />);
    expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
  });

  it('should not render Cancel button when cancelAtPeriodEnd is true', () => {
    render(<CurrentPlan {...defaultProps} cancelAtPeriodEnd={true} />);
    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
  });

  it('should not render Cancel button when status is canceled', () => {
    render(<CurrentPlan {...defaultProps} status="canceled" />);
    expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
  });

  it('should call onChangePlan when Change Plan button is clicked', () => {
    const onChangePlan = vi.fn();
    render(<CurrentPlan {...defaultProps} onChangePlan={onChangePlan} />);
    fireEvent.click(screen.getByText('Change Plan'));
    expect(onChangePlan).toHaveBeenCalled();
  });

  it('should call onCancelSubscription when Cancel Subscription button is clicked', () => {
    const onCancelSubscription = vi.fn();
    render(<CurrentPlan {...defaultProps} onCancelSubscription={onCancelSubscription} />);
    fireEvent.click(screen.getByText('Cancel Subscription'));
    expect(onCancelSubscription).toHaveBeenCalled();
  });

  it('should render check icons for features', () => {
    render(<CurrentPlan {...defaultProps} />);
    const checkIcons = document.querySelectorAll('svg');
    expect(checkIcons.length).toBeGreaterThan(0);
  });
});
