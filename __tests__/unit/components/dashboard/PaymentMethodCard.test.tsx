import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PaymentMethodCard, PaymentMethod } from '@/components/dashboard/PaymentMethodCard';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      paymentMethods: 'Payment Methods',
      noPaymentMethods: 'No payment methods on file',
      paymentManagedByGateway: 'Payment methods are managed by {gateway}',
      addPaymentMethod: 'Add Payment Method',
      manageInPortal: 'Manage in Portal',
      default: 'Default',
      setDefault: 'Set Default',
      setting: 'Setting...',
      defaultPaymentSet: 'Default payment method updated',
      setDefaultError: 'Failed to set default payment method',
      paymentRemoved: 'Payment method removed',
      removePaymentError: 'Failed to remove payment method',
      removePaymentTitle: 'Remove Payment Method',
      removePaymentDescription: 'Are you sure you want to remove this payment method?',
      remove: 'Remove',
      removing: 'Removing...',
      cancel: 'Cancel',
      expires: 'Expires',
      bankTransfer: 'Bank Transfer',
    };
    return (key: string, params?: Record<string, string>) => {
      const translation = translations[key] || key;
      if (params) {
        return Object.entries(params).reduce(
          (acc, [k, v]) => acc.replace(`{${k}}`, v),
          translation
        );
      }
      return translation;
    };
  },
}));

describe('PaymentMethodCard', () => {
  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm_1',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
      gateway: 'stripe',
    },
    {
      id: 'pm_2',
      type: 'card',
      brand: 'mastercard',
      last4: '5555',
      expiryMonth: 6,
      expiryYear: 2024,
      isDefault: false,
      gateway: 'stripe',
    },
  ];

  const mockSetDefault = vi.fn();
  // mockRemove and mockAddNew are available for future test cases
  void mockSetDefault; // Used in event handlers

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Payment Methods title', () => {
    render(<PaymentMethodCard paymentMethods={mockPaymentMethods} gateway="stripe" />);
    expect(screen.getByText('Payment Methods')).toBeInTheDocument();
  });

  it('should render empty state when no payment methods', () => {
    render(<PaymentMethodCard paymentMethods={[]} gateway="stripe" />);
    expect(screen.getByText('No payment methods on file')).toBeInTheDocument();
  });

  it('should render card brand and last4 digits', () => {
    render(<PaymentMethodCard paymentMethods={mockPaymentMethods} gateway="stripe" />);
    expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument();
    expect(screen.getByText('Mastercard •••• 5555')).toBeInTheDocument();
  });

  it('should render expiry date', () => {
    render(<PaymentMethodCard paymentMethods={mockPaymentMethods} gateway="stripe" />);
    expect(screen.getByText('Expires 12/25')).toBeInTheDocument();
    expect(screen.getByText('Expires 06/24')).toBeInTheDocument();
  });

  it('should render default badge on default payment method', () => {
    render(<PaymentMethodCard paymentMethods={mockPaymentMethods} gateway="stripe" />);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('should render Set Default button for non-default methods', () => {
    render(
      <PaymentMethodCard
        paymentMethods={mockPaymentMethods}
        gateway="stripe"
        onSetDefault={mockSetDefault}
      />
    );
    expect(screen.getByText('Set Default')).toBeInTheDocument();
  });

  it('should call onSetDefault when clicking Set Default', async () => {
    mockSetDefault.mockResolvedValue(undefined);
    render(
      <PaymentMethodCard
        paymentMethods={mockPaymentMethods}
        gateway="stripe"
        onSetDefault={mockSetDefault}
      />
    );

    fireEvent.click(screen.getByText('Set Default'));
    await waitFor(() => {
      expect(mockSetDefault).toHaveBeenCalledWith('pm_2');
    });
  });

  it('should render loading skeleton when loading', () => {
    render(
      <PaymentMethodCard paymentMethods={[]} gateway="stripe" loading />
    );
    // The Skeleton component renders as a div with specific class
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('should render Manage in Portal button when portalUrl is provided', () => {
    render(
      <PaymentMethodCard
        paymentMethods={mockPaymentMethods}
        gateway="stripe"
        portalUrl="https://billing.stripe.com/session/xxx"
      />
    );
    expect(screen.getByText('Manage in Portal')).toBeInTheDocument();
  });

  it('should not render Set Default button for non-Stripe/Paddle gateways', () => {
    render(
      <PaymentMethodCard
        paymentMethods={[{ ...mockPaymentMethods[0], gateway: 'paymob' }]}
        gateway="paymob"
        onSetDefault={mockSetDefault}
      />
    );
    expect(screen.queryByText('Set Default')).not.toBeInTheDocument();
  });

  it('should render wallet payment methods correctly', () => {
    const walletMethod: PaymentMethod[] = [
      {
        id: 'pm_wallet',
        type: 'wallet',
        walletType: 'apple_pay',
        isDefault: true,
        gateway: 'stripe',
      },
    ];
    render(<PaymentMethodCard paymentMethods={walletMethod} gateway="stripe" />);
    expect(screen.getByText('Apple Pay')).toBeInTheDocument();
  });

  it('should render bank transfer payment method', () => {
    const bankMethod: PaymentMethod[] = [
      {
        id: 'pm_bank',
        type: 'bank',
        isDefault: true,
        gateway: 'stripe',
      },
    ];
    render(<PaymentMethodCard paymentMethods={bankMethod} gateway="stripe" />);
    expect(screen.getByText('Bank Transfer')).toBeInTheDocument();
  });
});
