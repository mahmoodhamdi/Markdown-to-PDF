'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, Pause, Play, RefreshCw, XCircle, Tag, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'paused' | 'trialing';

interface SubscriptionActionsProps {
  status: SubscriptionStatus;
  gateway: string;
  cancelAtPeriodEnd: boolean;
  portalUrl?: string;
  onPause?: () => Promise<void>;
  onResume?: () => Promise<void>;
  onCancel?: () => void;
  onChangeBilling?: () => void;
  onApplyPromo?: (code: string) => Promise<{ success: boolean; discount?: string; error?: string }>;
}

export function SubscriptionActions({
  status,
  gateway,
  cancelAtPeriodEnd,
  portalUrl,
  onPause,
  onResume,
  onCancel,
  onChangeBilling,
  onApplyPromo,
}: SubscriptionActionsProps) {
  const t = useTranslations('dashboard.subscription');

  const [isPausing, setIsPausing] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const canPause = gateway === 'stripe' && status === 'active' && !cancelAtPeriodEnd && onPause;
  const canResume = (status === 'paused' || cancelAtPeriodEnd) && onResume;
  const canApplyPromo = gateway === 'stripe' && onApplyPromo;
  const hasPortal = gateway === 'stripe' || gateway === 'paddle';

  const handlePause = async () => {
    if (!onPause) return;

    setIsPausing(true);
    try {
      await onPause();
      toast.success(t('pauseSuccess'));
      setShowPauseConfirm(false);
    } catch {
      toast.error(t('pauseError'));
    } finally {
      setIsPausing(false);
    }
  };

  const handleResume = async () => {
    if (!onResume) return;

    setIsResuming(true);
    try {
      await onResume();
      toast.success(t('resumeSuccess'));
    } catch {
      toast.error(t('resumeError'));
    } finally {
      setIsResuming(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!onApplyPromo || !promoCode.trim()) return;

    setIsApplyingPromo(true);
    try {
      const result = await onApplyPromo(promoCode.trim());
      if (result.success) {
        toast.success(t('promoApplied', { discount: result.discount || '' }));
        setShowPromoDialog(false);
        setPromoCode('');
      } else {
        toast.error(result.error || t('promoError'));
      }
    } catch {
      toast.error(t('promoError'));
    } finally {
      setIsApplyingPromo(false);
    }
  };

  // Don't show anything if no actions available
  if (!canPause && !canResume && !canApplyPromo && !hasPortal && !onCancel && !onChangeBilling) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('moreActions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canResume && (
            <DropdownMenuItem onClick={handleResume} disabled={isResuming}>
              <Play className="h-4 w-4 me-2" />
              {isResuming ? t('resuming') : t('resumeSubscription')}
            </DropdownMenuItem>
          )}

          {canPause && (
            <DropdownMenuItem onClick={() => setShowPauseConfirm(true)}>
              <Pause className="h-4 w-4 me-2" />
              {t('pauseSubscription')}
            </DropdownMenuItem>
          )}

          {onChangeBilling && (
            <DropdownMenuItem onClick={onChangeBilling}>
              <RefreshCw className="h-4 w-4 me-2" />
              {t('changeBillingCycle')}
            </DropdownMenuItem>
          )}

          {canApplyPromo && (
            <DropdownMenuItem onClick={() => setShowPromoDialog(true)}>
              <Tag className="h-4 w-4 me-2" />
              {t('applyPromoCode')}
            </DropdownMenuItem>
          )}

          {hasPortal && portalUrl && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 me-2" />
                  {t('manageInPortal')}
                </a>
              </DropdownMenuItem>
            </>
          )}

          {onCancel && status !== 'canceled' && !cancelAtPeriodEnd && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onCancel}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="h-4 w-4 me-2" />
                {t('cancelSubscription')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Pause Confirmation */}
      <AlertDialog open={showPauseConfirm} onOpenChange={setShowPauseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pauseTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('pauseDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• {t('pauseWarning1')}</li>
              <li>• {t('pauseWarning2')}</li>
              <li>• {t('pauseWarning3')}</li>
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPausing}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePause} disabled={isPausing}>
              {isPausing ? t('pausing') : t('confirmPause')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promo Code Dialog */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('applyPromoCode')}</DialogTitle>
            <DialogDescription>{t('promoDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="promoCode">{t('promoCodeLabel')}</Label>
            <Input
              id="promoCode"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder={t('promoPlaceholder')}
              className="mt-2"
              disabled={isApplyingPromo}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPromoDialog(false)}
              disabled={isApplyingPromo}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleApplyPromo} disabled={!promoCode.trim() || isApplyingPromo}>
              {isApplyingPromo ? t('applying') : t('apply')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
