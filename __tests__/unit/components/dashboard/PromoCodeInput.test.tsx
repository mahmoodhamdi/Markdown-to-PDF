import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PromoCodeInput } from '@/components/dashboard/PromoCodeInput';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      promoCodeLabel: 'Promo Code',
      promoPlaceholder: 'Enter code',
      validating: 'Validating...',
      apply: 'Apply',
      invalidPromoCode: 'Invalid or expired promo code',
      promoError: 'Failed to apply promo code',
    };
    return (key: string) => translations[key] || key;
  },
}));

describe('PromoCodeInput', () => {
  const mockOnValidate = vi.fn();
  const mockOnApply = vi.fn();
  const mockOnClear = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render promo code input', () => {
    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByText('Promo Code')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter code')).toBeInTheDocument();
  });

  it('should render apply button', () => {
    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument();
  });

  it('should disable apply button when input is empty', () => {
    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('should enable apply button when code is entered', () => {
    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter code'), {
      target: { value: 'TEST20' },
    });

    expect(screen.getByRole('button', { name: 'Apply' })).not.toBeDisabled();
  });

  it('should convert input to uppercase', () => {
    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );

    const input = screen.getByPlaceholderText('Enter code');
    fireEvent.change(input, { target: { value: 'test20' } });

    expect(input).toHaveValue('TEST20');
  });

  it('should call onValidate when apply is clicked', async () => {
    mockOnValidate.mockResolvedValue({ valid: true, discount: '20% off' });

    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter code'), {
      target: { value: 'TEST20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(mockOnValidate).toHaveBeenCalledWith('TEST20');
    });
  });

  it('should call onApply when validation succeeds', async () => {
    const validResult = { valid: true, discount: '20% off' };
    mockOnValidate.mockResolvedValue(validResult);

    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter code'), {
      target: { value: 'TEST20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalledWith('TEST20', validResult);
    });
  });

  it('should show error message when validation fails', async () => {
    mockOnValidate.mockResolvedValue({
      valid: false,
      error: 'Invalid or expired promo code'
    });

    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Enter code'), {
      target: { value: 'INVALID' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(screen.getByText('Invalid or expired promo code')).toBeInTheDocument();
    });
  });

  it('should render applied code state', () => {
    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
        appliedCode="SAVE20"
        appliedDiscount="20% off"
        onClear={mockOnClear}
      />
    );

    expect(screen.getByText('SAVE20')).toBeInTheDocument();
    expect(screen.getByText('20% off')).toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', () => {
    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
        appliedCode="SAVE20"
        appliedDiscount="20% off"
        onClear={mockOnClear}
      />
    );

    const clearButtons = screen.getAllByRole('button');
    fireEvent.click(clearButtons[0]); // Click the X button

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should disable input when disabled prop is true', () => {
    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
        disabled
      />
    );

    expect(screen.getByPlaceholderText('Enter code')).toBeDisabled();
  });

  it('should submit on Enter key press', async () => {
    mockOnValidate.mockResolvedValue({ valid: true, discount: '20% off' });

    render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
      />
    );

    const input = screen.getByPlaceholderText('Enter code');
    fireEvent.change(input, { target: { value: 'TEST20' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnValidate).toHaveBeenCalledWith('TEST20');
    });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <PromoCodeInput
        onValidate={mockOnValidate}
        onApply={mockOnApply}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
