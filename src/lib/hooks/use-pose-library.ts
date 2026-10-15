'use client';

import { POSES_BY_SCENE } from '@/data/poses';
import type { PosePreset, SceneType } from '@/lib/types/pose.types';
import {
  availablePosesAtom,
  currentPoseAtom,
  nextPoseAtom,
  poseCorrectionAtom,
  poseScoreAtom,
  selectPoseAtom,
  selectedSceneAtom,
} from '@/lib/stores/pose-store';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useRef } from 'react';

export function usePoseLibrary() {
  const [selectedScene, setSelectedScene] = useAtom(selectedSceneAtom);
  const availablePoses = useAtomValue(availablePosesAtom);
  const currentPose = useAtomValue(currentPoseAtom);
  const doSelectPose = useSetAtom(selectPoseAtom);
  const setPoseScore = useSetAtom(poseScoreAtom);
  const setPoseCorrection = useSetAtom(poseCorrectionAtom);

  const selectPose = useCallback(
    (pose: PosePreset) => {
      setPoseScore(0);
      setPoseCorrection(null);
      doSelectPose(pose);
    },
    [doSelectPose, setPoseScore, setPoseCorrection]
  );

  const selectScene = useCallback(
    (scene: SceneType) => {
      setSelectedScene(scene);
      setPoseScore(0);
      setPoseCorrection(null);
      const scenePoses = POSES_BY_SCENE[scene];
      doSelectPose(scenePoses[0] ?? null);
    },
    [setSelectedScene, setPoseScore, setPoseCorrection, doSelectPose]
  );

  const nextPose = useSetAtom(nextPoseAtom);

  const hasInitRef = useRef(false);
  useEffect(() => {
    if (!hasInitRef.current && !currentPose) {
      doSelectPose(availablePoses[0] ?? null);
      hasInitRef.current = true;
    }
  }, [currentPose, doSelectPose, availablePoses]);

  return { selectedScene, availablePoses, currentPose, selectPose, selectScene, nextPose };
}
