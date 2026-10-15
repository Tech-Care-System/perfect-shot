'use client';

import {
    detectionErrorAtom,
    detectionLostAtom,
    poseFpsAtom,
} from '@/lib/stores/pose-store';
import { cn } from '@/lib/utils';
import { useAtomValue } from 'jotai';

/**
 * Overlay component that displays real-time pose detection health indicators.
 * Shows FPS, detection-lost warnings, and fatal error messages.
 *
 * Reads from Jotai atoms directly — only re-renders when the specific atom
 * values it subscribes to change, not on every pose result.
 */
export function PoseStatusOverlay() {
  const fps = useAtomValue(poseFpsAtom);
  const detectionLost = useAtomValue(detectionLostAtom);
  const detectionError = useAtomValue(detectionErrorAtom);

  if (detectionError) {
    return (
      <div
        data-testid="pose-error-banner"
        className="absolute left-4 right-4 top-4 z-20 rounded-lg bg-red-900/80 px-4 py-3 text-sm text-white backdrop-blur-sm"
        role="alert"
      >
        <span className="font-medium">Detection failed:</span>{' '}
        {typeof detectionError === 'string' 
          ? detectionError 
          : (detectionError.rawError ? String(detectionError.rawError) : 'Unknown error')}

      </div>

    );
  }

  return (
    <>
      {/* FPS health indicator (AC4) */}
      <div
        data-testid="pose-fps-indicator"
        className={cn(
          'absolute right-3 top-3 z-20 rounded-full px-2.5 py-1 text-xs font-mono backdrop-blur-sm',
          fps >= 20
            ? 'bg-green-900/60 text-green-200'
            : fps >= 10
              ? 'bg-yellow-900/60 text-yellow-200'
              : 'bg-red-900/60 text-red-200'
        )}
      >
        {fps} FPS
      </div>

      {/* Detection-lost warning (AC3) */}
      {detectionLost && (
        <div
          data-testid="pose-detection-lost"
          className="absolute bottom-20 left-1/2 z-20 -translate-x-1/2 animate-pulse rounded-lg bg-amber-900/80 px-4 py-2 text-sm text-amber-100 backdrop-blur-sm"
          role="status"
        >
          Step into the frame so we can see you
        </div>
      )}
    </>
  );
}
