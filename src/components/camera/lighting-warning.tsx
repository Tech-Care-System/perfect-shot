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
      className="pointer-events-none absolute left-4 right-4 top-[146px] z-20 flex justify-start"
    >
      <p className="max-w-full rounded-xl border border-white/10 bg-stone-950/90 px-4 py-2 text-center text-base font-medium text-amber-100 shadow-lg">
        Try more lighting
      </p>
    </div>
  );
}
