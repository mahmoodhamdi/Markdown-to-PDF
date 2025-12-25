import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExportSettings } from '@/components/settings/ExportSettings';
import { useSettingsStore } from '@/stores/settings-store';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      settings: {
        defaults: 'Default Settings',
        defaultPageSize: 'Default Page Size',
        defaultOrientation: 'Default Orientation',
      },
      pageSettings: {
        'pageSizes.a4': 'A4',
        'pageSizes.letter': 'Letter',
        'pageSizes.legal': 'Legal',
        'pageSizes.a3': 'A3',
        portrait: 'Portrait',
        landscape: 'Landscape',
      },
    };
    return (key: string) => translations[namespace]?.[key] || key;
  },
}));

describe('ExportSettings', () => {
  beforeEach(() => {
    // Reset store to defaults
    useSettingsStore.getState().resetToDefaults();
  });

  it('should render the card title', () => {
    render(<ExportSettings />);
    expect(screen.getByText('Default Settings')).toBeInTheDocument();
  });

  it('should render page size selector', () => {
    render(<ExportSettings />);
    expect(screen.getByText('Default Page Size')).toBeInTheDocument();
  });

  it('should render orientation selector', () => {
    render(<ExportSettings />);
    expect(screen.getByText('Default Orientation')).toBeInTheDocument();
  });

  it('should have two comboboxes for page size and orientation', () => {
    render(<ExportSettings />);
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes).toHaveLength(2);
  });

  it('should have correct initial store values', () => {
    render(<ExportSettings />);
    // Initial state should be a4 and portrait
    expect(useSettingsStore.getState().defaultPageSize).toBe('a4');
    expect(useSettingsStore.getState().defaultOrientation).toBe('portrait');
  });

  it('should render within a card component', () => {
    const { container } = render(<ExportSettings />);
    // Check for Card structure - it has a header and content
    expect(container.querySelector('[class*="card"]')).toBeTruthy();
  });
});
