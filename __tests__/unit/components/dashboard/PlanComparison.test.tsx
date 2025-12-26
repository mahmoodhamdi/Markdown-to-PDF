import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlanComparison } from '@/components/dashboard/PlanComparison';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string | string[]>> = {
      'dashboard.subscription': {
        comparePlans: 'Compare Plans',
        monthly: 'Monthly',
        yearly: 'Yearly',
        mo: 'mo',
        year: 'year',
        save: 'Save {percent}%',
        currentPlanLabel: 'Current Plan',
        downgradeToFree: 'Downgrade to Free',
        upgrade: 'Upgrade',
        downgrade: 'Downgrade',
      },
      auth: {
        free: 'Free',
        pro: 'Pro',
        team: 'Team',
        enterprise: 'Enterprise',
      },
      pricing: {
        save: 'Save {percent}%',
        contactSales: 'Contact Sales',
        'free.features': ['20 conversions per day', '500 KB file size limit'],
        'pro.features': ['500 conversions per day', '5 MB file size limit'],
        'team.features': ['Unlimited conversions', '20 MB file size limit'],
        'enterprise.features': ['Everything unlimited', '100,000 API calls per day'],
      },
    };

    const t = (key: string, params?: Record<string, string | number>) => {
      const ns = namespace;
      let value = (translations[ns]?.[key] as string) || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
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

// Mock @/lib/plans/config
vi.mock('@/lib/plans/config', () => ({
  PLANS: {
    free: { priceMonthly: 0, priceYearly: 0 },
    pro: { priceMonthly: 5, priceYearly: 48 },
    team: { priceMonthly: 15, priceYearly: 144 },
    enterprise: { priceMonthly: 99, priceYearly: 948 },
  },
}));

describe('PlanComparison', () => {
  const defaultProps = {
    currentPlan: 'free' as const,
    onSelectPlan: vi.fn(),
    loading: false,
  };

  it('should render Compare Plans title', () => {
    render(<PlanComparison {...defaultProps} />);
    expect(screen.getByText('Compare Plans')).toBeInTheDocument();
  });

  it('should render all four plan names', () => {
    render(<PlanComparison {...defaultProps} />);
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('Team')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('should render monthly/yearly toggle', () => {
    render(<PlanComparison {...defaultProps} />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Yearly')).toBeInTheDocument();
  });

  it('should show monthly prices by default', () => {
    render(<PlanComparison {...defaultProps} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('$5')).toBeInTheDocument();
    expect(screen.getByText('$15')).toBeInTheDocument();
    expect(screen.getByText('$99')).toBeInTheDocument();
  });

  it('should show yearly equivalent monthly prices when yearly is selected', () => {
    render(<PlanComparison {...defaultProps} />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    // Yearly prices divided by 12: Pro = $48/12 = $4, Team = $144/12 = $12
    expect(screen.getByText('$4')).toBeInTheDocument();
    expect(screen.getByText('$12')).toBeInTheDocument();
  });

  it('should render Current Plan button for the current plan', () => {
    render(<PlanComparison {...defaultProps} currentPlan="pro" />);
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
  });

  it('should render Upgrade button for higher plans', () => {
    render(<PlanComparison {...defaultProps} currentPlan="free" />);
    const upgradeButtons = screen.getAllByText('Upgrade');
    expect(upgradeButtons.length).toBeGreaterThan(0);
  });

  it('should render Downgrade button for lower plans', () => {
    render(<PlanComparison {...defaultProps} currentPlan="team" />);
    expect(screen.getByText('Downgrade')).toBeInTheDocument();
  });

  it('should render Contact Sales for enterprise plan', () => {
    render(<PlanComparison {...defaultProps} />);
    expect(screen.getByText('Contact Sales')).toBeInTheDocument();
  });

  it('should call onSelectPlan when upgrade button is clicked', () => {
    const onSelectPlan = vi.fn();
    render(<PlanComparison {...defaultProps} onSelectPlan={onSelectPlan} />);
    const upgradeButtons = screen.getAllByText('Upgrade');
    fireEvent.click(upgradeButtons[0]);
    expect(onSelectPlan).toHaveBeenCalledWith('pro', 'monthly');
  });

  it('should call onSelectPlan with yearly billing when yearly is selected', () => {
    const onSelectPlan = vi.fn();
    render(<PlanComparison {...defaultProps} onSelectPlan={onSelectPlan} />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    const upgradeButtons = screen.getAllByText('Upgrade');
    fireEvent.click(upgradeButtons[0]);
    expect(onSelectPlan).toHaveBeenCalledWith('pro', 'yearly');
  });

  it('should disable buttons when loading', () => {
    render(<PlanComparison {...defaultProps} loading={true} />);
    const upgradeButtons = screen.getAllByText('Upgrade');
    upgradeButtons.forEach((button) => {
      expect(button.closest('button')).toBeDisabled();
    });
  });

  it('should render check icons for features', () => {
    render(<PlanComparison {...defaultProps} />);
    const checkIcons = document.querySelectorAll('svg');
    expect(checkIcons.length).toBeGreaterThan(0);
  });

  it('should highlight current plan with ring', () => {
    render(<PlanComparison {...defaultProps} currentPlan="pro" />);
    const proCard = screen.getByText('Pro').closest('div[class*="rounded-lg"]');
    expect(proCard).toHaveClass('ring-2');
  });
});
