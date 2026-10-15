'use client';

import { deviceUnsupportedAtom, deviceWarningDismissedAtom } from '@/lib/stores/settings-store';
import { useAtomValue, useSetAtom } from 'jotai';
import { X } from 'lucide-react';

export function UnsupportedDeviceWarning() {
  const deviceUnsupported = useAtomValue(deviceUnsupportedAtom);
  const dismissed = useAtomValue(deviceWarningDismissedAtom);
  const setDismissed = useSetAtom(deviceWarningDismissedAtom);

  if (!deviceUnsupported || dismissed) return null;

  return (
    <div
      data-testid="unsupported-device-warning"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute left-4 right-4 top-[194px] z-20 flex justify-center"
    >
      <div className="pointer-events-none flex w-full max-w-2xl items-start gap-2 rounded-xl border border-white/10 bg-stone-950/90 px-3 py-2 text-base font-medium leading-snug text-amber-100 shadow-lg">
        <p className="min-w-0 flex-1 py-2 text-base">
          Your device may have slower feedback. For best results, use the manual shutter button.
        </p>
        <button
          type="button"
          data-testid="unsupported-device-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss warning"
          className="pointer-events-auto inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-amber-100 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 motion-safe:transition-colors"
        >
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
    </div>
  );
}
