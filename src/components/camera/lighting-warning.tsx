'use client';

import { lightingPoorAtom } from '@/lib/stores/pose-store';
import { useAtomValue } from 'jotai';

export function LightingWarning() {
  const lightingPoor = useAtomValue(lightingPoorAtom);

  if (!lightingPoor) return null;

  return (
    <div
      data-testid="lighting-warning"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20"
    >
      <p className="rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-amber-200 backdrop-blur-sm">
        Try more lighting
      </p>
    </div>
  );
}
