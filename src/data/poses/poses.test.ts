import { SCENE_TYPES } from '@/constants/app.constants';
import { MATCHING_LANDMARK_INDICES } from '@/lib/types/pose.types';
import { calculatePoseSimilarity } from '@/lib/utils/calculate-similarity';
import { ALL_POSES, POSES_BY_SCENE } from './index';

describe('Pose Library', () => {
  it('ALL_POSES has 13 entries', () => {
    expect(ALL_POSES).toHaveLength(13);
  });

  it('POSES_BY_SCENE has all 4 scene types as keys', () => {
    for (const scene of SCENE_TYPES) {
      expect(POSES_BY_SCENE).toHaveProperty(scene);
      expect(POSES_BY_SCENE[scene].length).toBeGreaterThanOrEqual(3);
    }
  });

  it('every pose has non-empty id, name, actionHint, and valid sceneType', () => {
    for (const pose of ALL_POSES) {
      expect(pose.id).toBeTruthy();
      expect(pose.name).toBeTruthy();
      expect(pose.actionHint).toBeTruthy();
      expect(SCENE_TYPES as readonly string[]).toContain(pose.sceneType);
    }
  });

  it('every pose targetLandmarks has exactly 33 elements', () => {
    for (const pose of ALL_POSES) {
      expect(pose.targetLandmarks).toHaveLength(33);
    }
  });

  it('all pose IDs are unique', () => {
    const ids = ALL_POSES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all pose IDs follow {sceneType}-{number} pattern', () => {
    const pattern = /^(solo-chair|sofa|standing|stage)-\d+$/;
    for (const pose of ALL_POSES) {
      expect(pose.id).toMatch(pattern);
      expect(pose.id).toMatch(new RegExp(`^${pose.sceneType}-`));
    }
  });

  it('matching landmarks (indices 11-16, 23-28) have visibility >= 0.5', () => {
    for (const pose of ALL_POSES) {
      for (const idx of MATCHING_LANDMARK_INDICES) {
        const lm = pose.targetLandmarks[idx];
        expect(lm.visibility).toBeGreaterThanOrEqual(0.5);
      }
    }
  });

  it('within-scene poses are distinguishable (similarity < 0.7)', () => {
    for (const scene of SCENE_TYPES) {
      const poses = POSES_BY_SCENE[scene];
      for (let i = 0; i < poses.length; i++) {
        for (let j = i + 1; j < poses.length; j++) {
          const score = calculatePoseSimilarity(
            poses[i].targetLandmarks,
            poses[j].targetLandmarks
          );
          expect(score).toBeLessThan(0.7);
        }
      }
    }
  });
});
