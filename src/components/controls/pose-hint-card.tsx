'use client';

import { poseHintAtom } from '@/lib/stores/pose-store';
import { useAtomValue } from 'jotai';

export function PoseHintCard() {
  const poseHint = useAtomValue(poseHintAtom);

  if (!poseHint) return null;

  return (
    <div
      data-testid="pose-hint-card"
      aria-live="polite"
      role="status"
      className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a]/80 backdrop-blur-sm rounded-2xl px-5 py-3"
    >
      <p className="text-xl font-semibold text-white">{poseHint.name}</p>
      <p className="text-sm text-neutral-400">{poseHint.hint}</p>
    </div>
  );
}
