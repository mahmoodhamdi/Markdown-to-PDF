import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';
import { ConversionStats } from '@/components/dashboard/ConversionStats';
import { ThemeUsage } from '@/components/dashboard/ThemeUsage';
import { TemplateUsage } from '@/components/dashboard/TemplateUsage';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'dashboard.analytics': {
        conversions: 'Conversions',
        apiCalls: 'API Calls',
        totalConversions: 'total conversions',
        totalApiCalls: 'total API calls',
        noData: 'No data available',
        conversionsToday: 'Conversions Today',
        apiCallsToday: 'API Calls Today',
        uploadsThisWeek: 'Uploads This Week',
        downloadsThisWeek: 'Downloads This Week',
        unlimited: 'Unlimited',
        of: 'of',
        files: 'files',
        topThemes: 'Top Themes',
        themeUsageNote: 'Based on your document theme selections',
        other: 'Other',
        noThemeUsage: 'No theme usage data',
        topTemplates: 'Top Templates',
        uses: 'uses',
        noTemplateUsage: 'No templates used yet',
        templateUsageNote: 'Based on templates selected this month',
      },
      'themes.builtIn': {
        github: 'GitHub',
        academic: 'Academic',
        minimal: 'Minimal',
        dark: 'Dark',
      },
      templates: {
        'resume.name': 'Resume',
        'meeting-notes.name': 'Meeting Notes',
        'readme.name': 'README',
        'report.name': 'Report',
      },
    };
    return translations[namespace]?.[key] || key;
  },
}));

const mockDailyData = [
  {
    date: '2024-12-20',
    conversions: 10,
    apiCalls: 50,
    fileUploads: 5,
    fileDownloads: 3,
    templatesUsed: 2,
    batchConversions: 1,
    storageUsed: 1024,
  },
  {
    date: '2024-12-21',
    conversions: 15,
    apiCalls: 60,
    fileUploads: 8,
    fileDownloads: 5,
    templatesUsed: 3,
    batchConversions: 2,
    storageUsed: 2048,
  },
  {
    date: '2024-12-22',
    conversions: 20,
    apiCalls: 45,
    fileUploads: 6,
    fileDownloads: 4,
    templatesUsed: 4,
    batchConversions: 1,
    storageUsed: 3072,
  },
];

const mockSummary = {
  today: {
    date: '2024-12-26',
    conversions: 25,
    apiCalls: 100,
    fileUploads: 10,
    fileDownloads: 8,
    templatesUsed: 5,
    batchConversions: 2,
    storageUsed: 4096,
  },
  thisWeek: {
    date: '2024-12-20 to 2024-12-26',
    conversions: 100,
    apiCalls: 400,
    fileUploads: 30,
    fileDownloads: 25,
    templatesUsed: 15,
    batchConversions: 8,
    storageUsed: 4096,
  },
  thisMonth: {
    date: '2024-12-01 to 2024-12-26',
    conversions: 300,
    apiCalls: 1200,
    fileUploads: 80,
    fileDownloads: 60,
    templatesUsed: 40,
    batchConversions: 20,
    storageUsed: 4096,
  },
  limits: {
    conversionsPerDay: 500 as number | 'unlimited',
    apiCallsPerDay: 1000 as number | 'unlimited',
  },
  remaining: {
    conversionsToday: 475 as number | 'unlimited',
    apiCallsToday: 900 as number | 'unlimited',
  },
  plan: 'pro',
};

const mockThemeData = [
  { theme: 'github', count: 45, percentage: 45 },
  { theme: 'academic', count: 28, percentage: 28 },
  { theme: 'minimal', count: 18, percentage: 18 },
  { theme: 'other', count: 9, percentage: 9 },
];

const mockTemplateData = [
  { template: 'resume', count: 16, percentage: 40 },
  { template: 'meeting-notes', count: 14, percentage: 35 },
  { template: 'readme', count: 6, percentage: 15 },
  { template: 'report', count: 4, percentage: 10 },
];

describe('AnalyticsChart', () => {
  it('renders chart with data', () => {
    render(<AnalyticsChart data={mockDailyData} />);

    // Legend should be visible (may appear multiple times)
    const conversionsElements = screen.getAllByText('Conversions');
    expect(conversionsElements.length).toBeGreaterThan(0);

    const apiCallsElements = screen.getAllByText('API Calls');
    expect(apiCallsElements.length).toBeGreaterThan(0);

    // Summary should show totals (may appear multiple times in screen reader table)
    const total45 = screen.getAllByText('45');
    expect(total45.length).toBeGreaterThan(0); // Total conversions

    expect(screen.getByText('155')).toBeInTheDocument(); // Total API calls
  });

  it('renders empty state when no data', () => {
    render(<AnalyticsChart data={[]} />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AnalyticsChart data={mockDailyData} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});

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

    // Today's conversions (appears in first card)
    const cards = screen.getAllByRole('generic').filter(el => el.textContent?.includes('Conversions Today'));
    expect(cards.length).toBeGreaterThan(0);

    // Check all values are rendered - use getAllByText since values may repeat
    const value25 = screen.getAllByText('25');
    expect(value25.length).toBeGreaterThanOrEqual(2); // Conversions today and downloads this week

    const value100 = screen.getAllByText('100');
    expect(value100.length).toBeGreaterThanOrEqual(1);

    const value30 = screen.getAllByText('30');
    expect(value30.length).toBeGreaterThanOrEqual(1);
  });

  it('shows unlimited text for unlimited plans', () => {
    const unlimitedSummary = {
      ...mockSummary,
      limits: {
        conversionsPerDay: 'unlimited' as const,
        apiCallsPerDay: 'unlimited' as const,
      },
    };

    render(<ConversionStats summary={unlimitedSummary} />);

    const unlimitedTexts = screen.getAllByText('Unlimited');
    expect(unlimitedTexts).toHaveLength(2);
  });
});

describe('ThemeUsage', () => {
  it('renders theme usage card', () => {
    render(<ThemeUsage data={mockThemeData} />);

    expect(screen.getByText('Top Themes')).toBeInTheDocument();
  });

  it('displays all themes with percentages', () => {
    render(<ThemeUsage data={mockThemeData} />);

    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Academic')).toBeInTheDocument();
    expect(screen.getByText('Minimal')).toBeInTheDocument();

    // Check percentages are displayed (as part of count display)
    const elements45 = screen.getAllByText(/45/);
    expect(elements45.length).toBeGreaterThan(0);
  });

  it('shows usage note', () => {
    render(<ThemeUsage data={mockThemeData} />);

    expect(screen.getByText('Based on your document theme selections')).toBeInTheDocument();
  });
});

describe('TemplateUsage', () => {
  it('renders template usage card', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    expect(screen.getByText('Top Templates')).toBeInTheDocument();
  });

  it('displays templates with usage counts', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    // Resume should be visible
    expect(screen.getByText('Resume')).toBeInTheDocument();

    // Meeting Notes should be visible
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
  });

  it('shows empty state when no templates used', () => {
    render(<TemplateUsage data={[]} totalTemplatesUsed={0} />);

    expect(screen.getByText('No templates used yet')).toBeInTheDocument();
  });

  it('shows usage note', () => {
    render(<TemplateUsage data={mockTemplateData} />);

    expect(screen.getByText('Based on templates selected this month')).toBeInTheDocument();
  });
});
