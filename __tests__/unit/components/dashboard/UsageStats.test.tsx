import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageStats } from '@/components/dashboard/UsageStats';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      todaysUsage: "Today's Usage",
      dailyLimits: 'Daily Limits',
      storage: 'Storage',
      conversions: 'Conversions',
      apiCalls: 'API Calls',
      storageUsed: 'Storage Used',
      used: 'used',
      total: 'total',
      unlimited: 'Unlimited',
      resetsNow: 'Resets now',
      resetsIn: 'Resets in {hours}h {minutes}m',
      resetsInMinutes: 'Resets in {minutes}m',
    };
    return (key: string, params?: Record<string, number>) => {
      let value = translations[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, String(v));
        });
      }
      return value;
    };
  },
}));

describe('UsageStats', () => {
  const defaultProps = {
    usage: {
      conversions: 15,
      apiCalls: 50,
      storageUsed: 512 * 1024 * 1024, // 512 MB
      filesUploaded: 10,
    },
    limits: {
      conversionsPerDay: 100,
      apiCallsPerDay: 200,
      cloudStorageBytes: 1024 * 1024 * 1024, // 1 GB
      maxBatchFiles: 50,
    },
    resetTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
  };

  it('should render card title', () => {
    render(<UsageStats {...defaultProps} />);
    expect(screen.getByText("Today's Usage")).toBeInTheDocument();
  });

  it('should render daily limits section', () => {
    render(<UsageStats {...defaultProps} />);
    expect(screen.getByText('Daily Limits')).toBeInTheDocument();
  });

  it('should render storage section', () => {
    render(<UsageStats {...defaultProps} />);
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  it('should render conversions progress', () => {
    render(<UsageStats {...defaultProps} />);
    expect(screen.getByText('Conversions')).toBeInTheDocument();
  });

  it('should render API calls progress', () => {
    render(<UsageStats {...defaultProps} />);
    expect(screen.getByText('API Calls')).toBeInTheDocument();
  });

  it('should render storage used progress', () => {
    render(<UsageStats {...defaultProps} />);
    expect(screen.getByText('Storage Used')).toBeInTheDocument();
  });

  it('should display reset time indicator', () => {
    render(<UsageStats {...defaultProps} />);
    // Should show clock icon and time until reset
    const clockIcon = document.querySelector('svg');
    expect(clockIcon).toBeInTheDocument();
  });

  it('should handle unlimited storage', () => {
    const props = {
      ...defaultProps,
      limits: {
        ...defaultProps.limits,
        cloudStorageBytes: Infinity,
      },
    };
    render(<UsageStats {...props} />);
    expect(screen.getByText('Unlimited')).toBeInTheDocument();
  });
});
