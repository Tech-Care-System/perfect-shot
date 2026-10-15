'use client';

import {
    FEEDBACK_TRANSITION_MS,
    MATCH_FLASH_DURATION_MS,
    POSE_CLOSE_THRESHOLD,
    POSE_THRESHOLD,
} from '@/constants/app.constants';
import { poseScoreAtom, targetPoseAtom } from '@/lib/stores/pose-store';
import { liteModeAtom } from '@/lib/stores/settings-store';
import { cn } from '@/lib/utils';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const emptySubscribe = () => () => {};

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    typeof window === 'undefined'
      ? emptySubscribe
      : (cb) => {
          const mql = window.matchMedia(REDUCED_MOTION_QUERY);
          mql.addEventListener('change', cb);
          return () => mql.removeEventListener('change', cb);
        },
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  );
}

type GlowState = 'red' | 'yellow' | 'green';

const GLOW_SHADOWS: Record<GlowState, string> = {
  red: 'inset 0 0 60px 15px rgba(239, 68, 68, 0.4)',
  yellow: 'inset 0 0 60px 20px rgba(245, 158, 11, 0.5)',
  green: 'inset 0 0 60px 20px rgba(16, 185, 129, 0.5)',
};

function getGlowState(score: number): GlowState {
  if (score >= POSE_THRESHOLD) return 'green';
  if (score >= POSE_CLOSE_THRESHOLD) return 'yellow';
  return 'red';
}

export function FeedbackGlow() {
  const score = useAtomValue(poseScoreAtom);
  const target = useAtomValue(targetPoseAtom);
  const [flashVisible, setFlashVisible] = useState(false);
  const prevScoreRef = useRef(score);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevScoreRef.current < POSE_THRESHOLD && score >= POSE_THRESHOLD) {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      setTimeout(() => setFlashVisible(true), 0);
      flashTimeoutRef.current = setTimeout(() => {
        setFlashVisible(false);
      }, MATCH_FLASH_DURATION_MS);
    }
    prevScoreRef.current = score;
  }, [score]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const reducedMotion = usePrefersReducedMotion();
  const liteMode = useAtomValue(liteModeAtom);

  if (!target) return null;

  const glowState = getGlowState(score);
  const shouldReduceAnimations = reducedMotion || liteMode;
  const transitionMs = shouldReduceAnimations ? 0 : FEEDBACK_TRANSITION_MS;

  return (
    <>
      <div
        data-testid="feedback-glow"
        data-glow-state={glowState}
        className={cn(
          'pointer-events-none absolute inset-0 z-20',
          glowState === 'yellow' && !shouldReduceAnimations && 'animate-pulse motion-reduce:animate-none'
        )}
        style={{
          boxShadow: GLOW_SHADOWS[glowState],
          transition: `box-shadow ${transitionMs}ms ease-in-out`,
        }}
      />
      {flashVisible && (
        <div
          data-testid="match-flash"
          className="pointer-events-none absolute inset-0 z-20 bg-white/80"
        />
      )}
    </>
  );
}
