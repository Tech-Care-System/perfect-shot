'use client';

import { POSE_THRESHOLD, SMART_SHUTTER_HOLD_MS } from '@/constants/app.constants';
import { capturedPhotoAtom, cameraFacingModeAtom, videoElementAtom } from '@/lib/stores/camera-store';
import { detectionLostAtom, poseScoreAtom } from '@/lib/stores/pose-store';
import { playDing } from '@/lib/utils/audio-feedback';
import { triggerHaptic } from '@/lib/utils/haptic-feedback';
import { capturePhoto } from '@/lib/utils/capture-photo';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';

export function useSmartShutter(): void {
  const score = useAtomValue(poseScoreAtom);
  const detectionLost = useAtomValue(detectionLostAtom);
  const capturedPhoto = useAtomValue(capturedPhotoAtom);
  const facingMode = useAtomValue(cameraFacingModeAtom);
  const videoElement = useAtomValue(videoElementAtom);
  const setCapturedPhoto = useSetAtom(capturedPhotoAtom);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasDingedRef = useRef(false);

  useEffect(() => {
    const shouldCapture = score >= POSE_THRESHOLD && !detectionLost && !capturedPhoto;

    if (shouldCapture && !hasDingedRef.current) {
      hasDingedRef.current = true;
      playDing();
      triggerHaptic('short');
    }
    if (!shouldCapture) {
      hasDingedRef.current = false;
    }

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (shouldCapture) {
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        if (videoElement) {
          const isMirrored = facingMode === 'user';
          const dataUrl = capturePhoto(videoElement, isMirrored);
          if (dataUrl) setCapturedPhoto(dataUrl);
        }
      }, SMART_SHUTTER_HOLD_MS);
    }
  }, [score, detectionLost, capturedPhoto, facingMode, videoElement, setCapturedPhoto]);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);
}
