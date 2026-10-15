"use client";

import {
  detectionErrorAtom,
  detectionLostAtom,
  poseFpsAtom,
} from "@/lib/stores/pose-store";
import { useAtomValue } from "jotai";

export function PoseStatusOverlay() {
  const fps = useAtomValue(poseFpsAtom);
  const detectionLost = useAtomValue(detectionLostAtom);
  const detectionError = useAtomValue(detectionErrorAtom);

  if (detectionError) return null;

  const guideActive = fps > 0 && !detectionLost;

  return (
    <div
      data-testid="pose-fps-indicator"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="absolute left-4 top-[94px] z-20 flex max-w-[calc(100vw_-_2rem)] items-center gap-1.5 rounded-full border border-white/15 bg-stone-950/90 px-3 py-2 text-base font-medium text-[#f6f1e5] shadow-sm"
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${guideActive ? "bg-lime-300" : "bg-amber-300"}`}
      />
      <span>{guideActive ? "Guide active" : "Finding you"}</span>
    </div>
  );
}
