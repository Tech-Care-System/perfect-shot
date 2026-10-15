'use client';

import { detectionErrorAtom, detectionRetrySignalAtom } from '@/lib/stores/pose-store';
import styles from '@/components/camera/camera-ui.module.css';
import type { WorkerErrorDetail } from '@/lib/types/error.types';
import { cn } from '@/lib/utils';
import { useAtomValue, useSetAtom } from 'jotai';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useCallback, useState } from 'react';

export function CameraErrorBanner() {
  const error = useAtomValue(detectionErrorAtom);
  const setError = useSetAtom(detectionErrorAtom);
  const setRetrySignal = useSetAtom(detectionRetrySignalAtom);
  const [retrying, setRetrying] = useState(false);

  // We don't have direct access to workerStatus here since usePoseDetection owns the worker
  // We can assume loading state briefly when retry is clicked

  const handleDismiss = useCallback(() => {
    setError(null);
  }, [setError]);

  const handleRetry = useCallback(() => {
    setRetrying(true);
    setRetrySignal((prev) => prev + 1);
    
    // Simulate brief loading state for UI feedback
    setTimeout(() => {
        setRetrying(false);
        setError(null); 
    }, 1000);
  }, [setRetrySignal, setError]);


  if (!error) return null;

  const isLoadError = typeof error === 'object' && (error as WorkerErrorDetail).type === 'LOAD_ERROR';
  const bodyText = isLoadError
    ? 'The AI model could not load. Check your connection and try again.'
    : 'Motion tracking stopped unexpectedly. Dismiss and try again.';

  return (
    <div className={cn(styles.cameraErrorBanner, 'z-50')}>
      <div
        className={cn(
          'flex items-start gap-3 rounded-xl border border-red-300/30 bg-stone-950 p-4 text-stone-50 shadow-lg',
        )}
        role="alert"
      >
        <AlertCircle aria-hidden="true" className="mt-1 size-5 shrink-0 text-red-300" />

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-base font-semibold text-red-200">
            {isLoadError ? 'AI Model Failed to Load' : 'Motion Tracking Error'}
          </p>
          <p className="text-base leading-relaxed text-stone-100">{bodyText}</p>

          {isLoadError && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg bg-red-300/15 px-4 py-2 text-base font-medium text-red-100 hover:bg-red-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 motion-safe:transition-colors disabled:opacity-60"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={cn('size-4', retrying && 'motion-safe:animate-spin')}
                />
                {retrying ? 'Retrying...' : 'Retry Connection'}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss error"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-stone-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 motion-safe:transition-colors"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
