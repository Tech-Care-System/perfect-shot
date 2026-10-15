import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { detectScene } from './detect-scene';

function createBaseLandmarks(): NormalizedLandmark[] {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.9,
  }));
}

function setLandmark(
  landmarks: NormalizedLandmark[],
  index: number,
  x: number,
  y: number,
  z = 0,
  visibility = 0.9
) {
  landmarks[index] = { x, y, z, visibility };
}

function createStandingLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.45, 0.25);
  setLandmark(lm, 12, 0.55, 0.25);
  setLandmark(lm, 23, 0.46, 0.50);
  setLandmark(lm, 24, 0.54, 0.50);
  setLandmark(lm, 25, 0.46, 0.72);
  setLandmark(lm, 26, 0.54, 0.72);
  setLandmark(lm, 27, 0.46, 0.92);
  setLandmark(lm, 28, 0.54, 0.92);
  return lm;
}

function createSeatedChairLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.45, 0.25);
  setLandmark(lm, 12, 0.55, 0.25);
  setLandmark(lm, 23, 0.46, 0.50);
  setLandmark(lm, 24, 0.54, 0.50);
  setLandmark(lm, 25, 0.46, 0.52);
  setLandmark(lm, 26, 0.54, 0.52);
  setLandmark(lm, 27, 0.46, 0.70);
  setLandmark(lm, 28, 0.54, 0.70);
  return lm;
}

function createReclinedSofaLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.35, 0.35);
  setLandmark(lm, 12, 0.45, 0.35);
  setLandmark(lm, 23, 0.46, 0.50);
  setLandmark(lm, 24, 0.54, 0.50);
  setLandmark(lm, 25, 0.46, 0.52);
  setLandmark(lm, 26, 0.54, 0.52);
  setLandmark(lm, 27, 0.46, 0.70);
  setLandmark(lm, 28, 0.54, 0.70);
  return lm;
}

function createWideStageLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.30, 0.25);
  setLandmark(lm, 12, 0.70, 0.25);
  setLandmark(lm, 23, 0.40, 0.50);
  setLandmark(lm, 24, 0.60, 0.50);
  setLandmark(lm, 25, 0.40, 0.72);
  setLandmark(lm, 26, 0.60, 0.72);
  setLandmark(lm, 27, 0.40, 0.92);
  setLandmark(lm, 28, 0.60, 0.92);
  return lm;
}

describe('detectScene', () => {
  it('returns standing for a person standing straight', () => {
    expect(detectScene(createStandingLandmarks())).toBe('standing');
  });

  it('returns solo-chair for seated posture with upright torso', () => {
    expect(detectScene(createSeatedChairLandmarks())).toBe('solo-chair');
  });

  it('returns sofa for seated posture with reclined torso', () => {
    expect(detectScene(createReclinedSofaLandmarks())).toBe('sofa');
  });

  it('returns stage for standing with wide lateral stance', () => {
    expect(detectScene(createWideStageLandmarks())).toBe('stage');
  });

  it('returns standing for empty landmarks array', () => {
    expect(detectScene([])).toBe('standing');
  });

  it('returns standing for fewer than 33 landmarks', () => {
    const partial = createBaseLandmarks().slice(0, 20);
    expect(detectScene(partial)).toBe('standing');
  });

  it('returns standing when key landmarks have low visibility', () => {
    const lm = createStandingLandmarks();
    setLandmark(lm, 23, 0.46, 0.50, 0, 0.05);
    setLandmark(lm, 24, 0.54, 0.50, 0, 0.05);
    expect(detectScene(lm)).toBe('standing');
  });

  it('returns standing when landmarks are undefined', () => {
    expect(detectScene(undefined as unknown as NormalizedLandmark[])).toBe('standing');
  });

  it('falls through to standing when knees have low visibility', () => {
    const lm = createStandingLandmarks();
    setLandmark(lm, 25, 0.46, 0.72, 0, 0.05);
    setLandmark(lm, 26, 0.54, 0.72, 0, 0.05);
    expect(detectScene(lm)).toBe('standing');
  });

  it('handles missing visibility gracefully (undefined = valid)', () => {
    const lm = createStandingLandmarks();
    lm[11] = { x: 0.45, y: 0.25, z: 0 } as NormalizedLandmark;
    lm[12] = { x: 0.55, y: 0.25, z: 0 } as NormalizedLandmark;
    expect(detectScene(lm)).toBe('standing');
  });
});
