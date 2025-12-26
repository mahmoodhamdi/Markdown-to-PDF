'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  currentImage: string;
  name: string;
  onImageChange: (imageUrl: string) => Promise<{ success: boolean; error?: string }>;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function AvatarUpload({ currentImage, name, onImageChange, disabled }: AvatarUploadProps) {
  const t = useTranslations('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t('avatar.invalidType'));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(t('avatar.tooLarge'));
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const response = await fetch('/api/storage/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Update profile with new image URL
        const result = await onImageChange(data.url);
        if (result.success) {
          toast.success(t('avatar.updated'));
        } else {
          toast.error(result.error || t('avatar.updateFailed'));
          setPreviewUrl(null);
        }
      } else {
        toast.error(data.error || t('avatar.uploadFailed'));
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(t('avatar.uploadFailed'));
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    setUploading(true);
    try {
      const result = await onImageChange('');
      if (result.success) {
        setPreviewUrl(null);
        toast.success(t('avatar.removed'));
      } else {
        toast.error(result.error || t('avatar.removeFailed'));
      }
    } catch (error) {
      console.error('Remove avatar error:', error);
      toast.error(t('avatar.removeFailed'));
    } finally {
      setUploading(false);
    }
  };

  const displayImage = previewUrl || currentImage;

  return (
    <div className="relative group">
      <Avatar className="h-24 w-24 border-2 border-muted">
        <AvatarImage src={displayImage} alt={name} />
        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {/* Upload overlay */}
      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading ? (
          <Loader2 className="h-6 w-6 text-white animate-spin" />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <Camera className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Remove button */}
      {displayImage && !uploading && (
        <Button
          variant="destructive"
          size="icon"
          className="absolute -top-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleRemoveAvatar}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
      />

      {/* Change photo text button */}
      <div className="mt-2 text-center">
        <Button
          variant="link"
          size="sm"
          className="text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? t('avatar.uploading') : t('avatar.change')}
        </Button>
      </div>
    </div>
  );
}
