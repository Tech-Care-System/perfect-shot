import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { MATCHING_LANDMARK_INDICES } from '@/lib/types/pose.types';
import {
  calculateCosineSimilarity,
  calculatePoseSimilarity,
  centerOnHips,
  normalizeByTorsoLength,
} from './calculate-similarity';

function lm(x: number, y: number, z = 0): NormalizedLandmark {
  return { x, y, z, visibility: 1 };
}

function createFullPose(overrides: Partial<Record<number, NormalizedLandmark>> = {}): NormalizedLandmark[] {
  const pose: NormalizedLandmark[] = [];
  for (let i = 0; i < 33; i++) {
    pose.push(overrides[i] ?? lm(0.5, 0.5));
  }
  return pose;
}

function createStandingPose(offsetX = 0, offsetY = 0, scale = 1): NormalizedLandmark[] {
  const base: Record<number, NormalizedLandmark> = {
    11: lm((0.45 + offsetX) * scale, (0.3 + offsetY) * scale),
    12: lm((0.55 + offsetX) * scale, (0.3 + offsetY) * scale),
    13: lm((0.4 + offsetX) * scale, (0.45 + offsetY) * scale),
    14: lm((0.6 + offsetX) * scale, (0.45 + offsetY) * scale),
    15: lm((0.38 + offsetX) * scale, (0.55 + offsetY) * scale),
    16: lm((0.62 + offsetX) * scale, (0.55 + offsetY) * scale),
    23: lm((0.47 + offsetX) * scale, (0.6 + offsetY) * scale),
    24: lm((0.53 + offsetX) * scale, (0.6 + offsetY) * scale),
    25: lm((0.46 + offsetX) * scale, (0.75 + offsetY) * scale),
    26: lm((0.54 + offsetX) * scale, (0.75 + offsetY) * scale),
    27: lm((0.45 + offsetX) * scale, (0.9 + offsetY) * scale),
    28: lm((0.55 + offsetX) * scale, (0.9 + offsetY) * scale),
  };
  return createFullPose(base);
}

function createDifferentPose(): NormalizedLandmark[] {
  const base: Record<number, NormalizedLandmark> = {
    11: lm(0.45, 0.7),
    12: lm(0.55, 0.7),
    13: lm(0.4, 0.85),
    14: lm(0.6, 0.85),
    15: lm(0.38, 0.95),
    16: lm(0.62, 0.95),
    23: lm(0.47, 0.4),
    24: lm(0.53, 0.4),
    25: lm(0.46, 0.25),
    26: lm(0.54, 0.25),
    27: lm(0.45, 0.1),
    28: lm(0.55, 0.1),
  };
  return createFullPose(base);
}

describe('calculateCosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = [1, 2, 3];
    expect(calculateCosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(calculateCosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it('returns 0 for empty vectors', () => {
    expect(calculateCosineSimilarity([], [])).toBe(0);
  });

  it('returns 0 for mismatched lengths', () => {
    expect(calculateCosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it('returns 0 for zero vectors', () => {
    expect(calculateCosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it('clamps negative similarity to 0', () => {
    const result = calculateCosineSimilarity([1, 0], [-1, 0]);
    expect(result).toBe(0);
  });
});

describe('centerOnHips', () => {
  it('centers landmarks on hip midpoint', () => {
    const subset = MATCHING_LANDMARK_INDICES.map((idx) => {
      if (idx === 23) return lm(0.4, 0.6);
      if (idx === 24) return lm(0.6, 0.6);
      return lm(0.5, 0.3);
    });

    const centered = centerOnHips(subset);

    expect(centered[6].x).toBeCloseTo(-0.1, 5);
    expect(centered[6].y).toBeCloseTo(0, 5);
    expect(centered[7].x).toBeCloseTo(0.1, 5);
    expect(centered[7].y).toBeCloseTo(0, 5);
    expect(centered[0].x).toBeCloseTo(0, 5);
    expect(centered[0].y).toBeCloseTo(-0.3, 5);
  });
});

describe('normalizeByTorsoLength', () => {
  it('divides all coordinates by torso length', () => {
    const subset = MATCHING_LANDMARK_INDICES.map((idx) => {
      if (idx === 11) return lm(0, -0.3);
      if (idx === 12) return lm(0, -0.3);
      if (idx === 23) return lm(0, 0);
      if (idx === 24) return lm(0, 0);
      return lm(0.6, 0.6);
    });

    const normalized = normalizeByTorsoLength(subset);

    expect(normalized[0].y).toBeCloseTo(-1, 5);
    expect(normalized[6].y).toBeCloseTo(0, 5);
  });

  it('returns unchanged landmarks when torso length is near zero', () => {
    const subset = MATCHING_LANDMARK_INDICES.map(() => lm(0.5, 0.5));
    const result = normalizeByTorsoLength(subset);
    expect(result[0].x).toBe(0.5);
  });
});

describe('calculatePoseSimilarity', () => {
  it('returns ~1.0 for identical poses', () => {
    const pose = createStandingPose();
    expect(calculatePoseSimilarity(pose, pose)).toBeCloseTo(1, 3);
  });

  it('returns score < 0.5 for completely different poses', () => {
    const standing = createStandingPose();
    const different = createDifferentPose();
    const score = calculatePoseSimilarity(standing, different);
    expect(score).toBeLessThan(0.5);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('is translation-invariant', () => {
    const centered = createStandingPose(0, 0);
    const shifted = createStandingPose(0.2, -0.15);
    const score = calculatePoseSimilarity(centered, shifted);
    expect(score).toBeCloseTo(1, 2);
  });

  it('is scale-invariant', () => {
    const normal = createStandingPose(0, 0, 1);
    const scaled = createStandingPose(0, 0, 0.6);
    const score = calculatePoseSimilarity(normal, scaled);
    expect(score).toBeCloseTo(1, 2);
  });

  it('z-axis differences have less impact than x/y differences', () => {
    const base = createStandingPose();

    const xyShifted = createFullPose({
      ...Object.fromEntries(MATCHING_LANDMARK_INDICES.map((idx) => [idx, lm(base[idx].x, base[idx].y)])),
      11: lm(base[11].x + 0.15, base[11].y),
      13: lm(base[13].x + 0.15, base[13].y),
    });

    const zShifted = createFullPose({
      ...Object.fromEntries(MATCHING_LANDMARK_INDICES.map((idx) => [idx, lm(base[idx].x, base[idx].y)])),
      11: lm(base[11].x, base[11].y, 0.15),
      13: lm(base[13].x, base[13].y, 0.15),
    });

    const scoreXY = calculatePoseSimilarity(base, xyShifted);
    const scoreZ = calculatePoseSimilarity(base, zShifted);
    expect(scoreZ).toBeGreaterThan(scoreXY);
  });

  it('returns 0 for null detected pose', () => {
    expect(calculatePoseSimilarity(null as unknown as NormalizedLandmark[], createStandingPose())).toBe(0);
  });

  it('returns 0 for null target pose', () => {
    expect(calculatePoseSimilarity(createStandingPose(), null as unknown as NormalizedLandmark[])).toBe(0);
  });

  it('returns 0 for empty arrays', () => {
    expect(calculatePoseSimilarity([], [])).toBe(0);
  });

  it('returns 0 when landmarks have invalid coordinates', () => {
    const pose = createFullPose({ 11: lm(NaN, 0.5) });
    expect(calculatePoseSimilarity(pose, createStandingPose())).toBe(0);
  });

  it('returns 0 when landmarks have very low visibility', () => {
    const pose = createFullPose({ 11: { x: 0.45, y: 0.3, z: 0, visibility: 0.05 } });
    expect(calculatePoseSimilarity(pose, createStandingPose())).toBe(0);
  });

  it('only uses MATCHING_LANDMARK_INDICES (excludes face points)', () => {
    const base = createStandingPose();
    const withDifferentFace = [...base];
    for (let i = 0; i <= 10; i++) {
      withDifferentFace[i] = lm(Math.random(), Math.random(), Math.random());
    }
    const score = calculatePoseSimilarity(base, withDifferentFace);
    expect(score).toBeCloseTo(1, 3);
  });
});
