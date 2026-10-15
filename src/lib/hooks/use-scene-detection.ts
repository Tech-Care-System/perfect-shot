'use client';

import { SCENE_DEBOUNCE_COUNT, SCENE_SAMPLE_INTERVAL_MS } from '@/constants/app.constants';
import { POSES_BY_SCENE } from '@/data/poses';
import type { SceneType } from '@/lib/types/pose.types';
import {
  poseCorrectionAtom,
  poseResultAtom,
  poseScoreAtom,
  selectPoseAtom,
  selectedSceneAtom,
} from '@/lib/stores/pose-store';
import { detectScene } from '@/lib/utils/detect-scene';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';

export function useSceneDetection(): void {
  const poseResult = useAtomValue(poseResultAtom);
  const selectedScene = useAtomValue(selectedSceneAtom);
  const setSelectedScene = useSetAtom(selectedSceneAtom);
  const setPoseScore = useSetAtom(poseScoreAtom);
  const setPoseCorrection = useSetAtom(poseCorrectionAtom);
  const doSelectPose = useSetAtom(selectPoseAtom);

  const lastSampleTimeRef = useRef(0);
  const debounceBufferRef = useRef<SceneType[]>([]);
  const hasFirstDetectionRef = useRef(false);

  const changeScene = useCallback(
    (scene: SceneType) => {
      setSelectedScene(scene);
      setPoseScore(0);
      setPoseCorrection(null);
      doSelectPose(POSES_BY_SCENE[scene][0] ?? null);
    },
    [setSelectedScene, setPoseScore, setPoseCorrection, doSelectPose]
  );

  useEffect(() => {
    if (!poseResult?.landmarks?.[0] || poseResult.landmarks[0].length < 33) {
      return;
    }

    const landmarks = poseResult.landmarks[0];
    const now = performance.now();

    const isFirstDetection = !hasFirstDetectionRef.current;

    if (!isFirstDetection && now - lastSampleTimeRef.current < SCENE_SAMPLE_INTERVAL_MS) {
      return;
    }

    const scene = detectScene(landmarks);
    lastSampleTimeRef.current = now;

    if (isFirstDetection) {
      hasFirstDetectionRef.current = true;
      debounceBufferRef.current = [scene, scene, scene];
      if (scene !== selectedScene) {
        changeScene(scene);
      }
      return;
    }

    const buffer = debounceBufferRef.current;
    buffer.push(scene);
    if (buffer.length > SCENE_DEBOUNCE_COUNT) {
      buffer.shift();
    }

    if (
      buffer.length === SCENE_DEBOUNCE_COUNT &&
      buffer.every((s) => s === scene) &&
      scene !== selectedScene
    ) {
      changeScene(scene);
    }
  }, [poseResult, selectedScene, changeScene]);
}
