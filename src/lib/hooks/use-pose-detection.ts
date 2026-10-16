'use client';

import { LITE_MODE_FPS, POSE_THRESHOLD } from '@/constants/app.constants';
import {
  detectionErrorAtom,
  detectionLostAtom,
  detectionRetrySignalAtom,
  poseCorrectionAtom,
  poseFpsAtom,
  poseResultAtom,
  poseScoreAtom,
  targetPoseAtom,
} from '@/lib/stores/pose-store';
import { liteModeAtom } from '@/lib/stores/settings-store';
import { calculatePoseSimilarity } from '@/lib/utils/calculate-similarity';
import { generateCorrection } from '@/lib/utils/generate-correction';
import { normalizeCameraPose } from '@/lib/utils/pose-projection';
import { logger } from '@/lib/utils/logger';
import { useAtomValue, useSetAtom } from 'jotai';

import { useCallback, useEffect, useRef } from 'react';
import { useAIWorker } from './use-ai-worker';

const COMPONENT_NAME = 'usePoseDetection';

/** Duration in ms after which we consider detection "lost" */
const DETECTION_LOST_THRESHOLD_MS = 3_000;

/** Interval in ms for checking the detection-lost watchdog */
const WATCHDOG_INTERVAL_MS = 1_000;

/**
 * Hook to manage the real-time pose detection loop.
 * Orchestrates frame capture from video and communication with AI worker.
 *
 * Implements:
 * - AC1: Real-time detection loop with duplicate-frame guard
 * - AC2: High-frequency data bypass via Jotai atoms
 * - AC3: Detection-loss watchdog (>3s without valid landmarks)
 * - AC5: Graceful error recovery (one restart attempt, then error atom)
 */
export function usePoseDetection() {
  const setPoseResult = useSetAtom(poseResultAtom);
  const setFps = useSetAtom(poseFpsAtom);
  const setPoseScore = useSetAtom(poseScoreAtom);
  const setPoseCorrection = useSetAtom(poseCorrectionAtom);
  const setDetectionLost = useSetAtom(detectionLostAtom);
  const setDetectionError = useSetAtom(detectionErrorAtom);
  const targetPose = useAtomValue(targetPoseAtom);
  const targetPoseRef = useRef(targetPose);

  const liteMode = useAtomValue(liteModeAtom);
  const liteModeRef = useRef(liteMode);


  const activeRef = useRef(false);
  const detectionInFlightRef = useRef(false);
  const stoppedDetectionResponsesRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectionFrameSizeRef = useRef<{ width: number; height: number } | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastProcessedTimeRef = useRef(-1);
  const lastSentTimestampRef = useRef(0);

  /** Timestamp of the most recent valid POSE_RESULT */
  const lastPoseReceivedAtRef = useRef<number | null>(null);

  /** Watchdog interval for detection-loss monitoring */
  const watchdogIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Whether we have already attempted one recovery restart */
  const hasAttemptedRestartRef = useRef(false);

  /** Stable reference to the loop function to avoid self-referencing lint errors */
  const loopRef = useRef<() => Promise<void>>(null!);

  const releaseDetectionSlot = () => {
    if (stoppedDetectionResponsesRef.current > 0) {
      stoppedDetectionResponsesRef.current -= 1;
      return false;
    }

    detectionInFlightRef.current = false;
    return true;
  };

  const { postMessage, workerStatus, error, restartWorker } = useAIWorker({
    onMessage: (response) => {
      if (response.type === 'POSE_RESULT') {
        if (!releaseDetectionSlot()) return true;
        setPoseResult(response.payload);
        if (response.payload.landmarks?.[0]?.length >= 33) {
          lastPoseReceivedAtRef.current = performance.now();
          setDetectionLost(false);
        }

        const target = targetPoseRef.current;
        if (target && response.payload.landmarks?.[0]) {
          const frame = detectionFrameSizeRef.current;
          const detected = normalizeCameraPose(response.payload.landmarks[0], frame?.width ?? 0, frame?.height ?? 0);
          const score = calculatePoseSimilarity(detected, target);
          setPoseScore(score);
          if (score < POSE_THRESHOLD) {
            setPoseCorrection(generateCorrection(detected, target));
          } else {
            setPoseCorrection(null);
          }
        } else {
          setPoseScore(0);
          setPoseCorrection(null);
        }

        return true;
      }
      if (response.type === 'ERROR') {
        releaseDetectionSlot();
        return false;
      }
      if (response.type === 'FPS_UPDATE') {
        setFps(response.payload.fps);
        // Return true to bypass React state update
        return true;
      }
      return false;
    },
  });

  const workerStatusRef = useRef(workerStatus);

  const stopWatchdog = useCallback(() => {
    if (watchdogIntervalRef.current !== null) {
      clearInterval(watchdogIntervalRef.current);
      watchdogIntervalRef.current = null;
    }
  }, []);

  // ── Detection-loss watchdog (AC3) ──────────────────────────────
  const startWatchdog = useCallback(() => {
    stopWatchdog();
    watchdogIntervalRef.current = setInterval(() => {
      if (!activeRef.current || lastPoseReceivedAtRef.current === null) return;

      const elapsed = performance.now() - lastPoseReceivedAtRef.current;
      if (elapsed > DETECTION_LOST_THRESHOLD_MS) {
        setDetectionLost(true);
      }
    }, WATCHDOG_INTERVAL_MS);
  }, [setDetectionLost, stopWatchdog]);

  // ── Frame processing loop (AC1) ───────────────────────────────
  const loop = useCallback(async () => {
    if (!activeRef.current || !videoRef.current) {
      return;
    }

    if (detectionInFlightRef.current) {
      animationFrameIdRef.current = window.requestAnimationFrame(loopRef.current);
      return;
    }

    const video = videoRef.current;

    /**
     * AC1: Real-time Detection Loop
     * Checks video.currentTime vs lastVideoTime to skip duplicate frames.
     * Synchronizes with camera feed via requestAnimationFrame.
     */
    if (video.currentTime !== lastProcessedTimeRef.current && video.readyState >= 2) {
      lastProcessedTimeRef.current = video.currentTime;

      if (liteModeRef.current) {
        const now = performance.now();
        if (now - lastSentTimestampRef.current < 1000 / LITE_MODE_FPS) {
          if (activeRef.current) {
            animationFrameIdRef.current = window.requestAnimationFrame(loopRef.current);
          }
          return;
        }
        lastSentTimestampRef.current = now;
      }

      if (
        workerStatusRef.current !== 'ready' ||
        !video ||
        video.paused ||
        video.ended ||
        video.readyState < 2
      ) {
            if (activeRef.current) {
                 const reason = workerStatusRef.current !== 'ready' ? 'worker not ready' : !video ? 'no video' : video.readyState < 2 ? `readState ${video?.readyState}` : 'video paused/ended';
                 if (Math.random() < 0.05) logger.log(COMPONENT_NAME, 'Skipping detection loop', { reason });
            }
        // If any of these conditions are met, we skip processing this frame
        // but still request the next animation frame to keep the loop alive.
      } else {
        // Frame is valid and worker is ready, proceed with detection
        let imageBitmap: ImageBitmap | null = null;
        try {
          /**
           * Convert video frame to ImageBitmap for structured cloning/transferring.
           * This is more performant than sending raw pixels or relying on implicit cloning.
           */
          imageBitmap = await createImageBitmap(video);

          if (!activeRef.current) {
            imageBitmap.close();
            return;
          }

          /**
           * Send to worker with transfer list for zero-copy performance.
           * The imageBitmap becomes unusable in the main thread after this call.
           */
          detectionInFlightRef.current = true;
          detectionFrameSizeRef.current = { width: imageBitmap.width, height: imageBitmap.height };
          const sent = postMessage(
            {
              type: 'DETECT',
              payload: {
                image: imageBitmap,
                timestamp: performance.now(),
              },
            },
            [imageBitmap]
          );
          if (!sent) {
            detectionInFlightRef.current = false;
            imageBitmap.close();
          } else if (Math.random() < 0.05) {
            logger.log(COMPONENT_NAME, 'Sending frame to worker');
          }

        } catch (err) {
          detectionInFlightRef.current = false;
          imageBitmap?.close();
          // Silently ignore frame capture errors to maintain loop stability
          // Error handling for worker crashes is managed by useAIWorker
          logger.warn(COMPONENT_NAME, 'Failed to create image bitmap for detection', err);
        }
      }
    }

    if (activeRef.current) {
      animationFrameIdRef.current = window.requestAnimationFrame(loopRef.current);
    }
  }, [postMessage]);
  // ── Manual retry signal (AC5) ─────────────────────────────────

  const retrySignal = useAtomValue(detectionRetrySignalAtom);
  const prevRetrySignalRef = useRef(retrySignal);

  useEffect(() => {
    if (retrySignal > prevRetrySignalRef.current) {
      logger.log(COMPONENT_NAME, 'Manual retry signal received');
      hasAttemptedRestartRef.current = false; // Reset restart flag
      setDetectionError(null);
      restartWorker();
      prevRetrySignalRef.current = retrySignal;
    }
  }, [retrySignal, restartWorker, setDetectionError]);

  // ── Start / Stop API ──────────────────────────────────────────


  /**
   * Starts the detection loop on the given video element.
   * Enforces `video.readyState >= 2` (HAVE_CURRENT_DATA) before activating
   * the loop to prevent submitting blank or incomplete frames.
   */
  const startDetection = useCallback(
    (video: HTMLVideoElement) => {
      videoRef.current = video;

      // Start loop immediately; the loop will check readyState internally and wait
      if (!activeRef.current) {

        activeRef.current = true;
        lastPoseReceivedAtRef.current = performance.now();
        hasAttemptedRestartRef.current = false;
        setDetectionLost(false);
        setDetectionError(null);
        loop();
        startWatchdog();
      }
    },
    [loop, startWatchdog, setDetectionLost, setDetectionError]
  );

  const stopDetection = useCallback(() => {
    activeRef.current = false;
    if (detectionInFlightRef.current) {
      stoppedDetectionResponsesRef.current += 1;
      detectionInFlightRef.current = false;
    }
    if (animationFrameIdRef.current !== null) {
      window.cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    stopWatchdog();
  }, [stopWatchdog]);

  // ── Error recovery (AC5) ──────────────────────────────────────
  useEffect(() => {
    if (workerStatus !== 'error') return;

    // Ensure the loop is stopped when an error occurs
    if (activeRef.current) {
      stopDetection();
    }

    if (!hasAttemptedRestartRef.current) {
      // Attempt exactly one restart
      hasAttemptedRestartRef.current = true;
      logger.warn(COMPONENT_NAME, 'Worker error detected, attempting one restart');
      restartWorker();
    } else {
      // Second failure after restart — surface error to UI
      const errorMessage = error ?? 'Pose detection failed after recovery attempt';
      logger.error(COMPONENT_NAME, typeof errorMessage === 'string' ? errorMessage : 'Worker Error', errorMessage);
      setDetectionError(errorMessage);

    }
  }, [workerStatus, error, stopDetection, restartWorker, setDetectionError]);

  // ── Re-start loop when worker recovers from restart ───────────
  useEffect(() => {
    if (
      workerStatus === 'ready' &&
      hasAttemptedRestartRef.current &&
      videoRef.current &&
      !activeRef.current
    ) {
      logger.log(COMPONENT_NAME, 'Worker recovered after restart, resuming detection');
      const video = videoRef.current;
      activeRef.current = true;
      lastPoseReceivedAtRef.current = performance.now();
      setDetectionLost(false);
      loop();
      startWatchdog();

      // Prevent this effect from firing again on unrelated re-renders
      void video;
    }
  }, [workerStatus, loop, startWatchdog, setDetectionLost]);

  /**
   * Clean up loop, watchdog, and animation frames on unmount.
   */
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  useEffect(() => {
    if (workerStatus === 'loading') {
      detectionInFlightRef.current = false;
      stoppedDetectionResponsesRef.current = 0;
    }
    targetPoseRef.current = targetPose;
    liteModeRef.current = liteMode;
    workerStatusRef.current = workerStatus;
    loopRef.current = loop;
  }, [targetPose, liteMode, workerStatus, loop]);

  return {

    startDetection,
    stopDetection,
    workerStatus,
    error,
  };
}
