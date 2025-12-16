'use client';

import { Toaster as Sonner } from 'sonner';
import { useThemeStore } from '@/stores/theme-store';

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const { mode } = useThemeStore();

  // Determine the actual theme based on mode
  const getTheme = (): 'light' | 'dark' | 'system' => {
    if (mode === 'system') return 'system';
    return mode;
  };

  return (
    <Sonner
      theme={getTheme()}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive',
          success: 'group-[.toaster]:border-green-500',
        },
      }}
      position="bottom-right"
      richColors
      closeButton
      {...props}
    />
  );
}
