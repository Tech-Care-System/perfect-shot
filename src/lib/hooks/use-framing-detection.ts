'use client';

import type { CameraFacingMode } from '@/lib/types/camera.types';
import { FRAMING_DEBOUNCE_COUNT, FRAMING_SAMPLE_INTERVAL_MS } from '@/constants/app.constants';
import { cameraFacingModeAtom } from '@/lib/stores/camera-store';
import { poseResultAtom, subjectFramingAtom } from '@/lib/stores/pose-store';
import { detectFraming, type FramingResult } from '@/lib/utils/detect-framing';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

function getFramingMessage(result: FramingResult, facingMode: CameraFacingMode): string | null {
  if (result === 'ok') return null;
  const isFront = facingMode === 'user';
  if (result === 'cut-left') {
    return isFront ? 'Move left to fit in frame' : 'Move right to fit in frame';
  }
  return isFront ? 'Move right to fit in frame' : 'Move left to fit in frame';
}

export function useFramingDetection(): void {
  const poseResult = useAtomValue(poseResultAtom);
  const facingMode = useAtomValue(cameraFacingModeAtom);
  const setSubjectFraming = useSetAtom(subjectFramingAtom);

  const lastSampleTimeRef = useRef(0);
  const consecutiveCountRef = useRef(0);
  const lastResultRef = useRef<FramingResult>('ok');
  const prevFacingModeRef = useRef(facingMode);

  useEffect(() => {
    if (facingMode === prevFacingModeRef.current) return;
    prevFacingModeRef.current = facingMode;
    if (lastResultRef.current !== 'ok' && consecutiveCountRef.current >= FRAMING_DEBOUNCE_COUNT) {
      setSubjectFraming(getFramingMessage(lastResultRef.current, facingMode));
    }
  }, [facingMode, setSubjectFraming]);

  useEffect(() => {
    if (!poseResult?.landmarks?.[0] || poseResult.landmarks[0].length < 33) {
      return;
    }

    const now = performance.now();
    if (now - lastSampleTimeRef.current < FRAMING_SAMPLE_INTERVAL_MS) {
      return;
    }

    const landmarks = poseResult.landmarks[0];
    lastSampleTimeRef.current = now;

    const result = detectFraming(landmarks);

    if (result === 'ok') {
      consecutiveCountRef.current = 0;
      lastResultRef.current = 'ok';
      setSubjectFraming(null);
    } else if (result === lastResultRef.current) {
      consecutiveCountRef.current += 1;
      if (consecutiveCountRef.current >= FRAMING_DEBOUNCE_COUNT) {
        setSubjectFraming(getFramingMessage(result, facingMode));
      }
    } else {
      lastResultRef.current = result;
      consecutiveCountRef.current = 1;
    }
  }, [poseResult, facingMode, setSubjectFraming]);
}
