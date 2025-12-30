import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsSummaryCard } from '@/components/dashboard/AnalyticsSummaryCard';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'dashboard.analytics': {
        quickSummary: 'Quick Summary',
        totalConversionsThisMonth: 'Total Conversions',
        peakDay: 'Peak Day',
        favoriteTheme: 'Favorite Theme',
        conversions: 'conversions',
      },
      'themes.builtIn': {
        github: 'GitHub',
        academic: 'Academic',
        minimal: 'Minimal',
        dark: 'Dark',
        professional: 'Professional',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

const mockData = [
  {
    date: '2024-01-01',
    conversions: 10,
    apiCalls: 50,
    fileUploads: 5,
    fileDownloads: 3,
    templatesUsed: 2,
    batchConversions: 1,
    storageUsed: 1000,
  },
  {
    date: '2024-01-02',
    conversions: 25, // Peak day
    apiCalls: 60,
    fileUploads: 8,
    fileDownloads: 4,
    templatesUsed: 3,
    batchConversions: 2,
    storageUsed: 1500,
  },
  {
    date: '2024-01-03',
    conversions: 15,
    apiCalls: 70,
    fileUploads: 10,
    fileDownloads: 5,
    templatesUsed: 4,
    batchConversions: 0,
    storageUsed: 2000,
  },
];

describe('AnalyticsSummaryCard', () => {
  it('renders the quick summary title', () => {
    render(<AnalyticsSummaryCard data={mockData} />);

    expect(screen.getByText('Quick Summary')).toBeInTheDocument();
  });

  it('displays total conversions correctly', () => {
    render(<AnalyticsSummaryCard data={mockData} />);

    // Total: 10 + 25 + 15 = 50
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('Total Conversions')).toBeInTheDocument();
  });

  it('identifies and displays peak day', () => {
    render(<AnalyticsSummaryCard data={mockData} />);

    expect(screen.getByText('Peak Day')).toBeInTheDocument();
    // Peak day is January 2nd with 25 conversions (lowercase)
    expect(screen.getByText('25 conversions')).toBeInTheDocument();
  });

  it('displays favorite theme when provided', () => {
    render(<AnalyticsSummaryCard data={mockData} mostUsedTheme="github" />);

    expect(screen.getByText('Favorite Theme')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('shows dash when no favorite theme', () => {
    render(<AnalyticsSummaryCard data={mockData} />);

    expect(screen.getByText('Favorite Theme')).toBeInTheDocument();
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    const { container } = render(<AnalyticsSummaryCard data={[]} loading={true} />);

    const skeletons = container.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('has gradient background', () => {
    const { container } = render(<AnalyticsSummaryCard data={mockData} />);

    const card = container.querySelector('.bg-gradient-to-r');
    expect(card).toBeInTheDocument();
  });

  it('handles empty data array', () => {
    render(<AnalyticsSummaryCard data={[]} />);

    expect(screen.getByText('Quick Summary')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Zero conversions
  });

  it('displays with proper responsive grid', () => {
    const { container } = render(<AnalyticsSummaryCard data={mockData} />);

    const grid = container.querySelector('.sm\\:grid-cols-3');
    expect(grid).toBeInTheDocument();
  });

  it('renders all three summary items', () => {
    render(<AnalyticsSummaryCard data={mockData} mostUsedTheme="professional" />);

    // Three summary items should be present
    expect(screen.getByText('Total Conversions')).toBeInTheDocument();
    expect(screen.getByText('Peak Day')).toBeInTheDocument();
    expect(screen.getByText('Favorite Theme')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();
  });

  it('uses localized number formatting', () => {
    const largeData = [
      {
        date: '2024-01-01',
        conversions: 1500,
        apiCalls: 5000,
        fileUploads: 500,
        fileDownloads: 300,
        templatesUsed: 200,
        batchConversions: 100,
        storageUsed: 100000,
      },
    ];

    render(<AnalyticsSummaryCard data={largeData} />);

    // Should show formatted number (with comma for thousands)
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });
});
