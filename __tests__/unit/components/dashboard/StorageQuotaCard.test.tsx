import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StorageQuotaCard } from '@/components/dashboard/StorageQuotaCard';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      storage: 'Storage',
      upgradeRequired: 'File storage requires a paid plan',
      upgrade: 'Upgrade Plan',
      of: 'of',
      unlimited: 'Unlimited',
    };
    return (key: string) => translations[key] || key;
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('StorageQuotaCard', () => {
  const defaultProps = {
    used: 512 * 1024 * 1024, // 512 MB
    limit: 1024 * 1024 * 1024, // 1 GB
  };

  it('should render storage title', () => {
    render(<StorageQuotaCard {...defaultProps} />);
    expect(screen.getByText('Storage')).toBeInTheDocument();
  });

  it('should render progress bar', () => {
    render(<StorageQuotaCard {...defaultProps} />);
    // The Progress component uses a div with overflow-hidden and rounded-full
    const progressBar = document.querySelector('.overflow-hidden.rounded-full');
    expect(progressBar).toBeInTheDocument();
  });

  it('should display percentage', () => {
    render(<StorageQuotaCard {...defaultProps} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should render loading skeleton when loading', () => {
    render(<StorageQuotaCard {...defaultProps} loading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render upgrade message when storage disabled', () => {
    render(<StorageQuotaCard {...defaultProps} storageEnabled={false} />);
    expect(screen.getByText('File storage requires a paid plan')).toBeInTheDocument();
  });

  it('should render upgrade button when storage disabled', () => {
    render(<StorageQuotaCard {...defaultProps} storageEnabled={false} />);
    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
  });

  it('should show formatted values when provided', () => {
    render(
      <StorageQuotaCard
        {...defaultProps}
        usedFormatted="512 MB"
        limitFormatted="1 GB"
      />
    );
    expect(screen.getByText(/512 MB/)).toBeInTheDocument();
    expect(screen.getByText(/1 GB/)).toBeInTheDocument();
  });

  it('should apply warning border when near limit (80%+)', () => {
    render(
      <StorageQuotaCard
        used={850 * 1024 * 1024}
        limit={1024 * 1024 * 1024}
      />
    );
    const card = document.querySelector('.border-yellow-500');
    expect(card).toBeInTheDocument();
  });

  it('should apply danger border when at limit (95%+)', () => {
    render(
      <StorageQuotaCard
        used={980 * 1024 * 1024}
        limit={1024 * 1024 * 1024}
      />
    );
    const card = document.querySelector('.border-destructive');
    expect(card).toBeInTheDocument();
  });

  it('should show upgrade button when near limit', () => {
    render(
      <StorageQuotaCard
        used={850 * 1024 * 1024}
        limit={1024 * 1024 * 1024}
      />
    );
    expect(screen.getByText('Upgrade Plan')).toBeInTheDocument();
  });

  it('should handle infinite limit', () => {
    render(
      <StorageQuotaCard
        used={512 * 1024 * 1024}
        limit={Infinity}
      />
    );
    // Check that the component renders "Unlimited" somewhere in the document
    const container = document.body;
    expect(container.textContent).toContain('Unlimited');
  });

  it('should handle zero limit gracefully', () => {
    render(
      <StorageQuotaCard
        used={0}
        limit={0}
      />
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
