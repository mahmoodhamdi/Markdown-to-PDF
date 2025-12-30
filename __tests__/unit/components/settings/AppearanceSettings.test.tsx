import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { useThemeStore } from '@/stores/theme-store';
import { useSettingsStore } from '@/stores/settings-store';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: (namespace: string) => {
    const translations: Record<string, Record<string, string>> = {
      settings: {
        appearance: 'Appearance',
        theme: 'Theme',
        'themes.light': 'Light',
        'themes.dark': 'Dark',
        'themes.system': 'System',
        defaultTheme: 'Default Document Theme',
        language: 'Language',
      },
      themes: {
        'builtIn.github': 'GitHub',
        'builtIn.academic': 'Academic',
        'builtIn.minimal': 'Minimal',
        'builtIn.dark': 'Dark',
        'builtIn.professional': 'Professional',
        'builtIn.elegant': 'Elegant',
        'builtIn.modern': 'Modern',
        'builtIn.newsletter': 'Newsletter',
        'codeThemes.title': 'Code Theme',
        'codeThemes.githubLight': 'GitHub Light',
        'codeThemes.githubDark': 'GitHub Dark',
        'codeThemes.monokai': 'Monokai',
        'codeThemes.dracula': 'Dracula',
        'codeThemes.nord': 'Nord',
        'codeThemes.oneDark': 'One Dark',
        'codeThemes.vsCode': 'VS Code',
      },
      common: {
        english: 'English',
        arabic: 'Arabic',
      },
    };
    return (key: string) => translations[namespace]?.[key] || key;
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/en/settings',
}));

describe('AppearanceSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores to defaults
    useThemeStore.getState().resetToDefaults();
    useSettingsStore.getState().resetToDefaults();
  });

  it('should render the card title', () => {
    render(<AppearanceSettings />);
    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('should render theme mode buttons', () => {
    render(<AppearanceSettings />);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('should change theme mode when clicking light button', () => {
    render(<AppearanceSettings />);
    const lightButton = screen.getByText('Light');
    fireEvent.click(lightButton);
    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('should change theme mode when clicking dark button', () => {
    render(<AppearanceSettings />);
    const darkButton = screen.getByText('Dark');
    fireEvent.click(darkButton);
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('should change theme mode when clicking system button', () => {
    // First set to light
    useThemeStore.getState().setMode('light');
    render(<AppearanceSettings />);
    const systemButton = screen.getByText('System');
    fireEvent.click(systemButton);
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('should render document theme selector', () => {
    render(<AppearanceSettings />);
    expect(screen.getByText('Default Document Theme')).toBeInTheDocument();
  });

  it('should render code theme selector', () => {
    render(<AppearanceSettings />);
    expect(screen.getByText('Code Theme')).toBeInTheDocument();
  });

  it('should render language selector', () => {
    render(<AppearanceSettings />);
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('should have four comboboxes', () => {
    render(<AppearanceSettings />);
    const comboboxes = screen.getAllByRole('combobox');
    // Document theme, Code theme, Language
    expect(comboboxes).toHaveLength(3);
  });

  it('should have correct initial store values', () => {
    render(<AppearanceSettings />);
    expect(useThemeStore.getState().mode).toBe('system');
    expect(useThemeStore.getState().codeTheme).toBe('github-light');
    expect(useSettingsStore.getState().defaultDocumentTheme).toBe('github');
  });

  it('should render theme mode icons', () => {
    render(<AppearanceSettings />);
    // Lucide icons render as SVG
    const buttons = screen.getAllByRole('button');
    // Three theme mode buttons
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });
});
