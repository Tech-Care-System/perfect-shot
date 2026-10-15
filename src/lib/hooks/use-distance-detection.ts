'use client';

import { DISTANCE_SAMPLE_INTERVAL_MS, DISTANCE_TOO_FAR_DEBOUNCE } from '@/constants/app.constants';
import { poseResultAtom, subjectTooFarAtom } from '@/lib/stores/pose-store';
import { detectSubjectDistance } from '@/lib/utils/detect-distance';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

export function useDistanceDetection(): void {
  const poseResult = useAtomValue(poseResultAtom);
  const setSubjectTooFar = useSetAtom(subjectTooFarAtom);

  const lastSampleTimeRef = useRef(0);
  const tooFarCountRef = useRef(0);

  useEffect(() => {
    if (!poseResult?.landmarks?.[0] || poseResult.landmarks[0].length < 33) {
      return;
    }

    const now = performance.now();
    if (now - lastSampleTimeRef.current < DISTANCE_SAMPLE_INTERVAL_MS) {
      return;
    }

    const landmarks = poseResult.landmarks[0];
    lastSampleTimeRef.current = now;

    const distance = detectSubjectDistance(landmarks);

    if (distance === 'ok') {
      tooFarCountRef.current = 0;
      setSubjectTooFar(false);
    } else {
      tooFarCountRef.current += 1;
      if (tooFarCountRef.current >= DISTANCE_TOO_FAR_DEBOUNCE) {
        setSubjectTooFar(true);
      }
    }
  }, [poseResult, setSubjectTooFar]);
}
