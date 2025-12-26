'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Receipt, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  description: string;
  invoiceUrl?: string;
  receiptUrl?: string;
}

interface BillingHistoryProps {
  invoices: Invoice[];
  loading?: boolean;
}

export function BillingHistory({ invoices, loading }: BillingHistoryProps) {
  const t = useTranslations('dashboard.subscription');

  const statusColors: Record<string, string> = {
    paid: 'bg-green-500',
    pending: 'bg-yellow-500',
    failed: 'bg-red-500',
    refunded: 'bg-gray-500',
  };

  const statusLabels: Record<string, string> = {
    paid: t('invoicePaid'),
    pending: t('invoicePending'),
    failed: t('invoiceFailed'),
    refunded: t('invoiceRefunded'),
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('billingHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between py-3">
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('billingHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noInvoices')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('billingHistory')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-medium truncate">{invoice.description}</p>
                  <Badge className={cn('text-white text-xs', statusColors[invoice.status])}>
                    {statusLabels[invoice.status]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(invoice.date)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-semibold">
                  {formatAmount(invoice.amount, invoice.currency)}
                </span>

                <div className="flex items-center gap-1">
                  {invoice.receiptUrl && (
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={invoice.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('viewReceipt')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {invoice.invoiceUrl && (
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={invoice.invoiceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('downloadInvoice')}
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
