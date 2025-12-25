import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingRow } from '@/components/settings/SettingRow';

describe('SettingRow', () => {
  it('should render label', () => {
    render(
      <SettingRow label="Test Label">
        <span>Content</span>
      </SettingRow>
    );
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <SettingRow label="Test Label">
        <button>Click me</button>
      </SettingRow>
    );
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <SettingRow label="Test Label" description="Test description">
        <span>Content</span>
      </SettingRow>
    );
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    render(
      <SettingRow label="Test Label">
        <span>Content</span>
      </SettingRow>
    );
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('should have proper layout structure', () => {
    const { container } = render(
      <SettingRow label="Test Label" description="Description">
        <span>Content</span>
      </SettingRow>
    );
    const row = container.firstChild;
    expect(row).toHaveClass('flex', 'items-center', 'justify-between');
  });
});
