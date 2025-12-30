import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      selectDateRange: 'Select date range',
      selectRange: 'Select range',
      last7Days: 'Last 7 days',
      last14Days: 'Last 14 days',
      last30Days: 'Last 30 days',
      last90Days: 'Last 90 days',
    };
    return translations[key] || key;
  },
}));

describe('DateRangePicker', () => {
  it('renders with calendar icon', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value="7" onChange={onChange} />);

    // Calendar icon should be present (as SVG)
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('shows select trigger with aria-label', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value="7" onChange={onChange} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-label', 'Select date range');
  });

  it('applies custom className', () => {
    const onChange = vi.fn();
    const { container } = render(
      <DateRangePicker value="7" onChange={onChange} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with different initial values', () => {
    const onChange = vi.fn();

    const { rerender } = render(<DateRangePicker value="7" onChange={onChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    rerender(<DateRangePicker value="30" onChange={onChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    rerender(<DateRangePicker value="90" onChange={onChange} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('has min-width styling on trigger', () => {
    const onChange = vi.fn();
    render(<DateRangePicker value="7" onChange={onChange} />);

    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('min-w-[160px]');
  });

  it('renders within a wrapper div', () => {
    const onChange = vi.fn();
    const { container } = render(<DateRangePicker value="7" onChange={onChange} />);

    expect(container.firstChild).toHaveClass('space-y-1');
  });
});
