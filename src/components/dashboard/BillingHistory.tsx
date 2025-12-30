'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Download,
  Receipt,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'void';
  description: string;
  invoiceUrl?: string;
  receiptUrl?: string;
  pdfUrl?: string;
  tax?: number;
  subtotal?: number;
  discount?: number;
  discountCode?: string;
}

interface BillingHistoryProps {
  invoices: Invoice[];
  loading?: boolean;
  showTax?: boolean;
}

export function BillingHistory({ invoices, loading, showTax = true }: BillingHistoryProps) {
  const t = useTranslations('dashboard.subscription');

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    paid: {
      color: 'bg-green-500',
      icon: <CheckCircle className="h-3.5 w-3.5" />,
      label: t('invoicePaid'),
    },
    pending: {
      color: 'bg-yellow-500',
      icon: <Clock className="h-3.5 w-3.5" />,
      label: t('invoicePending'),
    },
    failed: {
      color: 'bg-red-500',
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: t('invoiceFailed'),
    },
    refunded: {
      color: 'bg-gray-500',
      icon: <RotateCcw className="h-3.5 w-3.5" />,
      label: t('invoiceRefunded'),
    },
    void: {
      color: 'bg-gray-400',
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      label: t('invoiceVoid'),
    },
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
              <div key={i} className="animate-pulse flex items-center justify-between py-3 border-b last:border-0">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
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
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t('billingHistory')}
            </CardTitle>
            <Badge variant="secondary">{invoices.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {invoices.map((invoice) => {
              const defaultStatus = { color: 'bg-yellow-500', icon: <Clock className="h-3.5 w-3.5" />, label: t('invoicePending') };
              const status = statusConfig[invoice.status] ?? defaultStatus;

              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-medium truncate">{invoice.description}</p>
                      <Badge className={cn('text-white text-xs gap-1', status.color)}>
                        {status.icon}
                        {status.label}
                      </Badge>
                      {invoice.discountCode && (
                        <Badge variant="outline" className="text-xs">
                          {invoice.discountCode}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{formatDate(invoice.date)}</span>
                      {showTax && invoice.tax !== undefined && invoice.tax > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs">
                              {t('includesTax', { amount: formatAmount(invoice.tax, invoice.currency) })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs space-y-1">
                              {invoice.subtotal !== undefined && (
                                <p>{t('subtotal')}: {formatAmount(invoice.subtotal, invoice.currency)}</p>
                              )}
                              <p>{t('tax')}: {formatAmount(invoice.tax, invoice.currency)}</p>
                              {invoice.discount !== undefined && invoice.discount > 0 && (
                                <p className="text-green-400">
                                  {t('discount')}: -{formatAmount(invoice.discount, invoice.currency)}
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ms-4">
                    <span className={cn(
                      'font-semibold tabular-nums',
                      invoice.status === 'refunded' && 'line-through text-muted-foreground'
                    )}>
                      {formatAmount(invoice.amount, invoice.currency)}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* PDF Download */}
                      {invoice.pdfUrl && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={invoice.pdfUrl}
                                download={`invoice-${invoice.id}.pdf`}
                                title={t('downloadPdf')}
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('downloadPdf')}</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Receipt */}
                      {invoice.receiptUrl && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={invoice.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Receipt className="h-4 w-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('viewReceipt')}</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Invoice */}
                      {invoice.invoiceUrl && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={invoice.invoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t('viewInvoice')}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
