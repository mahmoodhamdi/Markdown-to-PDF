import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickStats } from '@/components/dashboard/QuickStats';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      'dashboard.stats': {
        conversionsToday: 'Conversions Today',
        apiCalls: 'API Calls',
        storageUsed: 'Storage Used',
        currentPlan: 'Current Plan',
        today: 'Today',
        of: 'of',
      },
      auth: {
        free: 'Free',
        pro: 'Pro',
        team: 'Team',
        enterprise: 'Enterprise',
      },
    };
    return (key: string) => translations[namespace]?.[key] || key;
  },
}));

describe('QuickStats', () => {
  const defaultProps = {
    conversionsToday: 15,
    conversionsLimit: 20,
    storageUsed: '50 MB',
    storageLimit: '100 MB',
    plan: 'free' as const,
  };

  it('should render conversions stat', () => {
    render(<QuickStats {...defaultProps} />);
    expect(screen.getByText('Conversions Today')).toBeInTheDocument();
    expect(screen.getByText('15/20')).toBeInTheDocument();
  });

  it('should render storage stat', () => {
    render(<QuickStats {...defaultProps} />);
    expect(screen.getByText('Storage Used')).toBeInTheDocument();
    expect(screen.getByText('50 MB')).toBeInTheDocument();
  });

  it('should render current plan', () => {
    render(<QuickStats {...defaultProps} />);
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('should display infinity symbol for unlimited conversions', () => {
    render(<QuickStats {...defaultProps} conversionsLimit={Infinity} />);
    expect(screen.getByText('15/∞')).toBeInTheDocument();
  });

  it('should display Pro plan correctly', () => {
    render(<QuickStats {...defaultProps} plan="pro" />);
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('should display Team plan correctly', () => {
    render(<QuickStats {...defaultProps} plan="team" />);
    expect(screen.getByText('Team')).toBeInTheDocument();
  });

  it('should display Enterprise plan correctly', () => {
    render(<QuickStats {...defaultProps} plan="enterprise" />);
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('should render all four stat cards', () => {
    const { container } = render(<QuickStats {...defaultProps} />);
    // Each stat is in a Card component
    const cards = container.querySelectorAll('[class*="rounded-lg border"]');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });
});
