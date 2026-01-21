'use client';

import { useTranslations } from 'next-intl';
import { Cloud, CloudOff, Check, Loader2, AlertCircle } from 'lucide-react';
import { useEditorStore, SaveStatus } from '@/stores/editor-store';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';

interface SaveStatusIndicatorProps {
  className?: string;
}

export function SaveStatusIndicator({ className }: SaveStatusIndicatorProps) {
  const t = useTranslations('editor');
  const { saveStatus, lastSaved, isDirty } = useEditorStore();
  const { editorSettings } = useSettingsStore();

  // Don't show if auto-save is disabled
  if (!editorSettings.autoSave) {
    return null;
  }

  const formatLastSaved = (timestamp: number | null): string => {
    if (!timestamp) return '';

    const now = Date.now();
    const diff = now - timestamp;

    // Less than a minute ago
    if (diff < 60000) {
      return t('stats.justNow') || 'Just now';
    }

    // Less than an hour ago
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }

    // Show time
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status: SaveStatus) => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: t('stats.saving') || 'Saving...',
          iconClass: 'animate-spin text-blue-500',
          textClass: 'text-blue-500',
        };
      case 'saved':
        return {
          icon: Check,
          text: t('stats.saved') || 'Saved',
          iconClass: 'text-green-500',
          textClass: 'text-green-500',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: t('stats.saveError') || 'Save failed',
          iconClass: 'text-red-500',
          textClass: 'text-red-500',
        };
      default:
        if (isDirty) {
          return {
            icon: Cloud,
            text: t('stats.unsaved') || 'Unsaved changes',
            iconClass: 'text-amber-500',
            textClass: 'text-amber-500',
          };
        }
        return {
          icon: CloudOff,
          text: lastSaved ? formatLastSaved(lastSaved) : '',
          iconClass: 'text-muted-foreground',
          textClass: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig(saveStatus);
  const Icon = config.icon;

  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs', className)}
      title={lastSaved ? `Last saved: ${new Date(lastSaved).toLocaleString()}` : ''}
    >
      <Icon className={cn('h-3.5 w-3.5', config.iconClass)} />
      <span className={cn(config.textClass)}>{config.text}</span>
    </div>
  );
}
