'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreditCard, Trash2, Plus, ExternalLink, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet' | 'bank';
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  walletType?: 'apple_pay' | 'google_pay';
  isDefault: boolean;
  gateway: 'stripe' | 'paddle' | 'paymob' | 'paytabs';
}

interface PaymentMethodCardProps {
  paymentMethods: PaymentMethod[];
  gateway: string;
  portalUrl?: string;
  loading?: boolean;
  onSetDefault?: (methodId: string) => Promise<void>;
  onRemove?: (methodId: string) => Promise<void>;
  onAddNew?: () => void;
}

// Card brand logos (simplified SVG paths)
const cardBrandIcons: Record<string, React.ReactNode> = {
  visa: (
    <svg className="h-6 w-10" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#1A1F71" />
      <path d="M19.5 21L21.5 11H24.5L22.5 21H19.5Z" fill="white" />
      <path d="M31.5 11.3C30.7 11 29.6 10.7 28.3 10.7C25.3 10.7 23.2 12.3 23.2 14.5C23.2 16.2 24.7 17.1 25.9 17.7C27.1 18.3 27.5 18.7 27.5 19.2C27.5 20 26.5 20.4 25.6 20.4C24.4 20.4 23.3 20.1 22.5 19.7L22 19.5L21.5 22.5C22.5 22.9 24.1 23.3 25.7 23.3C28.9 23.3 31 21.7 31 19.4C31 18.1 30.2 17.1 28.4 16.2C27.3 15.6 26.6 15.2 26.6 14.6C26.6 14.1 27.2 13.6 28.4 13.6C29.4 13.6 30.2 13.8 30.8 14.1L31.1 14.2L31.5 11.3Z" fill="white" />
      <path d="M36 11H33.8C33 11 32.4 11.2 32.1 12L27.5 21H30.7L31.3 19.3H35.2L35.5 21H38.5L36 11ZM32.3 17C32.6 16.2 33.5 13.7 33.5 13.7C33.5 13.7 33.7 13.1 33.9 12.7L34.1 13.6C34.1 13.6 34.6 16.3 34.7 17H32.3Z" fill="white" />
      <path d="M17.5 11L14.5 18L14.2 16.5C13.6 14.8 12 13 10.2 12.1L13 21H16.2L20.7 11H17.5Z" fill="white" />
    </svg>
  ),
  mastercard: (
    <svg className="h-6 w-10" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#F7F7F7" />
      <circle cx="18" cy="16" r="8" fill="#EB001B" />
      <circle cx="30" cy="16" r="8" fill="#F79E1B" />
      <path d="M24 10.3C25.8 11.7 27 13.7 27 16C27 18.3 25.8 20.3 24 21.7C22.2 20.3 21 18.3 21 16C21 13.7 22.2 11.7 24 10.3Z" fill="#FF5F00" />
    </svg>
  ),
  amex: (
    <svg className="h-6 w-10" viewBox="0 0 48 32" fill="none">
      <rect width="48" height="32" rx="4" fill="#006FCF" />
      <path d="M10 16L14 11H18L14 16L18 21H14L10 16Z" fill="white" />
      <path d="M18 11H22V21H18V11Z" fill="white" />
      <path d="M24 11H28L30 15L32 11H36V21H32V14L30 18H28L26 14V21H24V11Z" fill="white" />
      <path d="M38 11H42L44 16L42 21H38V11Z" fill="white" />
    </svg>
  ),
};

export function PaymentMethodCard({
  paymentMethods,
  gateway,
  portalUrl,
  loading,
  onSetDefault,
  onRemove,
  onAddNew,
}: PaymentMethodCardProps) {
  const t = useTranslations('dashboard.subscription');

  const [removingId, setRemovingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<PaymentMethod | null>(null);

  const canManagePayments = gateway === 'stripe' || gateway === 'paddle';

  const getCardBrandIcon = (brand?: string) => {
    const normalizedBrand = brand?.toLowerCase();
    if (normalizedBrand && cardBrandIcons[normalizedBrand]) {
      return cardBrandIcons[normalizedBrand];
    }
    return <CreditCard className="h-6 w-6 text-muted-foreground" />;
  };

  const getMethodDisplay = (method: PaymentMethod) => {
    if (method.type === 'card') {
      const brand = method.brand?.charAt(0).toUpperCase() + (method.brand?.slice(1) || '');
      return {
        icon: getCardBrandIcon(method.brand),
        title: `${brand} •••• ${method.last4}`,
        subtitle: method.expiryMonth && method.expiryYear
          ? `${t('expires')} ${method.expiryMonth.toString().padStart(2, '0')}/${method.expiryYear.toString().slice(-2)}`
          : undefined,
      };
    }
    if (method.type === 'wallet') {
      return {
        icon: <CreditCard className="h-6 w-6" />,
        title: method.walletType === 'apple_pay' ? 'Apple Pay' : 'Google Pay',
        subtitle: undefined,
      };
    }
    return {
      icon: <CreditCard className="h-6 w-6" />,
      title: t('bankTransfer'),
      subtitle: undefined,
    };
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    if (!onSetDefault || method.isDefault) return;

    setSettingDefaultId(method.id);
    try {
      await onSetDefault(method.id);
      toast.success(t('defaultPaymentSet'));
    } catch {
      toast.error(t('setDefaultError'));
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove || !onRemove) return;

    setRemovingId(confirmRemove.id);
    try {
      await onRemove(confirmRemove.id);
      toast.success(t('paymentRemoved'));
    } catch {
      toast.error(t('removePaymentError'));
    } finally {
      setRemovingId(null);
      setConfirmRemove(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('paymentMethods')}
            </CardTitle>
            {canManagePayments && (
              portalUrl ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                    {t('manageInPortal')}
                    <ExternalLink className="h-4 w-4 ms-2" />
                  </a>
                </Button>
              ) : onAddNew && (
                <Button variant="outline" size="sm" onClick={onAddNew}>
                  <Plus className="h-4 w-4 me-2" />
                  {t('addPaymentMethod')}
                </Button>
              )
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noPaymentMethods')}</p>
              {!canManagePayments && (
                <p className="text-sm mt-2">{t('paymentManagedByGateway', { gateway })}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const display = getMethodDisplay(method);
                return (
                  <div
                    key={method.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border',
                      method.isDefault && 'border-primary bg-primary/5'
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="shrink-0">{display.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{display.title}</span>
                          {method.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 me-1" />
                              {t('default')}
                            </Badge>
                          )}
                        </div>
                        {display.subtitle && (
                          <p className="text-sm text-muted-foreground">{display.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {canManagePayments && (
                      <div className="flex items-center gap-2">
                        {!method.isDefault && onSetDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(method)}
                            disabled={settingDefaultId === method.id}
                          >
                            {settingDefaultId === method.id ? t('setting') : t('setDefault')}
                          </Button>
                        )}
                        {onRemove && paymentMethods.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmRemove(method)}
                            disabled={removingId === method.id || method.isDefault}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation */}
      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removePaymentTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('removePaymentDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removingId}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={!!removingId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingId ? t('removing') : t('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
