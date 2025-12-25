import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageHistory } from '@/components/dashboard/UsageHistory';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      thisWeek: 'This Week',
      noHistoryData: 'No usage data available yet',
      conversionsLabel: 'conversions',
      totalConversions: 'Total Conversions',
      totalApiCalls: 'Total API Calls',
    };
    return (key: string) => translations[key] || key;
  },
}));

describe('UsageHistory', () => {
  const generateMockData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        conversions: 10 + i,
        apiCalls: 20 + i * 2,
      });
    }
    return data;
  };

  it('should render card title', () => {
    render(<UsageHistory data={generateMockData()} />);
    expect(screen.getByText('This Week')).toBeInTheDocument();
  });

  it('should render empty state when no data', () => {
    render(<UsageHistory data={[]} />);
    expect(screen.getByText('No usage data available yet')).toBeInTheDocument();
  });

  it('should render bars for each day', () => {
    const data = generateMockData();
    const { container } = render(<UsageHistory data={data} />);
    // Each day should have a progress bar
    const bars = container.querySelectorAll('.rounded-full.transition-all');
    expect(bars.length).toBeGreaterThanOrEqual(data.length);
  });

  it('should show conversion counts', () => {
    const data = generateMockData();
    render(<UsageHistory data={data} />);
    // Should show "conversions" labels (text may be split across elements)
    const conversionLabels = screen.getAllByText(/conversions/);
    expect(conversionLabels.length).toBe(data.length);
  });

  it('should display total conversions', () => {
    render(<UsageHistory data={generateMockData()} />);
    expect(screen.getByText('Total Conversions')).toBeInTheDocument();
  });

  it('should display total API calls', () => {
    render(<UsageHistory data={generateMockData()} />);
    expect(screen.getByText('Total API Calls')).toBeInTheDocument();
  });

  it('should calculate correct total conversions', () => {
    const data = [
      { date: '2024-01-01', conversions: 10, apiCalls: 20 },
      { date: '2024-01-02', conversions: 15, apiCalls: 30 },
      { date: '2024-01-03', conversions: 20, apiCalls: 40 },
    ];
    render(<UsageHistory data={data} />);
    // Total should be 10 + 15 + 20 = 45
    expect(screen.getByText('45')).toBeInTheDocument();
    // Total API calls: 20 + 30 + 40 = 90
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('should apply maxConversions for scaling', () => {
    const data = [
      { date: '2024-01-01', conversions: 50, apiCalls: 100 },
    ];
    const { container } = render(<UsageHistory data={data} maxConversions={100} />);
    const progressBar = container.querySelector('.bg-primary');
    expect(progressBar).toBeInTheDocument();
  });
});
