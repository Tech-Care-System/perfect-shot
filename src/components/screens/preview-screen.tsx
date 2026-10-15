'use client';

import { capturedPhotoAtom } from '@/lib/stores/camera-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { savePhoto } from '@/lib/utils/save-photo';
import { useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PreviewScreenProps {
  imageUrl: string;
}

export function PreviewScreen({ imageUrl }: PreviewScreenProps) {
  const setCapturedPhoto = useSetAtom(capturedPhotoAtom);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first || document.activeElement === dialogRef.current) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last || document.activeElement === dialogRef.current) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  const [saveState, setSaveState] = useState<'idle' | 'saved'>('idle');

  const handleRetake = () => {
    setCapturedPhoto(null);
  };

  const handleSave = () => {
    savePhoto(imageUrl);
    setSaveState('saved');
    setTimeout(() => {
      setCapturedPhoto(null);
    }, 1500);
  };

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      data-testid="preview-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Photo Preview"
      className="absolute inset-0 z-50 bg-black flex flex-col outline-none"
    >
      <div className="flex-1 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Captured photo"
          data-testid="preview-image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex items-center justify-between px-8 pb-12 pt-4 bg-black">
        <Button
          variant="ghost"
          onClick={handleRetake}
          data-testid="retake-button"
          className="text-white/80 hover:text-white hover:bg-white/10 px-6 py-3 rounded-full"
        >
          Retake
        </Button>
        <Button
          onClick={handleSave}
          disabled={saveState === 'saved'}
          data-testid="save-button"
          className={cn(
            'px-8 py-3 rounded-full font-semibold',
            saveState === 'saved'
              ? 'bg-green-500 text-white'
              : 'bg-white text-black hover:bg-gray-100'
          )}
        >
          {saveState === 'saved' ? 'Saved!' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
