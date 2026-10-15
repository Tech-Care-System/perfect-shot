'use client';

import { LIGHTING_POOR_DEBOUNCE, LIGHTING_SAMPLE_INTERVAL_MS } from '@/constants/app.constants';
import { lightingPoorAtom, poseResultAtom } from '@/lib/stores/pose-store';
import { detectLighting } from '@/lib/utils/detect-lighting';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

export function useLightingDetection(): void {
  const poseResult = useAtomValue(poseResultAtom);
  const setLightingPoor = useSetAtom(lightingPoorAtom);

  const lastSampleTimeRef = useRef(0);
  const poorCountRef = useRef(0);

  useEffect(() => {
    if (!poseResult?.landmarks?.[0] || poseResult.landmarks[0].length < 33) {
      return;
    }

    const now = performance.now();
    if (now - lastSampleTimeRef.current < LIGHTING_SAMPLE_INTERVAL_MS) {
      return;
    }

    const landmarks = poseResult.landmarks[0];
    lastSampleTimeRef.current = now;

    const result = detectLighting(landmarks);

    if (result === 'ok') {
      poorCountRef.current = 0;
      setLightingPoor(false);
    } else {
      poorCountRef.current += 1;
      if (poorCountRef.current >= LIGHTING_POOR_DEBOUNCE) {
        setLightingPoor(true);
      }
    }
  }, [poseResult, setLightingPoor]);
}
