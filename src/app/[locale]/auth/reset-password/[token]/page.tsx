'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { validatePassword } from '@/lib/auth/password-validation';
import { use } from 'react';

interface ResetPasswordPageProps {
  params: Promise<{ token: string }>;
}

type PageState = 'form' | 'success' | 'invalid_token';

export default function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { token } = use(params);
  const t = useTranslations('resetPassword');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pageState, setPageState] = useState<PageState>('form');
  const [fieldErrors, setFieldErrors] = useState<{
    newPassword?: string[];
    confirmPassword?: string;
    general?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      errors.newPassword = passwordValidation.errors;
    }

    if (newPassword !== confirmPassword) {
      errors.confirmPassword = t('passwordMismatch');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setFieldErrors({});

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPageState('success');
        return;
      }

      if (data.code === 'invalid_token') {
        setPageState('invalid_token');
        return;
      }

      if (data.code === 'validation_error') {
        setFieldErrors({ newPassword: [data.error] });
        return;
      }

      setFieldErrors({ general: data.error || t('generalError') });
    } catch {
      setFieldErrors({ general: t('generalError') });
    } finally {
      setIsLoading(false);
    }
  };

  if (pageState === 'success') {
    return (
      <div className="container flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl">{t('success')}</CardTitle>
            <CardDescription>{t('successDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">{t('goToLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'invalid_token') {
    return (
      <div className="container flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">{t('invalidToken')}</CardTitle>
            <CardDescription>{t('invalidTokenDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/auth/forgot-password">
              <Button className="w-full">{t('requestNewLink')}</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" className="w-full">{t('goToLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fieldErrors.general && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-md">
                {fieldErrors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-password">{t('newPassword')}</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={fieldErrors.newPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  aria-label={showNewPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.newPassword && fieldErrors.newPassword.length > 0 && (
                <ul className="space-y-1">
                  {fieldErrors.newPassword.map((error, index) => (
                    <li key={index} className="text-sm text-red-500">
                      {error}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={fieldErrors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('resetting')}
                </>
              ) : (
                t('submit')
              )}
            </Button>

            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-primary hover:underline">
                {t('goToLogin')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
