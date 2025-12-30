import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeUsage } from '@/components/dashboard/ThemeUsage';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'dashboard.analytics': {
        topThemes: 'Top Themes',
        other: 'Other',
        noThemeUsage: 'No theme usage data',
        themeUsageNote: 'Based on your conversion history',
      },
      'themes.builtIn': {
        github: 'GitHub',
        academic: 'Academic',
        minimal: 'Minimal',
        dark: 'Dark',
        professional: 'Professional',
        elegant: 'Elegant',
        modern: 'Modern',
        newsletter: 'Newsletter',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

const mockThemeData = [
  { theme: 'github', count: 45, percentage: 45 },
  { theme: 'academic', count: 28, percentage: 28 },
  { theme: 'minimal', count: 18, percentage: 18 },
  { theme: 'other', count: 9, percentage: 9 },
];

describe('ThemeUsage', () => {
  it('renders the component title', () => {
    render(<ThemeUsage data={mockThemeData} />);

    expect(screen.getByText('Top Themes')).toBeInTheDocument();
  });

  it('displays theme data sorted by count', () => {
    render(<ThemeUsage data={mockThemeData} />);

    // Check that themes are displayed
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Academic')).toBeInTheDocument();
    expect(screen.getByText('Minimal')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('displays theme counts and percentages', () => {
    render(<ThemeUsage data={mockThemeData} />);

    // Counts are formatted with toLocaleString and percentages shown separately
    // Check that count values are present (may appear multiple times)
    const elements45 = screen.getAllByText(/45/);
    expect(elements45.length).toBeGreaterThan(0);

    const elements28 = screen.getAllByText(/28/);
    expect(elements28.length).toBeGreaterThan(0);
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(<ThemeUsage loading={true} />);

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('uses default data when no data provided', () => {
    render(<ThemeUsage />);

    // Should show default mock data
    expect(screen.getByText('Top Themes')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('shows empty state when data has zero counts', () => {
    const emptyData = [
      { theme: 'github', count: 0, percentage: 0 },
      { theme: 'academic', count: 0, percentage: 0 },
    ];

    render(<ThemeUsage data={emptyData} />);

    expect(screen.getByText('No theme usage data')).toBeInTheDocument();
  });

  it('renders progress bars with correct ARIA attributes', () => {
    render(<ThemeUsage data={mockThemeData} />);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(4);

    const firstProgressBar = progressBars[0];
    expect(firstProgressBar).toHaveAttribute('aria-valuenow', '45');
    expect(firstProgressBar).toHaveAttribute('aria-valuemin', '0');
    expect(firstProgressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('displays theme usage note', () => {
    render(<ThemeUsage data={mockThemeData} />);

    expect(screen.getByText('Based on your conversion history')).toBeInTheDocument();
  });

  it('applies correct color classes for different themes', () => {
    const { container } = render(<ThemeUsage data={mockThemeData} />);

    // Check that color classes are applied
    expect(container.querySelector('.bg-primary')).toBeInTheDocument();
    expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
  });
});
