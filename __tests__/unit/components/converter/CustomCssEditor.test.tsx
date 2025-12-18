/**
 * Unit tests for CustomCssEditor component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomCssEditor } from '@/components/converter/CustomCssEditor';

// Mock useSession
const mockUseSession = vi.fn();
vi.mock('next-auth/react', () => ({
  useSession: () => mockUseSession(),
}));

// Mock useThemeStore
const mockSetCustomCss = vi.fn();
let mockCustomCss = '';
vi.mock('@/stores/theme-store', () => ({
  useThemeStore: () => ({
    customCss: mockCustomCss,
    setCustomCss: mockSetCustomCss,
  }),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Custom CSS',
      optional: 'Optional',
      placeholder: '/* Add your custom styles */',
      hint: 'Add custom CSS to style your PDF output.',
      upgradeTitle: 'Unlock Custom CSS',
      upgradeDescription: 'Upgrade to Pro to add custom CSS styling to your PDFs.',
      upgradeButton: 'View Plans',
    };
    return translations[key] || key;
  },
}));

// Mock routing
vi.mock('@/i18n/routing', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('CustomCssEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomCss = '';
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should show upgrade prompt for unauthenticated users', () => {
      render(<CustomCssEditor />);

      expect(screen.getByText('Unlock Custom CSS')).toBeInTheDocument();
      expect(screen.getByText('View Plans')).toBeInTheDocument();
    });

    it('should show Pro badge', () => {
      render(<CustomCssEditor />);

      expect(screen.getByText('Pro')).toBeInTheDocument();
    });
  });

  describe('when user is on free plan', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'test@example.com', plan: 'free' },
        },
        status: 'authenticated',
      });
    });

    it('should show upgrade prompt for free plan users', () => {
      render(<CustomCssEditor />);

      expect(screen.getByText('Unlock Custom CSS')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Pro to add custom CSS styling to your PDFs.')).toBeInTheDocument();
    });

    it('should have link to pricing page', () => {
      render(<CustomCssEditor />);

      const link = screen.getByRole('link', { name: 'View Plans' });
      expect(link).toHaveAttribute('href', '/pricing');
    });
  });

  describe('when user is on pro plan', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'test@example.com', plan: 'pro' },
        },
        status: 'authenticated',
      });
    });

    it('should show the CSS textarea', () => {
      render(<CustomCssEditor />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should show the title and optional label', () => {
      render(<CustomCssEditor />);

      expect(screen.getByText('Custom CSS')).toBeInTheDocument();
      expect(screen.getByText('Optional')).toBeInTheDocument();
    });

    it('should show hint text', () => {
      render(<CustomCssEditor />);

      expect(screen.getByText('Add custom CSS to style your PDF output.')).toBeInTheDocument();
    });

    it('should call setCustomCss when typing', () => {
      render(<CustomCssEditor />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'body { color: red; }' } });

      expect(mockSetCustomCss).toHaveBeenCalledWith('body { color: red; }');
    });
  });

  describe('when user is on team plan', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'test@example.com', plan: 'team' },
        },
        status: 'authenticated',
      });
    });

    it('should show the CSS textarea', () => {
      render(<CustomCssEditor />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('when user is on enterprise plan', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: { email: 'test@example.com', plan: 'enterprise' },
        },
        status: 'authenticated',
      });
    });

    it('should show the CSS textarea', () => {
      render(<CustomCssEditor />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });
});
