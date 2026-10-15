import type { PosePreset, SceneType } from '@/lib/types/pose.types';
import soloChairPoses from './solo-chair.json';
import sofaPoses from './sofa.json';
import standingPoses from './standing.json';
import stagePoses from './stage.json';

export const ALL_POSES: PosePreset[] = [
  ...(standingPoses as PosePreset[]),
  ...(soloChairPoses as PosePreset[]),
  ...(sofaPoses as PosePreset[]),
  ...(stagePoses as PosePreset[]),
];

export const POSES_BY_SCENE: Record<SceneType, PosePreset[]> = {
  standing: standingPoses as PosePreset[],
  'solo-chair': soloChairPoses as PosePreset[],
  sofa: sofaPoses as PosePreset[],
  stage: stagePoses as PosePreset[],
};
