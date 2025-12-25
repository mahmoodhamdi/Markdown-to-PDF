import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      dashboard: {
        welcome: 'Welcome back, {name}!',
        welcomeSubtitle: "Here's an overview of your account activity",
        user: 'User',
        quickActions: 'Quick Actions',
        'actions.newDocument': 'New Document',
        'actions.uploadFiles': 'Upload Files',
        'actions.browseTemplates': 'Browse Templates',
        'upgrade.title': 'Upgrade to Pro',
        'upgrade.description': 'Get more conversions, larger files, and premium features.',
        'upgrade.button': 'View Plans',
      },
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
    return (key: string, params?: Record<string, string>) => {
      let value = translations[namespace]?.[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, v);
        });
      }
      return value;
    };
  },
}));

// Mock i18n routing
vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('DashboardOverview', () => {
  const defaultProps = {
    userName: 'John',
    conversionsToday: 15,
    conversionsLimit: 20,
    storageUsed: '50 MB',
    storageLimit: '100 MB',
    plan: 'free' as const,
  };

  it('should render welcome message with user name', () => {
    render(<DashboardOverview {...defaultProps} />);
    expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
  });

  it('should render welcome subtitle', () => {
    render(<DashboardOverview {...defaultProps} />);
    expect(screen.getByText("Here's an overview of your account activity")).toBeInTheDocument();
  });

  it('should render quick actions section', () => {
    render(<DashboardOverview {...defaultProps} />);
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('should render quick action buttons', () => {
    render(<DashboardOverview {...defaultProps} />);
    expect(screen.getByText('New Document')).toBeInTheDocument();
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Browse Templates')).toBeInTheDocument();
  });

  it('should show upgrade CTA for free users', () => {
    render(<DashboardOverview {...defaultProps} plan="free" />);
    expect(screen.getByText('Upgrade to Pro')).toBeInTheDocument();
    expect(screen.getByText('View Plans')).toBeInTheDocument();
  });

  it('should not show upgrade CTA for pro users', () => {
    render(<DashboardOverview {...defaultProps} plan="pro" />);
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });

  it('should not show upgrade CTA for team users', () => {
    render(<DashboardOverview {...defaultProps} plan="team" />);
    expect(screen.queryByText('Upgrade to Pro')).not.toBeInTheDocument();
  });

  it('should use default user name when not provided', () => {
    render(<DashboardOverview {...defaultProps} userName={undefined} />);
    expect(screen.getByText('Welcome back, User!')).toBeInTheDocument();
  });
});
