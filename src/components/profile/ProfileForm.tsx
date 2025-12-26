'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Save, Mail, KeyRound, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileFormProps {
  name: string;
  email: string;
  hasPassword: boolean;
  emailVerified: boolean | null;
  onProfileUpdate: (updates: { name?: string }) => Promise<{ success: boolean; error?: string }>;
}

export function ProfileForm({
  name: initialName,
  email,
  hasPassword,
  emailVerified,
  onProfileUpdate,
}: ProfileFormProps) {
  const t = useTranslations('profile');

  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Email change dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(value !== initialName);
  };

  const handleSaveProfile = async () => {
    if (!hasChanges) return;

    setSaving(true);
    try {
      const result = await onProfileUpdate({ name });
      if (result.success) {
        toast.success(t('profileUpdated'));
        setHasChanges(false);
      } else {
        toast.error(result.error || t('profileUpdateFailed'));
      }
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error(t('profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !password) return;

    setSendingVerification(true);
    try {
      const response = await fetch('/api/users/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('emailVerificationSent'));
        setEmailDialogOpen(false);
        setNewEmail('');
        setPassword('');
      } else {
        // Handle specific error codes
        if (data.code === 'invalid_password') {
          toast.error(t('invalidCurrentPassword'));
        } else if (data.code === 'email_exists') {
          toast.error(t('emailAlreadyExists'));
        } else if (data.code === 'email_pending') {
          toast.error(t('emailPending'));
        } else if (data.code === 'oauth_account') {
          toast.error(t('oauthEmailChange'));
        } else {
          toast.error(data.error || t('emailChangeFailed'));
        }
      }
    } catch (error) {
      console.error('Email change error:', error);
      toast.error(t('emailChangeFailed'));
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('personalInfo')}</CardTitle>
        <CardDescription>{t('personalInfoDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t('name')}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t('namePlaceholder')}
          />
        </div>

        {/* Email (read-only with change option) */}
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <div className="flex gap-2">
            <Input id="email" value={email} readOnly className="bg-muted" />
            {hasPassword ? (
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="shrink-0">
                    <Mail className="h-4 w-4 me-2" />
                    {t('changeEmail')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('changeEmail')}</DialogTitle>
                    <DialogDescription>{t('changeEmailDescription')}</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentEmail">{t('currentEmail')}</Label>
                      <Input id="currentEmail" value={email} readOnly className="bg-muted" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newEmail">{t('newEmail')}</Label>
                      <Input
                        id="newEmail"
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder={t('newEmailPlaceholder')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t('emailChangeRequiresPassword')}</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('currentPasswordPlaceholder')}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                      {t('cancel')}
                    </Button>
                    <Button
                      onClick={handleEmailChange}
                      disabled={!newEmail || !password || sendingVerification}
                    >
                      {sendingVerification ? (
                        <>
                          <Loader2 className="h-4 w-4 me-2 animate-spin" />
                          {t('sending')}
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 me-2" />
                          {t('sendVerification')}
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <div className="flex items-center text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4 me-1" />
                {t('oauthEmailChange')}
              </div>
            )}
          </div>
          {!emailVerified && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              {t('emailNotVerified')}
            </p>
          )}
        </div>

        {/* Password section (link to security settings) */}
        {hasPassword && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('password')}</Label>
                <p className="text-sm text-muted-foreground">{t('passwordHint')}</p>
              </div>
              <Button variant="outline" asChild>
                <a href="security">
                  <KeyRound className="h-4 w-4 me-2" />
                  {t('changePassword')}
                </a>
              </Button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveProfile} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 me-2" />
                {t('updateProfile')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
