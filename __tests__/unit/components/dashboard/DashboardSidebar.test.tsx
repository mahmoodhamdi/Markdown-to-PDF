import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      overview: 'Overview',
      usage: 'Usage',
      subscription: 'Subscription',
      files: 'Files',
      analytics: 'Analytics',
      settings: 'Settings',
    };
    return (key: string) => translations[key] || key;
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/dashboard',
}));

// Mock i18n routing
vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid={`link-${href}`}>
      {children}
    </a>
  ),
}));

describe('DashboardSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all navigation items', () => {
    render(<DashboardSidebar />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Files')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should have correct links for each navigation item', () => {
    render(<DashboardSidebar />);

    expect(screen.getByTestId('link-/dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('link-/dashboard/usage')).toBeInTheDocument();
    expect(screen.getByTestId('link-/dashboard/subscription')).toBeInTheDocument();
    expect(screen.getByTestId('link-/dashboard/files')).toBeInTheDocument();
    expect(screen.getByTestId('link-/dashboard/analytics')).toBeInTheDocument();
    expect(screen.getByTestId('link-/settings')).toBeInTheDocument();
  });

  it('should render as an aside element', () => {
    const { container } = render(<DashboardSidebar />);
    expect(container.querySelector('aside')).toBeInTheDocument();
  });

  it('should contain navigation element', () => {
    const { container } = render(<DashboardSidebar />);
    expect(container.querySelector('nav')).toBeInTheDocument();
  });
});
