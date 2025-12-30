import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversionStats } from '@/components/dashboard/ConversionStats';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      conversionsToday: 'Conversions Today',
      apiCallsToday: 'API Calls Today',
      uploadsThisWeek: 'Uploads This Week',
      downloadsThisWeek: 'Downloads This Week',
      unlimited: 'Unlimited',
      of: 'of',
      files: 'files',
      noChange: 'No change',
      trendUp: 'Up {percent}%',
      trendDown: 'Down {percent}%',
      vsLastWeek: 'vs last week',
    };
    return translations[key] || key;
  },
}));

const mockSummary = {
  today: {
    date: '2024-01-03',
    conversions: 25,
    apiCalls: 100,
    fileUploads: 10,
    fileDownloads: 5,
    templatesUsed: 5,
    batchConversions: 2,
    storageUsed: 5000,
  },
  thisWeek: {
    date: '2024-01-03',
    conversions: 100,
    apiCalls: 400,
    fileUploads: 50,
    fileDownloads: 25,
    templatesUsed: 20,
    batchConversions: 10,
    storageUsed: 25000,
  },
  thisMonth: {
    date: '2024-01-03',
    conversions: 300,
    apiCalls: 1200,
    fileUploads: 150,
    fileDownloads: 75,
    templatesUsed: 60,
    batchConversions: 30,
    storageUsed: 75000,
  },
  limits: {
    conversionsPerDay: 100 as number | 'unlimited',
    apiCallsPerDay: 500 as number | 'unlimited',
  },
  remaining: {
    conversionsToday: 75 as number | 'unlimited',
    apiCallsToday: 400 as number | 'unlimited',
  },
  plan: 'pro',
};

describe('ConversionStats', () => {
  it('renders all stat cards', () => {
    render(<ConversionStats summary={mockSummary} />);

    expect(screen.getByText('Conversions Today')).toBeInTheDocument();
    expect(screen.getByText('API Calls Today')).toBeInTheDocument();
    expect(screen.getByText('Uploads This Week')).toBeInTheDocument();
    expect(screen.getByText('Downloads This Week')).toBeInTheDocument();
  });

  it('displays correct values', () => {
    render(<ConversionStats summary={mockSummary} />);

    // Use getAllByText since values may appear multiple times
    const values25 = screen.getAllByText('25');
    expect(values25.length).toBeGreaterThan(0);

    const values100 = screen.getAllByText('100');
    expect(values100.length).toBeGreaterThan(0);

    const values50 = screen.getAllByText('50');
    expect(values50.length).toBeGreaterThan(0);
  });

  it('shows unlimited when limits are unlimited', () => {
    const unlimitedSummary = {
      ...mockSummary,
      limits: {
        conversionsPerDay: 'unlimited' as const,
        apiCallsPerDay: 'unlimited' as const,
      },
    };

    render(<ConversionStats summary={unlimitedSummary} />);

    const unlimitedElements = screen.getAllByText('Unlimited');
    expect(unlimitedElements.length).toBeGreaterThanOrEqual(2);
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(<ConversionStats summary={mockSummary} loading={true} />);

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows trend indicators when previousWeek is available', () => {
    const summaryWithPrevious = {
      ...mockSummary,
      previousWeek: {
        date: '2023-12-27',
        conversions: 80,
        apiCalls: 300,
        fileUploads: 40,
        fileDownloads: 20,
        templatesUsed: 15,
        batchConversions: 8,
        storageUsed: 20000,
      },
    };

    render(<ConversionStats summary={summaryWithPrevious} />);

    // Should show trend indicators (the percentage change) - may appear multiple times
    const vsLastWeekElements = screen.getAllByText('vs last week');
    expect(vsLastWeekElements.length).toBeGreaterThan(0);
  });

  it('renders grid with 4 columns on large screens', () => {
    const { container } = render(<ConversionStats summary={mockSummary} />);

    const grid = container.querySelector('.grid');
    expect(grid).toHaveClass('lg:grid-cols-4');
  });
});
