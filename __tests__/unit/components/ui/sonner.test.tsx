import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toaster } from '@/components/ui/sonner';
import { useThemeStore } from '@/stores/theme-store';

// Mock the theme store
vi.mock('@/stores/theme-store', () => ({
  useThemeStore: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  Toaster: ({ theme, className, position }: { theme: string; className: string; position: string }) => (
    <div data-testid="sonner-toaster" data-theme={theme} className={className} data-position={position}>
      Toaster Mock
    </div>
  ),
}));

describe('Toaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with light theme when mode is light', () => {
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mode: 'light',
    });

    render(<Toaster />);

    const toaster = screen.getByTestId('sonner-toaster');
    expect(toaster).toBeInTheDocument();
    expect(toaster).toHaveAttribute('data-theme', 'light');
  });

  it('renders with dark theme when mode is dark', () => {
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mode: 'dark',
    });

    render(<Toaster />);

    const toaster = screen.getByTestId('sonner-toaster');
    expect(toaster).toHaveAttribute('data-theme', 'dark');
  });

  it('renders with system theme when mode is system', () => {
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mode: 'system',
    });

    render(<Toaster />);

    const toaster = screen.getByTestId('sonner-toaster');
    expect(toaster).toHaveAttribute('data-theme', 'system');
  });

  it('has correct position', () => {
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mode: 'light',
    });

    render(<Toaster />);

    const toaster = screen.getByTestId('sonner-toaster');
    expect(toaster).toHaveAttribute('data-position', 'bottom-right');
  });

  it('has toaster class', () => {
    (useThemeStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      mode: 'light',
    });

    render(<Toaster />);

    const toaster = screen.getByTestId('sonner-toaster');
    expect(toaster).toHaveClass('toaster');
  });
});
