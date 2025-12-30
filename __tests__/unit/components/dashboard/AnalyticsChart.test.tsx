import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      noData: 'No data available for this period',
      conversions: 'Conversions',
      apiCalls: 'API Calls',
      totalConversions: 'total conversions',
      totalApiCalls: 'total API calls',
      dailyAverage: 'daily avg',
      batchConversions: 'Batch conversions',
      date: 'Date',
      conversionChart: 'Conversion History',
    };
    return translations[key] || key;
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
    conversions: 15,
    apiCalls: 60,
    fileUploads: 8,
    fileDownloads: 4,
    templatesUsed: 3,
    batchConversions: 2,
    storageUsed: 1500,
  },
  {
    date: '2024-01-03',
    conversions: 20,
    apiCalls: 70,
    fileUploads: 10,
    fileDownloads: 5,
    templatesUsed: 4,
    batchConversions: 0,
    storageUsed: 2000,
  },
];

describe('AnalyticsChart', () => {
  it('renders empty state when no data is provided', () => {
    render(<AnalyticsChart data={[]} />);
    expect(screen.getByText('No data available for this period')).toBeInTheDocument();
  });

  it('renders chart with data', () => {
    render(<AnalyticsChart data={mockData} />);

    // Check legend items exist (may appear multiple times in different contexts)
    const conversionsElements = screen.getAllByText('Conversions');
    expect(conversionsElements.length).toBeGreaterThan(0);

    const apiCallsElements = screen.getAllByText('API Calls');
    expect(apiCallsElements.length).toBeGreaterThan(0);
  });

  it('displays total conversions and API calls', () => {
    render(<AnalyticsChart data={mockData} />);

    // Total conversions: 10 + 15 + 20 = 45
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('total conversions')).toBeInTheDocument();

    // Total API calls: 50 + 60 + 70 = 180
    expect(screen.getByText('180')).toBeInTheDocument();
    expect(screen.getByText('total API calls')).toBeInTheDocument();
  });

  it('has accessible chart description', () => {
    render(<AnalyticsChart data={mockData} />);

    const chart = screen.getByRole('img');
    expect(chart).toHaveAttribute('aria-label');
  });

  it('renders screen reader table alternative', () => {
    render(<AnalyticsChart data={mockData} />);

    // The sr-only table should exist but not be visible
    const table = document.querySelector('table.sr-only');
    expect(table).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AnalyticsChart data={mockData} className="custom-class" />);

    const chartContainer = container.firstChild;
    expect(chartContainer).toHaveClass('custom-class');
  });

  it('shows bars for each day', () => {
    const { container } = render(<AnalyticsChart data={mockData} />);

    // Check that there are bars (primary and blue)
    const primaryBars = container.querySelectorAll('.bg-primary');
    const blueBars = container.querySelectorAll('.bg-blue-500');

    expect(primaryBars.length).toBeGreaterThan(0);
    expect(blueBars.length).toBeGreaterThan(0);
  });
});
