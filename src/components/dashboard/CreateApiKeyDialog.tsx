'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PERMISSIONS = [
  { id: 'convert', labelKey: 'permissionConvert', descriptionKey: 'permissionConvertDesc' },
  { id: 'preview', labelKey: 'permissionPreview', descriptionKey: 'permissionPreviewDesc' },
  { id: 'batch', labelKey: 'permissionBatch', descriptionKey: 'permissionBatchDesc' },
  { id: 'templates', labelKey: 'permissionTemplates', descriptionKey: 'permissionTemplatesDesc' },
  { id: 'themes', labelKey: 'permissionThemes', descriptionKey: 'permissionThemesDesc' },
] as const;

const EXPIRY_OPTIONS = [
  { value: 'never', labelKey: 'expiryNever' },
  { value: '30', labelKey: 'expiry30Days' },
  { value: '90', labelKey: 'expiry90Days' },
  { value: '180', labelKey: 'expiry180Days' },
  { value: '365', labelKey: 'expiry365Days' },
] as const;

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyCreated: (plainKey: string) => void;
}

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onKeyCreated,
}: CreateApiKeyDialogProps) {
  const t = useTranslations('dashboard.apiKeys');

  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<string[]>(['convert', 'preview']);
  const [expiry, setExpiry] = useState('never');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setPermissions((prev) => [...prev, permissionId]);
    } else {
      setPermissions((prev) => prev.filter((p) => p !== permissionId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t('nameRequired'));
      return;
    }

    if (permissions.length === 0) {
      setError(t('permissionRequired'));
      return;
    }

    try {
      setCreating(true);

      const body: Record<string, unknown> = {
        name: name.trim(),
        permissions,
      };

      if (expiry !== 'never') {
        body.expiresIn = parseInt(expiry, 10);
      }

      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create API key');
      }

      toast.success(t('keyCreatedToast'), {
        description: t('keyCreatedToastDescription'),
      });

      // Reset form
      setName('');
      setPermissions(['convert', 'preview']);
      setExpiry('never');

      onKeyCreated(data.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setName('');
      setPermissions(['convert', 'preview']);
      setExpiry('never');
      setError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t('createKeyTitle')}</DialogTitle>
            <DialogDescription>{t('createKeyDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('keyName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('keyNamePlaceholder')}
                maxLength={100}
              />
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>{t('keyPermissions')}</Label>
              <div className="space-y-3">
                {PERMISSIONS.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3">
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={permissions.includes(permission.id)}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(permission.id, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {t(permission.labelKey)}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        {t(permission.descriptionKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <Label htmlFor="expiry">{t('keyExpiry')}</Label>
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="expiry">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={creating}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('createKey')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
