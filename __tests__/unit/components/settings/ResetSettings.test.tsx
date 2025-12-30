import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResetSettings } from '@/components/settings/ResetSettings';
import { useSettingsStore } from '@/stores/settings-store';
import { useThemeStore } from '@/stores/theme-store';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      reset: 'Reset Settings',
      resetConfirm: 'Are you sure you want to reset all settings to defaults?',
    };
    return (key: string) => translations[key] || key;
  },
}));

describe('ResetSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset stores to defaults
    useSettingsStore.getState().resetToDefaults();
    useThemeStore.getState().resetToDefaults();
  });

  it('should render the card title', () => {
    render(<ResetSettings />);
    // Title appears in both h3 and button, use getAllByText
    const elements = screen.getAllByText('Reset Settings');
    expect(elements.length).toBe(2); // Title and button
    // First one should be the heading
    expect(elements[0].tagName).toBe('H3');
  });

  it('should render the reset button', () => {
    render(<ResetSettings />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('should render the confirmation description', () => {
    render(<ResetSettings />);
    expect(
      screen.getByText('Are you sure you want to reset all settings to defaults?')
    ).toBeInTheDocument();
  });

  it('should show confirmation dialog when reset button is clicked', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ResetSettings />);
    const resetButton = screen.getByRole('button');
    fireEvent.click(resetButton);
    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('should not reset when confirmation is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    // Modify settings first
    useSettingsStore.getState().setEditorSettings({ fontSize: 20 });
    useThemeStore.getState().setMode('dark');

    render(<ResetSettings />);
    const resetButton = screen.getByRole('button');
    fireEvent.click(resetButton);

    // Settings should NOT be reset
    expect(useSettingsStore.getState().editorSettings.fontSize).toBe(20);
    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('should reset settings store when confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Modify settings first
    useSettingsStore.getState().setEditorSettings({ fontSize: 20 });
    useSettingsStore.getState().setDefaultDocumentTheme('dark');
    useSettingsStore.getState().setDefaultPageSize('letter');

    render(<ResetSettings />);
    const resetButton = screen.getByRole('button');
    fireEvent.click(resetButton);

    // Settings should be reset to defaults
    expect(useSettingsStore.getState().editorSettings.fontSize).toBe(14);
    expect(useSettingsStore.getState().defaultDocumentTheme).toBe('github');
    expect(useSettingsStore.getState().defaultPageSize).toBe('a4');
  });

  it('should reset theme store when confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Modify theme settings first
    useThemeStore.getState().setMode('dark');
    useThemeStore.getState().setCodeTheme('monokai');
    useThemeStore.getState().setDocumentTheme('academic');
    useThemeStore.getState().setCustomCss('.test { color: red; }');

    render(<ResetSettings />);
    const resetButton = screen.getByRole('button');
    fireEvent.click(resetButton);

    // Theme settings should be reset to defaults
    expect(useThemeStore.getState().mode).toBe('system');
    expect(useThemeStore.getState().codeTheme).toBe('github-light');
    expect(useThemeStore.getState().documentTheme).toBe('github');
    expect(useThemeStore.getState().customCss).toBe('');
  });

  it('should reset both stores when confirmed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    // Modify both stores
    useSettingsStore.getState().setEditorSettings({ fontSize: 18, autoSave: false });
    useThemeStore.getState().setMode('light');

    render(<ResetSettings />);
    const resetButton = screen.getByRole('button');
    fireEvent.click(resetButton);

    // Both stores should be reset
    expect(useSettingsStore.getState().editorSettings.fontSize).toBe(14);
    expect(useSettingsStore.getState().editorSettings.autoSave).toBe(true);
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('should render reset icon', () => {
    render(<ResetSettings />);
    // Lucide icons render as SVG
    const button = screen.getByRole('button');
    expect(button.querySelector('svg')).toBeTruthy();
  });

  it('should have destructive styling', () => {
    render(<ResetSettings />);
    // Check for destructive class on button
    const button = screen.getByRole('button');
    expect(button.className).toContain('destructive');
  });
});
