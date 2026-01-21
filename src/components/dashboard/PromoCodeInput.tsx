'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromoResult {
  valid: boolean;
  discount?: string;
  discountType?: 'percent' | 'fixed';
  discountAmount?: number;
  description?: string;
  error?: string;
}

interface PromoCodeInputProps {
  onValidate: (code: string) => Promise<PromoResult>;
  onApply: (code: string, result: PromoResult) => void;
  onClear?: () => void;
  appliedCode?: string;
  appliedDiscount?: string;
  disabled?: boolean;
  className?: string;
}

export function PromoCodeInput({
  onValidate,
  onApply,
  onClear,
  appliedCode,
  appliedDiscount,
  disabled,
  className,
}: PromoCodeInputProps) {
  const t = useTranslations('dashboard.subscription');

  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<PromoResult | null>(null);

  const handleValidate = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await onValidate(code.trim());
      setValidationResult(result);

      if (result.valid) {
        onApply(code.trim(), result);
        setCode('');
      }
    } catch {
      setValidationResult({ valid: false, error: t('promoError') });
    } finally {
      setIsValidating(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setValidationResult(null);
    onClear?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.trim() && !isValidating) {
      e.preventDefault();
      handleValidate();
    }
  };

  // Show applied code state
  if (appliedCode) {
    return (
      <div className={cn('space-y-2', className)}>
        <Label className="text-sm text-muted-foreground">{t('promoCodeLabel')}</Label>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <Check className="h-4 w-4 text-green-600" />
          <div className="flex-1">
            <Badge variant="secondary" className="font-mono">
              {appliedCode}
            </Badge>
            {appliedDiscount && (
              <span className="ms-2 text-sm text-green-700 dark:text-green-400">
                {appliedDiscount}
              </span>
            )}
          </div>
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="promo-input" className="text-sm text-muted-foreground">
        {t('promoCodeLabel')}
      </Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="promo-input"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setValidationResult(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t('promoPlaceholder')}
            className={cn('ps-9', validationResult?.valid === false && 'border-destructive')}
            disabled={disabled || isValidating}
          />
        </div>
        <Button onClick={handleValidate} disabled={!code.trim() || isValidating || disabled}>
          {isValidating ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              {t('validating')}
            </>
          ) : (
            t('apply')
          )}
        </Button>
      </div>

      {/* Validation Feedback */}
      {validationResult && !validationResult.valid && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <X className="h-3 w-3" />
          {validationResult.error || t('invalidPromoCode')}
        </p>
      )}
    </div>
  );
}
