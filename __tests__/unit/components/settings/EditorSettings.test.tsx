import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditorSettings } from '@/components/settings/EditorSettings';
import { useSettingsStore } from '@/stores/settings-store';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      editor: 'Editor',
      fontSize: 'Font Size',
      fontFamily: 'Font Family',
      tabSize: 'Tab Size',
      wordWrap: 'Word Wrap',
      lineNumbers: 'Line Numbers',
      minimap: 'Minimap',
      autoSave: 'Auto Save',
      autoSaveInterval: 'Auto Save Interval',
      seconds: 'seconds',
    };
    return (key: string) => translations[key] || key;
  },
}));

describe('EditorSettings', () => {
  beforeEach(() => {
    // Reset store to defaults
    useSettingsStore.getState().resetToDefaults();
  });

  it('should render the card title', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Editor')).toBeInTheDocument();
  });

  it('should render font size controls', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Font Size')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument(); // Default font size
  });

  it('should increase font size when clicking + button', () => {
    render(<EditorSettings />);
    const increaseButton = screen.getByText('+');
    fireEvent.click(increaseButton);
    expect(useSettingsStore.getState().editorSettings.fontSize).toBe(16);
  });

  it('should decrease font size when clicking - button', () => {
    render(<EditorSettings />);
    const decreaseButton = screen.getByText('-');
    fireEvent.click(decreaseButton);
    expect(useSettingsStore.getState().editorSettings.fontSize).toBe(12);
  });

  it('should not decrease font size below 10', () => {
    useSettingsStore.getState().setEditorSettings({ fontSize: 10 });
    render(<EditorSettings />);
    const decreaseButton = screen.getByText('-');
    fireEvent.click(decreaseButton);
    expect(useSettingsStore.getState().editorSettings.fontSize).toBe(10);
  });

  it('should not increase font size above 24', () => {
    useSettingsStore.getState().setEditorSettings({ fontSize: 24 });
    render(<EditorSettings />);
    const increaseButton = screen.getByText('+');
    fireEvent.click(increaseButton);
    expect(useSettingsStore.getState().editorSettings.fontSize).toBe(24);
  });

  it('should render font family selector', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Font Family')).toBeInTheDocument();
  });

  it('should render tab size selector', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Tab Size')).toBeInTheDocument();
  });

  it('should render word wrap toggle', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Word Wrap')).toBeInTheDocument();
  });

  it('should toggle word wrap', () => {
    render(<EditorSettings />);
    const switches = screen.getAllByRole('switch');
    const wordWrapSwitch = switches[0]; // First switch is word wrap
    expect(useSettingsStore.getState().editorSettings.wordWrap).toBe(true);
    fireEvent.click(wordWrapSwitch);
    expect(useSettingsStore.getState().editorSettings.wordWrap).toBe(false);
  });

  it('should render line numbers toggle', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Line Numbers')).toBeInTheDocument();
  });

  it('should toggle line numbers', () => {
    render(<EditorSettings />);
    const switches = screen.getAllByRole('switch');
    const lineNumbersSwitch = switches[1]; // Second switch is line numbers
    expect(useSettingsStore.getState().editorSettings.lineNumbers).toBe(true);
    fireEvent.click(lineNumbersSwitch);
    expect(useSettingsStore.getState().editorSettings.lineNumbers).toBe(false);
  });

  it('should render minimap toggle', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Minimap')).toBeInTheDocument();
  });

  it('should toggle minimap', () => {
    render(<EditorSettings />);
    const switches = screen.getAllByRole('switch');
    const minimapSwitch = switches[2]; // Third switch is minimap
    expect(useSettingsStore.getState().editorSettings.minimap).toBe(false);
    fireEvent.click(minimapSwitch);
    expect(useSettingsStore.getState().editorSettings.minimap).toBe(true);
  });

  it('should render auto save toggle', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Auto Save')).toBeInTheDocument();
  });

  it('should toggle auto save', () => {
    render(<EditorSettings />);
    const switches = screen.getAllByRole('switch');
    const autoSaveSwitch = switches[3]; // Fourth switch is auto save
    expect(useSettingsStore.getState().editorSettings.autoSave).toBe(true);
    fireEvent.click(autoSaveSwitch);
    expect(useSettingsStore.getState().editorSettings.autoSave).toBe(false);
  });

  it('should show auto save interval when auto save is enabled', () => {
    render(<EditorSettings />);
    expect(screen.getByText('Auto Save Interval')).toBeInTheDocument();
    expect(screen.getByText('seconds')).toBeInTheDocument();
  });

  it('should hide auto save interval when auto save is disabled', () => {
    useSettingsStore.getState().setEditorSettings({ autoSave: false });
    render(<EditorSettings />);
    expect(screen.queryByText('Auto Save Interval')).not.toBeInTheDocument();
  });

  it('should have correct initial store values', () => {
    render(<EditorSettings />);
    const settings = useSettingsStore.getState().editorSettings;
    expect(settings.fontSize).toBe(14);
    expect(settings.fontFamily).toBe('monospace');
    expect(settings.tabSize).toBe(2);
    expect(settings.wordWrap).toBe(true);
    expect(settings.lineNumbers).toBe(true);
    expect(settings.minimap).toBe(false);
    expect(settings.autoSave).toBe(true);
    expect(settings.autoSaveInterval).toBe(30);
  });
});
