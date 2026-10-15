import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { detectLighting } from './detect-lighting';

const KEY_INDICES = [11, 12, 13, 14, 23, 24, 25, 26];

function createBaseLandmarks(): NormalizedLandmark[] {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.85,
  }));
}

function createPoorLightingLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  const poorValues = [0.3, 0.4, 0.35, 0.3, 0.4, 0.35, 0.3, 0.4];
  for (let i = 0; i < KEY_INDICES.length; i++) {
    lm[KEY_INDICES[i]] = { x: 0.5, y: 0.5, z: 0, visibility: poorValues[i] };
  }
  return lm;
}

function createGoodLightingLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  const goodValues = [0.9, 0.85, 0.8, 0.9, 0.85, 0.8, 0.9, 0.85];
  for (let i = 0; i < KEY_INDICES.length; i++) {
    lm[KEY_INDICES[i]] = { x: 0.5, y: 0.5, z: 0, visibility: goodValues[i] };
  }
  return lm;
}

describe('detectLighting', () => {
  it('returns ok for good lighting (average visibility >= 0.5)', () => {
    expect(detectLighting(createGoodLightingLandmarks())).toBe('ok');
  });

  it('returns poor for poor lighting (average visibility < 0.5)', () => {
    expect(detectLighting(createPoorLightingLandmarks())).toBe('poor');
  });

  it('returns ok at exact boundary (average visibility = 0.5)', () => {
    const lm = createBaseLandmarks();
    for (const idx of KEY_INDICES) {
      lm[idx] = { x: 0.5, y: 0.5, z: 0, visibility: 0.5 };
    }
    expect(detectLighting(lm)).toBe('ok');
  });

  it('returns poor just below boundary (average visibility = 0.49)', () => {
    const lm = createBaseLandmarks();
    for (const idx of KEY_INDICES) {
      lm[idx] = { x: 0.5, y: 0.5, z: 0, visibility: 0.49 };
    }
    expect(detectLighting(lm)).toBe('poor');
  });

  it('returns ok when fewer than 4 landmarks have defined visibility (fail-open)', () => {
    const lm = createBaseLandmarks();
    for (const idx of KEY_INDICES) {
      lm[idx] = { x: 0.5, y: 0.5, z: 0 } as NormalizedLandmark;
    }
    lm[KEY_INDICES[0]] = { x: 0.5, y: 0.5, z: 0, visibility: 0.3 };
    lm[KEY_INDICES[1]] = { x: 0.5, y: 0.5, z: 0, visibility: 0.3 };
    lm[KEY_INDICES[2]] = { x: 0.5, y: 0.5, z: 0, visibility: 0.3 };
    expect(detectLighting(lm)).toBe('ok');
  });

  it('returns ok when all visibility values are undefined (fail-open)', () => {
    const lm = createBaseLandmarks();
    for (const idx of KEY_INDICES) {
      lm[idx] = { x: 0.5, y: 0.5, z: 0 } as NormalizedLandmark;
    }
    expect(detectLighting(lm)).toBe('ok');
  });

  it('returns ok for empty landmarks array (fail-open)', () => {
    expect(detectLighting([])).toBe('ok');
  });

  it('returns ok for fewer than 33 landmarks (fail-open)', () => {
    const partial = createBaseLandmarks().slice(0, 20);
    expect(detectLighting(partial)).toBe('ok');
  });

  it('returns ok for undefined landmarks (fail-open)', () => {
    expect(detectLighting(undefined as unknown as NormalizedLandmark[])).toBe('ok');
  });

  it('handles mixed defined and undefined visibility values', () => {
    const lm = createBaseLandmarks();
    lm[KEY_INDICES[0]] = { x: 0.5, y: 0.5, z: 0, visibility: 0.3 };
    lm[KEY_INDICES[1]] = { x: 0.5, y: 0.5, z: 0, visibility: 0.35 };
    lm[KEY_INDICES[2]] = { x: 0.5, y: 0.5, z: 0 } as NormalizedLandmark;
    lm[KEY_INDICES[3]] = { x: 0.5, y: 0.5, z: 0, visibility: 0.4 };
    lm[KEY_INDICES[4]] = { x: 0.5, y: 0.5, z: 0, visibility: 0.35 };
    lm[KEY_INDICES[5]] = { x: 0.5, y: 0.5, z: 0 } as NormalizedLandmark;
    lm[KEY_INDICES[6]] = { x: 0.5, y: 0.5, z: 0 } as NormalizedLandmark;
    lm[KEY_INDICES[7]] = { x: 0.5, y: 0.5, z: 0 } as NormalizedLandmark;
    expect(detectLighting(lm)).toBe('poor');
  });

  it('uses only the 8 key landmarks for detection', () => {
    const lm = createBaseLandmarks();
    for (const idx of KEY_INDICES) {
      lm[idx] = { x: 0.5, y: 0.5, z: 0, visibility: 0.3 };
    }
    for (let i = 0; i < 33; i++) {
      if (!KEY_INDICES.includes(i)) {
        lm[i] = { x: 0.5, y: 0.5, z: 0, visibility: 0.99 };
      }
    }
    expect(detectLighting(lm)).toBe('poor');
  });
});
