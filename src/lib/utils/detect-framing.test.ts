import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { detectFraming } from './detect-framing';

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

function createWellFramedLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.45, 0.25);
  setLandmark(lm, 12, 0.55, 0.25);
  setLandmark(lm, 23, 0.46, 0.50);
  setLandmark(lm, 24, 0.54, 0.50);
  return lm;
}

function createCutLeftLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.03, 0.25);
  setLandmark(lm, 12, 0.13, 0.25);
  setLandmark(lm, 23, 0.04, 0.50);
  setLandmark(lm, 24, 0.14, 0.50);
  return lm;
}

function createCutRightLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.87, 0.25);
  setLandmark(lm, 12, 0.97, 0.25);
  setLandmark(lm, 23, 0.86, 0.50);
  setLandmark(lm, 24, 0.96, 0.50);
  return lm;
}

function createBothSidesCutLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.02, 0.25);
  setLandmark(lm, 12, 0.98, 0.25);
  setLandmark(lm, 23, 0.03, 0.50);
  setLandmark(lm, 24, 0.97, 0.50);
  return lm;
}

describe('detectFraming', () => {
  it('returns ok when all landmarks are well within frame', () => {
    expect(detectFraming(createWellFramedLandmarks())).toBe('ok');
  });

  it('returns cut-left when a landmark x < 0.05', () => {
    expect(detectFraming(createCutLeftLandmarks())).toBe('cut-left');
  });

  it('returns cut-right when a landmark x > 0.95', () => {
    expect(detectFraming(createCutRightLandmarks())).toBe('cut-right');
  });

  it('returns ok when both sides are cut off (ambiguous)', () => {
    expect(detectFraming(createBothSidesCutLandmarks())).toBe('ok');
  });

  it('returns ok at exact left boundary (x = 0.05 is NOT cut)', () => {
    const lm = createWellFramedLandmarks();
    setLandmark(lm, 11, 0.05, 0.25);
    expect(detectFraming(lm)).toBe('ok');
  });

  it('returns cut-left just inside left boundary (x = 0.04)', () => {
    const lm = createWellFramedLandmarks();
    setLandmark(lm, 11, 0.04, 0.25);
    expect(detectFraming(lm)).toBe('cut-left');
  });

  it('returns ok at exact right boundary (x = 0.95 is NOT cut)', () => {
    const lm = createWellFramedLandmarks();
    setLandmark(lm, 12, 0.95, 0.25);
    expect(detectFraming(lm)).toBe('ok');
  });

  it('returns cut-right just inside right boundary (x = 0.96)', () => {
    const lm = createWellFramedLandmarks();
    setLandmark(lm, 12, 0.96, 0.25);
    expect(detectFraming(lm)).toBe('cut-right');
  });

  it('detects cut-left from hip landmark', () => {
    const lm = createWellFramedLandmarks();
    setLandmark(lm, 23, 0.03, 0.50);
    expect(detectFraming(lm)).toBe('cut-left');
  });

  it('detects cut-right from hip landmark', () => {
    const lm = createWellFramedLandmarks();
    setLandmark(lm, 24, 0.96, 0.50);
    expect(detectFraming(lm)).toBe('cut-right');
  });

  it('returns ok for empty landmarks array (fail-open)', () => {
    expect(detectFraming([])).toBe('ok');
  });

  it('returns ok for fewer than 33 landmarks (fail-open)', () => {
    const partial = createBaseLandmarks().slice(0, 20);
    expect(detectFraming(partial)).toBe('ok');
  });

  it('returns ok for undefined landmarks (fail-open)', () => {
    expect(detectFraming(undefined as unknown as NormalizedLandmark[])).toBe('ok');
  });

  it('returns ok when landmarks have low visibility', () => {
    const lm = createCutLeftLandmarks();
    setLandmark(lm, 11, 0.03, 0.25, 0, 0.05);
    setLandmark(lm, 12, 0.13, 0.25, 0, 0.05);
    setLandmark(lm, 23, 0.04, 0.50, 0, 0.05);
    setLandmark(lm, 24, 0.14, 0.50, 0, 0.05);
    expect(detectFraming(lm)).toBe('ok');
  });
});
