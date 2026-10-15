import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { DISTANCE_SAMPLE_INTERVAL_MS } from '@/constants/app.constants';
import {
  poseResultAtom,
  subjectTooFarAtom,
} from '@/lib/stores/pose-store';
import { renderHook, act } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useDistanceDetection } from './use-distance-detection';

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
    visibility: 0.9,
  }));
}

function setLandmark(
  landmarks: NormalizedLandmark[],
  index: number,
  x: number,
  y: number,
) {
  landmarks[index] = { x, y, z: 0, visibility: 0.9 };
}

function createOkLandmarks(): NormalizedLandmark[] {
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

function createTooFarLandmarks(): NormalizedLandmark[] {
  const lm = createBaseLandmarks();
  setLandmark(lm, 11, 0.48, 0.45);
  setLandmark(lm, 12, 0.52, 0.45);
  setLandmark(lm, 23, 0.49, 0.52);
  setLandmark(lm, 24, 0.51, 0.52);
  setLandmark(lm, 25, 0.49, 0.58);
  setLandmark(lm, 26, 0.51, 0.58);
  setLandmark(lm, 27, 0.49, 0.63);
  setLandmark(lm, 28, 0.51, 0.63);
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

describe('useDistanceDetection', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('sets subjectTooFarAtom to true after 2 consecutive too-far readings', () => {
    renderHook(() => useDistanceDetection(), {
      wrapper: createWrapper(store),
    });

    const tooFarResult = makePoseResult(createTooFarLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...tooFarResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectTooFarAtom)).toBe(true);
  });

  it('does not set subjectTooFarAtom after only 1 too-far reading', () => {
    renderHook(() => useDistanceDetection(), {
      wrapper: createWrapper(store),
    });

    mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createTooFarLandmarks()));
    });

    expect(store.get(subjectTooFarAtom)).toBe(false);
  });

  it('clears subjectTooFarAtom immediately on a single ok reading', () => {
    renderHook(() => useDistanceDetection(), {
      wrapper: createWrapper(store),
    });

    const tooFarResult = makePoseResult(createTooFarLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...tooFarResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectTooFarAtom)).toBe(true);

    mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createOkLandmarks()));
    });

    expect(store.get(subjectTooFarAtom)).toBe(false);
  });

  it('respects throttle interval between samples', () => {
    renderHook(() => useDistanceDetection(), {
      wrapper: createWrapper(store),
    });

    const tooFarResult = makePoseResult(createTooFarLandmarks());

    mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...tooFarResult } as PoseLandmarkerResult));
    });

    mockNow += 100;
    act(() => {
      store.set(poseResultAtom, ({ ...tooFarResult } as PoseLandmarkerResult));
    });

    expect(store.get(subjectTooFarAtom)).toBe(false);
  });

  it('resets debounce buffer on ok reading', () => {
    renderHook(() => useDistanceDetection(), {
      wrapper: createWrapper(store),
    });

    const tooFarResult = makePoseResult(createTooFarLandmarks());
    const okResult = makePoseResult(createOkLandmarks());

    mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...tooFarResult } as PoseLandmarkerResult));
    });

    mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...okResult } as PoseLandmarkerResult));
    });

    mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...tooFarResult } as PoseLandmarkerResult));
    });

    expect(store.get(subjectTooFarAtom)).toBe(false);
  });

  it('does not change atom when landmarks are lost', () => {
    renderHook(() => useDistanceDetection(), {
      wrapper: createWrapper(store),
    });

    const emptyResult: PoseLandmarkerResult = {
      landmarks: [],
      worldLandmarks: [],
      segmentationMasks: [],
      close: () => {},
    };

    mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, emptyResult);
    });

    expect(store.get(subjectTooFarAtom)).toBe(false);
  });

  it('keeps subjectTooFarAtom false with ok distance readings', () => {
    renderHook(() => useDistanceDetection(), {
      wrapper: createWrapper(store),
    });

    const okResult = makePoseResult(createOkLandmarks());

    for (let i = 0; i < 5; i++) {
      mockNow += DISTANCE_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...okResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectTooFarAtom)).toBe(false);
  });
});
