import { POSES_BY_SCENE } from '@/data/poses';
import { SCENE_TYPES } from '@/constants/app.constants';
import { createStore } from 'jotai';
import {
  availablePosesAtom,
  currentPoseAtom,
  poseHintAtom,
  selectPoseAtom,
  selectedSceneAtom,
  targetPoseAtom,
} from './pose-store';

describe('pose-store atoms', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe('selectedSceneAtom', () => {
    it('defaults to standing', () => {
      expect(store.get(selectedSceneAtom)).toBe('standing');
    });

    it('can be set to any scene type', () => {
      for (const scene of SCENE_TYPES) {
        store.set(selectedSceneAtom, scene);
        expect(store.get(selectedSceneAtom)).toBe(scene);
      }
    });
  });

  describe('currentPoseAtom', () => {
    it('defaults to null', () => {
      expect(store.get(currentPoseAtom)).toBeNull();
    });
  });

  describe('availablePosesAtom', () => {
    it('returns standing poses by default', () => {
      const poses = store.get(availablePosesAtom);
      expect(poses).toBe(POSES_BY_SCENE['standing']);
    });

    it('returns correct poses for each scene type', () => {
      for (const scene of SCENE_TYPES) {
        store.set(selectedSceneAtom, scene);
        const poses = store.get(availablePosesAtom);
        expect(poses).toBe(POSES_BY_SCENE[scene]);
        expect(poses.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('recomputes when selectedSceneAtom changes', () => {
      const standingPoses = store.get(availablePosesAtom);
      store.set(selectedSceneAtom, 'sofa');
      const sofaPoses = store.get(availablePosesAtom);
      expect(standingPoses).not.toBe(sofaPoses);
      expect(sofaPoses).toBe(POSES_BY_SCENE['sofa']);
    });
  });

  describe('selectPoseAtom', () => {
    it('sets currentPoseAtom, targetPoseAtom, and poseHintAtom when given a pose', () => {
      const pose = POSES_BY_SCENE['standing'][0];
      store.set(selectPoseAtom, pose);

      expect(store.get(currentPoseAtom)).toBe(pose);
      expect(store.get(targetPoseAtom)).toBe(pose.targetLandmarks);
      expect(store.get(poseHintAtom)).toEqual({
        name: pose.name,
        hint: pose.actionHint,
      });
    });

    it('clears all three atoms when given null', () => {
      const pose = POSES_BY_SCENE['standing'][0];
      store.set(selectPoseAtom, pose);

      store.set(selectPoseAtom, null);

      expect(store.get(currentPoseAtom)).toBeNull();
      expect(store.get(targetPoseAtom)).toBeNull();
      expect(store.get(poseHintAtom)).toBeNull();
    });

    it('updates all atoms atomically across different poses', () => {
      const pose1 = POSES_BY_SCENE['standing'][0];
      const pose2 = POSES_BY_SCENE['sofa'][0];

      store.set(selectPoseAtom, pose1);
      expect(store.get(currentPoseAtom)).toBe(pose1);

      store.set(selectPoseAtom, pose2);
      expect(store.get(currentPoseAtom)).toBe(pose2);
      expect(store.get(targetPoseAtom)).toBe(pose2.targetLandmarks);
      expect(store.get(poseHintAtom)).toEqual({
        name: pose2.name,
        hint: pose2.actionHint,
      });
    });
  });
});
