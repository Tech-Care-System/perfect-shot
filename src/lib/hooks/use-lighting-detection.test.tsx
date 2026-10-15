import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LIGHTING_SAMPLE_INTERVAL_MS } from '@/constants/app.constants';
import {
  lightingPoorAtom,
  poseResultAtom,
} from '@/lib/stores/pose-store';
import { renderHook, act } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useLightingDetection } from './use-lighting-detection';

const KEY_INDICES = [11, 12, 13, 14, 23, 24, 25, 26];

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

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

function makePoseResult(landmarks: NormalizedLandmark[]): PoseLandmarkerResult {
  return {
    landmarks: [landmarks],
    worldLandmarks: [],
    segmentationMasks: [],
    close: () => {},
  };
}

const originalPerformanceNow = performance.now;
let mockNow = 0;

beforeEach(() => {
  mockNow = 0;
  performance.now = () => mockNow;
});

afterEach(() => {
  performance.now = originalPerformanceNow;
});

describe('useLightingDetection', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('sets lightingPoorAtom to true after 3 consecutive poor readings', () => {
    renderHook(() => useLightingDetection(), {
      wrapper: createWrapper(store),
    });

    const poorResult = makePoseResult(createPoorLightingLandmarks());

    for (let i = 0; i < 3; i++) {
      mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(lightingPoorAtom)).toBe(true);
  });

  it('does not set lightingPoorAtom after only 2 poor readings', () => {
    renderHook(() => useLightingDetection(), {
      wrapper: createWrapper(store),
    });

    const poorResult = makePoseResult(createPoorLightingLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(lightingPoorAtom)).toBe(false);
  });

  it('clears lightingPoorAtom immediately on a single ok reading', () => {
    renderHook(() => useLightingDetection(), {
      wrapper: createWrapper(store),
    });

    const poorResult = makePoseResult(createPoorLightingLandmarks());

    for (let i = 0; i < 3; i++) {
      mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(lightingPoorAtom)).toBe(true);

    mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createGoodLightingLandmarks()));
    });

    expect(store.get(lightingPoorAtom)).toBe(false);
  });

  it('respects throttle interval between samples', () => {
    renderHook(() => useLightingDetection(), {
      wrapper: createWrapper(store),
    });

    const poorResult = makePoseResult(createPoorLightingLandmarks());

    mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
    });

    mockNow += 100;
    act(() => {
      store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
    });

    mockNow += 100;
    act(() => {
      store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
    });

    expect(store.get(lightingPoorAtom)).toBe(false);
  });

  it('resets debounce buffer on ok reading', () => {
    renderHook(() => useLightingDetection(), {
      wrapper: createWrapper(store),
    });

    const poorResult = makePoseResult(createPoorLightingLandmarks());
    const okResult = makePoseResult(createGoodLightingLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
      });
    }

    mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...okResult } as PoseLandmarkerResult));
    });

    mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
    });

    expect(store.get(lightingPoorAtom)).toBe(false);
  });

  it('keeps lightingPoorAtom true when landmarks are lost after being set', () => {
    renderHook(() => useLightingDetection(), {
      wrapper: createWrapper(store),
    });

    const poorResult = makePoseResult(createPoorLightingLandmarks());

    for (let i = 0; i < 3; i++) {
      mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...poorResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(lightingPoorAtom)).toBe(true);

    const emptyResult: PoseLandmarkerResult = {
      landmarks: [],
      worldLandmarks: [],
      segmentationMasks: [],
      close: () => {},
    };

    mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, emptyResult);
    });

    expect(store.get(lightingPoorAtom)).toBe(true);
  });

  it('does not change atom when landmarks are lost', () => {
    renderHook(() => useLightingDetection(), {
      wrapper: createWrapper(store),
    });

    const emptyResult: PoseLandmarkerResult = {
      landmarks: [],
      worldLandmarks: [],
      segmentationMasks: [],
      close: () => {},
    };

    mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, emptyResult);
    });

    expect(store.get(lightingPoorAtom)).toBe(false);
  });

  it('keeps lightingPoorAtom false with good lighting readings', () => {
    renderHook(() => useLightingDetection(), {
      wrapper: createWrapper(store),
    });

    const okResult = makePoseResult(createGoodLightingLandmarks());

    for (let i = 0; i < 5; i++) {
      mockNow += LIGHTING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...okResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(lightingPoorAtom)).toBe(false);
  });
});
