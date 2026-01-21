'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

export function DeleteAccount() {
  const t = useTranslations('account.delete');
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmationValid = confirmation === 'DELETE';
  const canDelete = isConfirmationValid && password.length > 0;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirm: true,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Sign out and redirect to home
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Delete account error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset state when closing
        setConfirmation('');
        setPassword('');
        setError(null);
      }
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium">{t('warning')}</p>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('consequences.subscriptions')}</li>
            <li>{t('consequences.teams')}</li>
            <li>{t('consequences.files')}</li>
            <li>{t('consequences.data')}</li>
          </ul>
        </div>

        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('button')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                {t('dialog.title')}
              </AlertDialogTitle>
              <AlertDialogDescription>{t('dialog.description')}</AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="confirmation">{t('dialog.confirmLabel')}</Label>
                <Input
                  id="confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  className={
                    confirmation.length > 0 && !isConfirmationValid ? 'border-destructive' : ''
                  }
                />
                {confirmation.length > 0 && !isConfirmationValid && (
                  <p className="text-sm text-destructive">{t('dialog.confirmError')}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('dialog.passwordLabel')}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('dialog.passwordPlaceholder')}
                  disabled={isDeleting}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  {error}
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>{t('dialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!canDelete || isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('dialog.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('dialog.confirm')}
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
