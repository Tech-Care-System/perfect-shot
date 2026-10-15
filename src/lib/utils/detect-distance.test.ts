import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { detectSubjectDistance } from './detect-distance';

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

function createOkDistanceLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.45, 0.25);
  setLandmark(lm, 12, 0.55, 0.25);
  setLandmark(lm, 23, 0.46, 0.50);
  setLandmark(lm, 24, 0.54, 0.50);
  return lm;
}

function createTooFarLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.48, 0.45);
  setLandmark(lm, 12, 0.52, 0.45);
  setLandmark(lm, 23, 0.49, 0.52);
  setLandmark(lm, 24, 0.51, 0.52);
  return lm;
}

describe('detectSubjectDistance', () => {
  it('returns ok when torso height >= 0.10', () => {
    expect(detectSubjectDistance(createOkDistanceLandmarks())).toBe('ok');
  });

  it('returns too-far when torso height < 0.10', () => {
    expect(detectSubjectDistance(createTooFarLandmarks())).toBe('too-far');
  });

  it('returns ok at exact boundary (torso height = 0.10)', () => {
    const lm = createBaseLandmarks();
    setLandmark(lm, 11, 0.48, 0.45);
    setLandmark(lm, 12, 0.52, 0.45);
    setLandmark(lm, 23, 0.49, 0.55);
    setLandmark(lm, 24, 0.51, 0.55);
    expect(detectSubjectDistance(lm)).toBe('ok');
  });

  it('returns too-far just below boundary (torso height = 0.09)', () => {
    const lm = createBaseLandmarks();
    setLandmark(lm, 11, 0.48, 0.455);
    setLandmark(lm, 12, 0.52, 0.455);
    setLandmark(lm, 23, 0.49, 0.545);
    setLandmark(lm, 24, 0.51, 0.545);
    expect(detectSubjectDistance(lm)).toBe('too-far');
  });

  it('returns ok for empty landmarks array (fail-open)', () => {
    expect(detectSubjectDistance([])).toBe('ok');
  });

  it('returns ok for fewer than 33 landmarks (fail-open)', () => {
    const partial = createBaseLandmarks().slice(0, 20);
    expect(detectSubjectDistance(partial)).toBe('ok');
  });

  it('returns ok for undefined landmarks (fail-open)', () => {
    expect(detectSubjectDistance(undefined as unknown as NormalizedLandmark[])).toBe('ok');
  });

  it('returns ok when shoulder landmarks have low visibility', () => {
    const lm = createTooFarLandmarks();
    setLandmark(lm, 11, 0.48, 0.45, 0, 0.05);
    setLandmark(lm, 12, 0.52, 0.45, 0, 0.05);
    expect(detectSubjectDistance(lm)).toBe('ok');
  });

  it('returns ok when hip landmarks have low visibility', () => {
    const lm = createTooFarLandmarks();
    setLandmark(lm, 23, 0.49, 0.52, 0, 0.05);
    setLandmark(lm, 24, 0.51, 0.52, 0, 0.05);
    expect(detectSubjectDistance(lm)).toBe('ok');
  });

  it('handles missing visibility gracefully (undefined = valid)', () => {
    const lm = createOkDistanceLandmarks();
    lm[11] = { x: 0.45, y: 0.25, z: 0 } as NormalizedLandmark;
    expect(detectSubjectDistance(lm)).toBe('ok');
  });
});
