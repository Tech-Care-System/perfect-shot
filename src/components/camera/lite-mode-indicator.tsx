'use client';

import { liteModeAtom } from '@/lib/stores/settings-store';
import { useAtomValue } from 'jotai';

export function LiteModeIndicator() {
  const liteMode = useAtomValue(liteModeAtom);

  if (!liteMode) return null;

  return (
    <div
      data-testid="lite-mode-indicator"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute bottom-4 right-4 z-20"
    >
      <p className="rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
        Lite Mode
      </p>
    </div>
  );
}
