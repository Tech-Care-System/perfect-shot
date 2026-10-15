import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { generateCorrection } from './generate-correction';

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

function createStandingPose(): NormalizedLandmark[] {
  return createFullPose({
    11: lm(0.45, 0.3),
    12: lm(0.55, 0.3),
    13: lm(0.4, 0.45),
    14: lm(0.6, 0.45),
    15: lm(0.38, 0.55),
    16: lm(0.62, 0.55),
    23: lm(0.47, 0.6),
    24: lm(0.53, 0.6),
    25: lm(0.46, 0.75),
    26: lm(0.54, 0.75),
    27: lm(0.45, 0.9),
    28: lm(0.55, 0.9),
  });
}

describe('generateCorrection', () => {
  it('returns null for identical poses', () => {
    const pose = createStandingPose();
    expect(generateCorrection(pose, pose)).toBeNull();
  });

  it('returns shoulder correction when shoulders are most misaligned', () => {
    const target = createStandingPose();
    const detected = createFullPose({
      11: lm(0.30, 0.3),
      12: lm(0.40, 0.3),
      13: lm(0.4, 0.45),
      14: lm(0.6, 0.45),
      15: lm(0.38, 0.55),
      16: lm(0.62, 0.55),
      23: lm(0.47, 0.6),
      24: lm(0.53, 0.6),
      25: lm(0.46, 0.75),
      26: lm(0.54, 0.75),
      27: lm(0.45, 0.9),
      28: lm(0.55, 0.9),
    });
    const result = generateCorrection(detected, target);
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toMatch(/shoulder/);
  });

  it('returns arm correction when elbows/wrists are most misaligned', () => {
    const target = createStandingPose();
    const detected = createFullPose({
      11: lm(0.45, 0.3),
      12: lm(0.55, 0.3),
      13: lm(0.25, 0.45),
      14: lm(0.45, 0.45),
      15: lm(0.38, 0.55),
      16: lm(0.62, 0.55),
      23: lm(0.47, 0.6),
      24: lm(0.53, 0.6),
      25: lm(0.46, 0.75),
      26: lm(0.54, 0.75),
      27: lm(0.45, 0.9),
      28: lm(0.55, 0.9),
    });
    const result = generateCorrection(detected, target);
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toMatch(/arm|hand/);
  });

  it('returns null for null or empty inputs', () => {
    const pose = createStandingPose();
    expect(generateCorrection(null as unknown as NormalizedLandmark[], pose)).toBeNull();
    expect(generateCorrection(pose, null as unknown as NormalizedLandmark[])).toBeNull();
    expect(generateCorrection([], [])).toBeNull();
  });

  it('shoulder correction takes precedence over arm correction when both are misaligned equally', () => {
    const target = createStandingPose();
    const detected = createFullPose({
      11: lm(0.30, 0.3),
      12: lm(0.40, 0.3),
      13: lm(0.25, 0.45),
      14: lm(0.45, 0.45),
      15: lm(0.38, 0.55),
      16: lm(0.62, 0.55),
      23: lm(0.47, 0.6),
      24: lm(0.53, 0.6),
      25: lm(0.46, 0.75),
      26: lm(0.54, 0.75),
      27: lm(0.45, 0.9),
      28: lm(0.55, 0.9),
    });
    const result = generateCorrection(detected, target);
    expect(result).not.toBeNull();
    expect(result!.toLowerCase()).toMatch(/shoulder/);
  });

  it('correction text uses casual language', () => {
    const target = createStandingPose();
    const detected = createFullPose({
      11: lm(0.30, 0.3),
      12: lm(0.40, 0.3),
      13: lm(0.4, 0.45),
      14: lm(0.6, 0.45),
      15: lm(0.38, 0.55),
      16: lm(0.62, 0.55),
      23: lm(0.47, 0.6),
      24: lm(0.53, 0.6),
      25: lm(0.46, 0.75),
      26: lm(0.54, 0.75),
      27: lm(0.45, 0.9),
      28: lm(0.55, 0.9),
    });
    const result = generateCorrection(detected, target);
    expect(result).not.toBeNull();
    expect(result).not.toMatch(/axis|displacement|coordinate|vector|normalize/i);
  });
});
