import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { SCENE_TYPES } from '@/constants/app.constants';

export type TargetPose = NormalizedLandmark[];

export interface PoseHint {
  name: string;
  hint: string;
}

export type SceneType = (typeof SCENE_TYPES)[number];

export interface PosePreset {
  id: string;
  name: string;
  actionHint: string;
  sceneType: SceneType;
  targetLandmarks: TargetPose;
}

export const MATCHING_LANDMARK_INDICES = [
  11, 12,
  13, 14,
  15, 16,
  23, 24,
  25, 26,
  27, 28,
] as const;
