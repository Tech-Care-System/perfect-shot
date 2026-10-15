"use client";

import { lightingPoorAtom } from "@/lib/stores/pose-store";
import {
  deviceUnsupportedAtom,
  liteModeAtom,
} from "@/lib/stores/settings-store";
import { useAtomValue } from "jotai";

export function LiteModeIndicator() {
  const liteMode = useAtomValue(liteModeAtom);
  const lightingPoor = useAtomValue(lightingPoorAtom);
  const deviceUnsupported = useAtomValue(deviceUnsupportedAtom);

  if (!liteMode || lightingPoor || deviceUnsupported) return null;

  return (
    <div
      data-testid="lite-mode-indicator"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute left-4 top-[146px] z-20 max-w-[calc(100vw_-_2rem)]"
    >
      <p className="rounded-xl border border-white/15 bg-stone-950/90 px-4 py-2 text-base font-medium text-[#f6f1e5] shadow-sm">
        Lite Mode
      </p>
    </div>
  );
}
