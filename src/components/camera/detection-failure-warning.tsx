'use client';

import { detectionLostAtom } from '@/lib/stores/pose-store';
import { useAtomValue } from 'jotai';

export function DetectionFailureWarning() {
  const detectionLost = useAtomValue(detectionLostAtom);

  if (!detectionLost) return null;

  return (
    <div
      data-testid="detection-failure-warning"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 z-20"
    >
      <p className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        Having trouble detecting you. Try better lighting.
      </p>
    </div>
  );
}
