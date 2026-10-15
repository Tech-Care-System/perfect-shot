import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FRAMING_SAMPLE_INTERVAL_MS } from '@/constants/app.constants';
import {
  poseResultAtom,
  subjectFramingAtom,
} from '@/lib/stores/pose-store';
import { cameraFacingModeAtom } from '@/lib/stores/camera-store';
import { renderHook, act } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useFramingDetection } from './use-framing-detection';

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

describe('useFramingDetection', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('sets framing message after 2 consecutive cut-left readings (back camera)', () => {
    store.set(cameraFacingModeAtom, 'environment');

    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const cutLeftResult = makePoseResult(createCutLeftLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += FRAMING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...cutLeftResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectFramingAtom)).toBe('Move right to fit in frame');
  });

  it('sets framing message after 2 consecutive cut-right readings (back camera)', () => {
    store.set(cameraFacingModeAtom, 'environment');

    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const cutRightResult = makePoseResult(createCutRightLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += FRAMING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...cutRightResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectFramingAtom)).toBe('Move left to fit in frame');
  });

  it('mirrors direction for front camera (cut-left → Move left)', () => {
    store.set(cameraFacingModeAtom, 'user');

    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const cutLeftResult = makePoseResult(createCutLeftLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += FRAMING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...cutLeftResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectFramingAtom)).toBe('Move left to fit in frame');
  });

  it('mirrors direction for front camera (cut-right → Move right)', () => {
    store.set(cameraFacingModeAtom, 'user');

    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const cutRightResult = makePoseResult(createCutRightLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += FRAMING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...cutRightResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectFramingAtom)).toBe('Move right to fit in frame');
  });

  it('does not set framing after only 1 reading', () => {
    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    mockNow += FRAMING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createCutLeftLandmarks()));
    });

    expect(store.get(subjectFramingAtom)).toBeNull();
  });

  it('clears framing immediately on a single ok reading', () => {
    store.set(cameraFacingModeAtom, 'environment');

    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const cutLeftResult = makePoseResult(createCutLeftLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += FRAMING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...cutLeftResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectFramingAtom)).toBe('Move right to fit in frame');

    mockNow += FRAMING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createOkLandmarks()));
    });

    expect(store.get(subjectFramingAtom)).toBeNull();
  });

  it('resets debounce counter when direction changes', () => {
    store.set(cameraFacingModeAtom, 'environment');

    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    mockNow += FRAMING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createCutLeftLandmarks()));
    });

    mockNow += FRAMING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createCutRightLandmarks()));
    });

    expect(store.get(subjectFramingAtom)).toBeNull();
  });

  it('respects throttle interval between samples', () => {
    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const cutLeftResult = makePoseResult(createCutLeftLandmarks());

    mockNow += FRAMING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...cutLeftResult } as PoseLandmarkerResult));
    });

    mockNow += 100;
    act(() => {
      store.set(poseResultAtom, ({ ...cutLeftResult } as PoseLandmarkerResult));
    });

    expect(store.get(subjectFramingAtom)).toBeNull();
  });

  it('does not change atom when landmarks are lost', () => {
    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const emptyResult: PoseLandmarkerResult = {
      landmarks: [],
      worldLandmarks: [],
      segmentationMasks: [],
      close: () => {},
    };

    mockNow += FRAMING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, emptyResult);
    });

    expect(store.get(subjectFramingAtom)).toBeNull();
  });

  it('keeps old message during direction change and updates after debounce', () => {
    store.set(cameraFacingModeAtom, 'environment');

    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const cutLeftResult = makePoseResult(createCutLeftLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += FRAMING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...cutLeftResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectFramingAtom)).toBe('Move right to fit in frame');

    mockNow += FRAMING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createCutRightLandmarks()));
    });

    expect(store.get(subjectFramingAtom)).toBe('Move right to fit in frame');

    mockNow += FRAMING_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, makePoseResult(createCutRightLandmarks()));
    });

    expect(store.get(subjectFramingAtom)).toBe('Move left to fit in frame');
  });

  it('updates message direction immediately when camera flips', () => {
    store.set(cameraFacingModeAtom, 'environment');

    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const cutLeftResult = makePoseResult(createCutLeftLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += FRAMING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...cutLeftResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectFramingAtom)).toBe('Move right to fit in frame');

    act(() => {
      store.set(cameraFacingModeAtom, 'user');
    });

    expect(store.get(subjectFramingAtom)).toBe('Move left to fit in frame');
  });

  it('keeps framing null with ok readings', () => {
    renderHook(() => useFramingDetection(), {
      wrapper: createWrapper(store),
    });

    const okResult = makePoseResult(createOkLandmarks());

    for (let i = 0; i < 5; i++) {
      mockNow += FRAMING_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...okResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(subjectFramingAtom)).toBeNull();
  });
});
