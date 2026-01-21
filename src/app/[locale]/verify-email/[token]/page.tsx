'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

type VerificationStatus = 'loading' | 'success' | 'already_verified' | 'error';

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('verification');
  const token = params.token as string;

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function verifyEmail() {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          if (data.alreadyVerified) {
            setStatus('already_verified');
          } else {
            setStatus('success');
          }
        } else {
          setStatus('error');
          setErrorMessage(data.error || t('verificationFailed'));
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setErrorMessage(t('verificationFailed'));
      }
    }

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setErrorMessage(t('invalidToken'));
    }
  }, [token, t]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-primary/10 rounded-full w-fit">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">{t('verifying')}</CardTitle>
              <CardDescription>{t('verifyingDescription')}</CardDescription>
            </CardHeader>
          </>
        );

      case 'success':
        return (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-fit">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">{t('verified')}</CardTitle>
              <CardDescription>{t('verifiedDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push('/auth/login')} className="w-full sm:w-auto">
                {t('goToLogin')}
              </Button>
            </CardContent>
          </>
        );

      case 'already_verified':
        return (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit">
                <Mail className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">{t('alreadyVerified')}</CardTitle>
              <CardDescription>{t('alreadyVerifiedDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => router.push('/auth/login')} className="w-full sm:w-auto">
                {t('goToLogin')}
              </Button>
            </CardContent>
          </>
        );

      case 'error':
        return (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-4 bg-red-100 dark:bg-red-900/20 rounded-full w-fit">
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">{t('verificationError')}</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">{t('errorHint')}</p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/auth/login">{t('goToLogin')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/register">{t('registerAgain')}</Link>
                </Button>
              </div>
            </CardContent>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">{renderContent()}</Card>
    </div>
  );
}
