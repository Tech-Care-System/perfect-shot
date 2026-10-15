'use client';

import { detectionErrorAtom, detectionRetrySignalAtom } from '@/lib/stores/pose-store';
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
    <div className="absolute top-4 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={cn(
        "flex items-start gap-3 rounded-lg p-4 shadow-lg backdrop-blur-md border",
        "bg-red-500/10 border-red-500/20 text-red-100"
      )}>
        <AlertCircle className="mt-0.5 size-5 text-red-400 shrink-0" />
        
        <div className="flex-1 space-y-1">
          <p className="font-medium text-sm text-red-200">
            {isLoadError ? 'AI Model Failed to Load' : 'Motion Tracking Error'}
          </p>
          <p className="text-xs text-red-300/80 leading-relaxed">
            {bodyText}
          </p>
          
          {isLoadError && (
            <div className="pt-2">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="flex items-center gap-2 rounded-md bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/30 active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={cn("size-3.5", retrying && "animate-spin")} />
                {retrying ? 'Retrying...' : 'Retry Connection'}
              </button>

            </div>
          )}
        </div>

        <button 
          onClick={handleDismiss}
          className="rounded-full p-1 hover:bg-white/10 active:scale-90 transition-all text-white/50 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
