import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageProgress } from '@/components/dashboard/UsageProgress';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      unlimited: 'Unlimited',
    };
    return (key: string) => translations[key] || key;
  },
}));

describe('UsageProgress', () => {
  it('should render label', () => {
    render(<UsageProgress label="Conversions" current={10} limit={20} />);
    expect(screen.getByText('Conversions')).toBeInTheDocument();
  });

  it('should display current and limit values', () => {
    render(<UsageProgress label="Conversions" current={10} limit={20} />);
    expect(screen.getByText(/10/)).toBeInTheDocument();
    expect(screen.getByText(/20/)).toBeInTheDocument();
  });

  it('should display percentage when showPercentage is true', () => {
    render(<UsageProgress label="Conversions" current={10} limit={20} showPercentage />);
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('should display unit when provided', () => {
    render(<UsageProgress label="Storage" current={500} limit={1000} unit="MB" />);
    expect(screen.getByText(/500 MB/)).toBeInTheDocument();
  });

  it('should display unlimited for infinite limit', () => {
    render(<UsageProgress label="Conversions" current={10} limit={Infinity} />);
    expect(screen.getByText(/Unlimited/)).toBeInTheDocument();
  });

  it('should render progress bar', () => {
    const { container } = render(<UsageProgress label="Test" current={5} limit={10} />);
    const progressBar = container.querySelector('.bg-secondary');
    expect(progressBar).toBeInTheDocument();
  });

  it('should cap percentage at 100%', () => {
    render(<UsageProgress label="Test" current={150} limit={100} showPercentage />);
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it('should handle zero limit gracefully', () => {
    render(<UsageProgress label="Test" current={0} limit={0} />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
