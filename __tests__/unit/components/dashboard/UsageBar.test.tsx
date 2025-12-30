import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UsageBar } from '@/components/dashboard/UsageBar';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      unlimited: 'Unlimited',
    };
    return translations[key] || key;
  },
}));

describe('UsageBar', () => {
  it('renders with label and usage count', () => {
    render(<UsageBar label="Conversions" used={50} limit={100} />);
    expect(screen.getByText('Conversions')).toBeInTheDocument();
    expect(screen.getByText('50 / 100')).toBeInTheDocument();
  });

  it('renders with unit', () => {
    render(<UsageBar label="Storage" used={500} limit={1000} unit="MB" />);
    // Unit is appended without space for MB/GB
    expect(screen.getByText(/500MB.*1000MB/)).toBeInTheDocument();
  });

  it('shows percentage when showPercentage is true', () => {
    render(<UsageBar label="API Calls" used={75} limit={100} showPercentage />);
    expect(screen.getByText(/75.*%/)).toBeInTheDocument();
  });

  it('handles unlimited limit (Infinity)', () => {
    render(<UsageBar label="Conversions" used={100} limit={Infinity} />);
    expect(screen.getByText('100 / Unlimited')).toBeInTheDocument();
  });

  it('handles zero usage', () => {
    render(<UsageBar label="Conversions" used={0} limit={100} />);
    expect(screen.getByText('0 / 100')).toBeInTheDocument();
  });

  it('handles 100% usage', () => {
    render(<UsageBar label="API Calls" used={100} limit={100} showPercentage />);
    expect(screen.getByText(/100.*%/)).toBeInTheDocument();
  });

  it('handles over-limit usage', () => {
    render(<UsageBar label="API Calls" used={150} limit={100} showPercentage />);
    expect(screen.getByText(/100.*%/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <UsageBar label="Test" used={50} limit={100} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
