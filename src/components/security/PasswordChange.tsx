'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordChangeProps {
  hasPassword: boolean;
}

// Helper component for requirement items
function RequirementItem({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
      ) : (
        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
      )}
      <span className={met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
        {children}
      </span>
    </div>
  );
}

export function PasswordChange({ hasPassword }: PasswordChangeProps) {
  const t = useTranslations('security');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!currentPassword) {
      newErrors.currentPassword = t('password.currentRequired');
    }

    if (!newPassword) {
      newErrors.newPassword = t('password.newRequired');
    } else if (newPassword.length < 8) {
      newErrors.newPassword = t('password.minLength');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('password.confirmRequired');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('password.mismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('password.changed'));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        if (data.code === 'invalid_password') {
          setErrors({ currentPassword: t('password.incorrect') });
        } else if (data.code === 'same_password') {
          setErrors({ newPassword: t('password.samePassword') });
        } else {
          toast.error(data.error || t('password.changeFailed'));
        }
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(t('password.changeFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Password requirements check
  const getPasswordRequirements = (password: string) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^a-zA-Z0-9]/.test(password),
    };
  };

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, label: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, label: t('password.weak') };
    if (strength <= 3) return { level: 2, label: t('password.medium') };
    return { level: 3, label: t('password.strong') };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordRequirements = getPasswordRequirements(newPassword);

  if (!hasPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {t('password.title')}
          </CardTitle>
          <CardDescription>{t('password.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">{t('password.oauthOnly')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          {t('password.title')}
        </CardTitle>
        <CardDescription>{t('password.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('password.current')}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('password.currentPlaceholder')}
                className={errors.currentPassword ? 'border-destructive' : ''}
                aria-describedby={errors.currentPassword ? 'currentPassword-error' : undefined}
                aria-invalid={!!errors.currentPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrent(!showCurrent)}
                aria-label={showCurrent ? t('password.hidePassword') : t('password.showPassword')}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.currentPassword && (
              <p id="currentPassword-error" className="text-sm text-destructive" role="alert">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('password.new')}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('password.newPlaceholder')}
                className={errors.newPassword ? 'border-destructive' : ''}
                aria-describedby={
                  errors.newPassword ? 'newPassword-error' : 'password-requirements'
                }
                aria-invalid={!!errors.newPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? t('password.hidePassword') : t('password.showPassword')}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.newPassword && (
              <p id="newPassword-error" className="text-sm text-destructive" role="alert">
                {errors.newPassword}
              </p>
            )}
            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.level
                          ? passwordStrength.level === 1
                            ? 'bg-red-500'
                            : passwordStrength.level === 2
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>

                {/* Requirements checklist */}
                <div
                  id="password-requirements"
                  className="mt-2 p-3 bg-muted/50 rounded-md space-y-1.5"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {t('password.requirements')}
                  </p>
                  <RequirementItem met={passwordRequirements.minLength}>
                    {t('password.reqMinLength')}
                  </RequirementItem>
                  <RequirementItem met={passwordRequirements.hasUppercase}>
                    {t('password.reqUppercase')}
                  </RequirementItem>
                  <RequirementItem met={passwordRequirements.hasLowercase}>
                    {t('password.reqLowercase')}
                  </RequirementItem>
                  <RequirementItem met={passwordRequirements.hasNumber}>
                    {t('password.reqNumber')}
                  </RequirementItem>
                  <RequirementItem met={passwordRequirements.hasSpecial}>
                    {t('password.reqSpecial')}
                  </RequirementItem>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('password.confirm')}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('password.confirmPlaceholder')}
                className={errors.confirmPassword ? 'border-destructive' : ''}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                aria-invalid={!!errors.confirmPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? t('password.hidePassword') : t('password.showPassword')}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
                {errors.confirmPassword}
              </p>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                {t('password.match')}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  {t('password.changing')}
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4 me-2" />
                  {t('password.change')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
