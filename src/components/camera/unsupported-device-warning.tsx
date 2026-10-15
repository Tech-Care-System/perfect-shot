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
      className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-20"
    >
      <div className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-amber-200 backdrop-blur-sm flex items-center gap-2">
        <p>Your device may have slower feedback. For best results, use the manual shutter button.</p>
        <button
          data-testid="unsupported-device-dismiss"
          onClick={() => setDismissed(true)}
          className="pointer-events-auto ml-1 text-amber-200/70 hover:text-amber-200"
          aria-label="Dismiss warning"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
