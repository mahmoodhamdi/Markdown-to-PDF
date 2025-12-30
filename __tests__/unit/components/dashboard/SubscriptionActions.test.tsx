import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionActions } from '@/components/dashboard/SubscriptionActions';

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
      moreActions: 'More actions',
      pauseSubscription: 'Pause Subscription',
      resumeSubscription: 'Resume Subscription',
      resuming: 'Resuming...',
      changeBillingCycle: 'Change Billing Cycle',
      applyPromoCode: 'Apply Promo Code',
      manageInPortal: 'Manage in Portal',
      cancelSubscription: 'Cancel Subscription',
      pauseTitle: 'Pause Subscription',
      pauseDescription: 'Pausing your subscription will temporarily stop billing.',
      pauseWarning1: 'Your subscription will be paused at the end of the billing period',
      pauseWarning2: 'You will retain access until the pause takes effect',
      pauseWarning3: 'You can resume at any time',
      confirmPause: 'Pause Subscription',
      pausing: 'Pausing...',
      pauseSuccess: 'Subscription paused successfully',
      pauseError: 'Failed to pause subscription',
      resumeSuccess: 'Subscription resumed successfully',
      resumeError: 'Failed to resume subscription',
      promoDescription: 'Enter a promo code for a discount',
      promoCodeLabel: 'Promo Code',
      promoPlaceholder: 'Enter code',
      applying: 'Applying...',
      apply: 'Apply',
      promoApplied: 'Promo code applied: {discount}',
      promoError: 'Failed to apply promo code',
      cancel: 'Cancel',
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

describe('SubscriptionActions', () => {
  const mockOnPause = vi.fn();
  const mockOnResume = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnChangeBilling = vi.fn();
  const mockOnApplyPromo = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing if no actions are available', () => {
    const { container } = render(
      <SubscriptionActions
        status="active"
        gateway="paymob"
        cancelAtPeriodEnd={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render the more actions button when Stripe subscription with pause handler', () => {
    render(
      <SubscriptionActions
        status="active"
        gateway="stripe"
        cancelAtPeriodEnd={false}
        onPause={mockOnPause}
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('should render the more actions button when resume handler provided', () => {
    render(
      <SubscriptionActions
        status="paused"
        gateway="stripe"
        cancelAtPeriodEnd={false}
        onResume={mockOnResume}
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('should render the more actions button when cancel handler provided', () => {
    render(
      <SubscriptionActions
        status="active"
        gateway="stripe"
        cancelAtPeriodEnd={false}
        onCancel={mockOnCancel}
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('should render when promo code handler is provided', () => {
    render(
      <SubscriptionActions
        status="active"
        gateway="stripe"
        cancelAtPeriodEnd={false}
        onApplyPromo={mockOnApplyPromo}
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('should render when portal URL is provided', () => {
    render(
      <SubscriptionActions
        status="active"
        gateway="stripe"
        cancelAtPeriodEnd={false}
        portalUrl="https://billing.stripe.com/session/xxx"
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('should render for Paddle gateway with portal URL', () => {
    render(
      <SubscriptionActions
        status="active"
        gateway="paddle"
        cancelAtPeriodEnd={false}
        portalUrl="https://checkout.paddle.com/xxx"
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  it('should render when change billing handler is provided', () => {
    render(
      <SubscriptionActions
        status="active"
        gateway="stripe"
        cancelAtPeriodEnd={false}
        onChangeBilling={mockOnChangeBilling}
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });

  // Tests for canPause/canResume logic
  it('should not render pause for non-Stripe gateways', () => {
    const { container } = render(
      <SubscriptionActions
        status="active"
        gateway="paymob"
        cancelAtPeriodEnd={false}
        onPause={mockOnPause}
      />
    );
    // onPause is provided but gateway is not stripe, so no actions rendered
    expect(container.firstChild).toBeNull();
  });

  it('should render resume for cancelAtPeriodEnd', () => {
    render(
      <SubscriptionActions
        status="active"
        gateway="stripe"
        cancelAtPeriodEnd={true}
        onResume={mockOnResume}
      />
    );
    expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument();
  });
});
