import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BillingHistory, Invoice } from '@/components/dashboard/BillingHistory';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      billingHistory: 'Billing History',
      noInvoices: 'No invoices yet',
      invoicePaid: 'Paid',
      invoicePending: 'Pending',
      invoiceFailed: 'Failed',
      invoiceRefunded: 'Refunded',
      invoiceVoid: 'Void',
      viewReceipt: 'View Receipt',
      downloadInvoice: 'Download Invoice',
      downloadPdf: 'Download PDF',
      viewInvoice: 'View Invoice',
      includesTax: 'Includes {amount} tax',
      subtotal: 'Subtotal',
      tax: 'Tax',
      discount: 'Discount',
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

describe('BillingHistory', () => {
  const mockInvoices: Invoice[] = [
    {
      id: 'inv_1',
      date: '2024-01-15T10:00:00Z',
      amount: 5,
      currency: 'USD',
      status: 'paid',
      description: 'Pro Plan - Monthly',
      receiptUrl: 'https://example.com/receipt/1',
      invoiceUrl: 'https://example.com/invoice/1',
    },
    {
      id: 'inv_2',
      date: '2024-02-15T10:00:00Z',
      amount: 5,
      currency: 'USD',
      status: 'pending',
      description: 'Pro Plan - Monthly',
    },
    {
      id: 'inv_3',
      date: '2024-03-15T10:00:00Z',
      amount: 5,
      currency: 'USD',
      status: 'failed',
      description: 'Pro Plan - Monthly',
    },
    {
      id: 'inv_4',
      date: '2024-04-15T10:00:00Z',
      amount: 5,
      currency: 'USD',
      status: 'refunded',
      description: 'Pro Plan - Monthly',
    },
  ];

  it('should render Billing History title', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    expect(screen.getByText('Billing History')).toBeInTheDocument();
  });

  it('should render no invoices message when empty', () => {
    render(<BillingHistory invoices={[]} />);
    expect(screen.getByText('No invoices yet')).toBeInTheDocument();
  });

  it('should render invoice descriptions', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    const descriptions = screen.getAllByText('Pro Plan - Monthly');
    expect(descriptions.length).toBe(4);
  });

  it('should render paid status badge', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('should render pending status badge', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should render failed status badge', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('should render refunded status badge', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    expect(screen.getByText('Refunded')).toBeInTheDocument();
  });

  it('should format currency correctly', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    const amounts = screen.getAllByText('$5.00');
    expect(amounts.length).toBe(4);
  });

  it('should render receipt link when available', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    const receiptLinks = document.querySelectorAll('a[href="https://example.com/receipt/1"]');
    expect(receiptLinks.length).toBe(1);
  });

  it('should render invoice link when available', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    const invoiceLinks = document.querySelectorAll('a[href="https://example.com/invoice/1"]');
    expect(invoiceLinks.length).toBe(1);
  });

  it('should render loading skeleton when loading', () => {
    render(<BillingHistory invoices={[]} loading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render formatted dates', () => {
    render(<BillingHistory invoices={[mockInvoices[0]]} />);
    // The date formatting will depend on locale, but should contain month and year
    const dateElement = screen.getByText(/Jan.*2024/i);
    expect(dateElement).toBeInTheDocument();
  });

  it('should open receipt link in new tab', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    const receiptLink = document.querySelector('a[href="https://example.com/receipt/1"]');
    expect(receiptLink).toHaveAttribute('target', '_blank');
    expect(receiptLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should open invoice link in new tab', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    const invoiceLink = document.querySelector('a[href="https://example.com/invoice/1"]');
    expect(invoiceLink).toHaveAttribute('target', '_blank');
    expect(invoiceLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should not render action buttons when URLs not provided', () => {
    const invoicesWithoutUrls: Invoice[] = [
      {
        id: 'inv_no_urls',
        date: '2024-01-15T10:00:00Z',
        amount: 5,
        currency: 'USD',
        status: 'paid',
        description: 'Pro Plan - Monthly',
      },
    ];
    render(<BillingHistory invoices={invoicesWithoutUrls} />);
    expect(document.querySelectorAll('a').length).toBe(0);
  });

  it('should handle different currencies', () => {
    const eurInvoices: Invoice[] = [
      {
        id: 'inv_eur',
        date: '2024-01-15T10:00:00Z',
        amount: 4.5,
        currency: 'EUR',
        status: 'paid',
        description: 'Pro Plan - Monthly',
      },
    ];
    render(<BillingHistory invoices={eurInvoices} />);
    // Should contain euro symbol
    expect(screen.getByText(/€4\.50/)).toBeInTheDocument();
  });

  it('should render void status badge', () => {
    const voidInvoices: Invoice[] = [
      {
        id: 'inv_void',
        date: '2024-01-15T10:00:00Z',
        amount: 5,
        currency: 'USD',
        status: 'void',
        description: 'Pro Plan - Monthly',
      },
    ];
    render(<BillingHistory invoices={voidInvoices} />);
    expect(screen.getByText('Void')).toBeInTheDocument();
  });

  it('should render PDF download link when pdfUrl is provided', () => {
    const invoicesWithPdf: Invoice[] = [
      {
        id: 'inv_pdf',
        date: '2024-01-15T10:00:00Z',
        amount: 5,
        currency: 'USD',
        status: 'paid',
        description: 'Pro Plan - Monthly',
        pdfUrl: 'https://example.com/invoice.pdf',
      },
    ];
    render(<BillingHistory invoices={invoicesWithPdf} />);
    const downloadLink = document.querySelector('a[download]');
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute('href', 'https://example.com/invoice.pdf');
  });

  it('should render discount code badge when present', () => {
    const invoicesWithDiscount: Invoice[] = [
      {
        id: 'inv_discount',
        date: '2024-01-15T10:00:00Z',
        amount: 5,
        currency: 'USD',
        status: 'paid',
        description: 'Pro Plan - Monthly',
        discountCode: 'SAVE20',
      },
    ];
    render(<BillingHistory invoices={invoicesWithDiscount} />);
    expect(screen.getByText('SAVE20')).toBeInTheDocument();
  });

  it('should display invoice count badge', () => {
    render(<BillingHistory invoices={mockInvoices} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });
});
