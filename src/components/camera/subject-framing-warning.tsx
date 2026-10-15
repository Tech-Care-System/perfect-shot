'use client';

import { detectionLostAtom, subjectFramingAtom, subjectTooFarAtom } from '@/lib/stores/pose-store';
import { useAtomValue } from 'jotai';

export function SubjectFramingWarning() {
  const framingMessage = useAtomValue(subjectFramingAtom);
  const subjectTooFar = useAtomValue(subjectTooFarAtom);
  const detectionLost = useAtomValue(detectionLostAtom);

  if (!framingMessage || subjectTooFar || detectionLost) return null;

  return (
    <div
      data-testid="subject-framing-warning"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 z-20"
    >
      <p className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        {framingMessage}
      </p>
    </div>
  );
}
