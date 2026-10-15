'use client';

import { detectionLostAtom, poseCorrectionAtom, subjectFramingAtom, subjectTooFarAtom, targetPoseAtom } from '@/lib/stores/pose-store';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

const HOLD_DURATION_MS = 1000;

export function PoseCorrectionPrompt() {
  const correction = useAtomValue(poseCorrectionAtom);
  const target = useAtomValue(targetPoseAtom);
  const subjectTooFar = useAtomValue(subjectTooFarAtom);
  const subjectFraming = useAtomValue(subjectFramingAtom);
  const detectionLost = useAtomValue(detectionLostAtom);
  const [displayedText, setDisplayedText] = useState<string | null>(null);
  const lastChangeRef = useRef(0);
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!correction) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      pendingRef.current = null;
      setTimeout(() => setDisplayedText(null), 0);
      return;
    }

    const now = Date.now();
    const elapsed = now - lastChangeRef.current;
    if (elapsed >= HOLD_DURATION_MS) {
      setTimeout(() => setDisplayedText(correction), 0);
      lastChangeRef.current = now;

      pendingRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      pendingRef.current = correction;
      if (!timerRef.current) {
        const remaining = HOLD_DURATION_MS - elapsed;
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (pendingRef.current) {
            setDisplayedText(pendingRef.current);
            lastChangeRef.current = Date.now();
            pendingRef.current = null;
          }
        }, remaining);
      }
    }
  }, [correction]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!target || !displayedText || subjectTooFar || subjectFraming || detectionLost) return null;

  return (
    <div
      data-testid="pose-correction-prompt"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 z-20"
    >
      <p className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        {displayedText}
      </p>
    </div>
  );
}
