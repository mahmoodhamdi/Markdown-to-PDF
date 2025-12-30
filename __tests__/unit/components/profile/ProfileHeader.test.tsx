import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileHeader } from '@/components/profile/ProfileHeader';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      noName: 'No name set',
      plan: 'Plan',
      memberSince: 'Member since',
      emailVerified: 'Verified',
      emailNotVerified: 'Not verified',
      totalConversions: 'Total Conversions',
      totalFiles: 'Total Files',
      thisMonth: 'This Month',
    };
    return (key: string) => translations[key] || key;
  },
}));

// Mock AvatarUpload component
vi.mock('@/components/profile/AvatarUpload', () => ({
  AvatarUpload: () => (
    <div data-testid="avatar-upload">Avatar</div>
  ),
}));

describe('ProfileHeader', () => {
  const defaultProps = {
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg',
    plan: 'pro',
    emailVerified: true,
    createdAt: '2024-01-15T00:00:00Z',
    onAvatarChange: vi.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user name', () => {
    render(<ProfileHeader {...defaultProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render user email', () => {
    render(<ProfileHeader {...defaultProps} />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should render plan badge', () => {
    render(<ProfileHeader {...defaultProps} />);
    expect(screen.getByText(/pro Plan/i)).toBeInTheDocument();
  });

  it('should render member since date', () => {
    render(<ProfileHeader {...defaultProps} />);
    expect(screen.getByText(/Member since/)).toBeInTheDocument();
  });

  it('should render verified badge when email is verified', () => {
    render(<ProfileHeader {...defaultProps} emailVerified={true} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('should render not verified badge when email is not verified', () => {
    render(<ProfileHeader {...defaultProps} emailVerified={false} />);
    expect(screen.getByText('Not verified')).toBeInTheDocument();
  });

  it('should render no name placeholder when name is empty', () => {
    render(<ProfileHeader {...defaultProps} name="" />);
    expect(screen.getByText('No name set')).toBeInTheDocument();
  });

  it('should render quick stats when stats prop is provided', () => {
    const stats = {
      totalConversions: 150,
      totalFiles: 42,
      thisMonthConversions: 25,
    };
    render(<ProfileHeader {...defaultProps} stats={stats} />);

    expect(screen.getByText('Total Conversions')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('Total Files')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should format large numbers with locale separators', () => {
    const stats = {
      totalConversions: 1500,
      totalFiles: 1000,
      thisMonthConversions: 250,
    };
    render(<ProfileHeader {...defaultProps} stats={stats} />);

    // Numbers should be formatted with locale
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('should not render quick stats section when stats is not provided', () => {
    render(<ProfileHeader {...defaultProps} />);
    expect(screen.queryByText('Total Conversions')).not.toBeInTheDocument();
  });

  it('should render loading skeletons when statsLoading is true', () => {
    render(<ProfileHeader {...defaultProps} statsLoading={true} />);

    // Stats section should be visible but with skeletons
    expect(screen.getByText('Total Conversions')).toBeInTheDocument();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should handle zero stats values', () => {
    const stats = {
      totalConversions: 0,
      totalFiles: 0,
      thisMonthConversions: 0,
    };
    render(<ProfileHeader {...defaultProps} stats={stats} />);

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(3);
  });

  it('should render avatar upload component', () => {
    render(<ProfileHeader {...defaultProps} />);
    expect(screen.getByTestId('avatar-upload')).toBeInTheDocument();
  });
});
