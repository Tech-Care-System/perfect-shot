import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { POSES_BY_SCENE } from '@/data/poses';
import { SCENE_SAMPLE_INTERVAL_MS } from '@/constants/app.constants';
import {
  currentPoseAtom,
  poseResultAtom,
  selectedSceneAtom,
  selectPoseAtom,
} from '@/lib/stores/pose-store';
import { renderHook, act } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useSceneDetection } from './use-scene-detection';

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

function createSeatedLandmarks(): NormalizedLandmark[] {
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

function burnFirstDetection(store: ReturnType<typeof createStore>) {
  act(() => {
    store.set(poseResultAtom, makePoseResult(createStandingLandmarks()));
  });
}

describe('useSceneDetection', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it('triggers scene change after 3 consistent samples', () => {
    store.set(selectPoseAtom, POSES_BY_SCENE['standing'][0]);

    renderHook(() => useSceneDetection(), {
      wrapper: createWrapper(store),
    });

    burnFirstDetection(store);

    const seatedResult = makePoseResult(createSeatedLandmarks());

    for (let i = 0; i < 3; i++) {
      mockNow += SCENE_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...seatedResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(selectedSceneAtom)).toBe('solo-chair');
  });

  it('does not change scene with fewer than 3 consistent samples', () => {
    store.set(selectPoseAtom, POSES_BY_SCENE['standing'][0]);

    renderHook(() => useSceneDetection(), {
      wrapper: createWrapper(store),
    });

    burnFirstDetection(store);

    const seatedResult = makePoseResult(createSeatedLandmarks());

    for (let i = 0; i < 2; i++) {
      mockNow += SCENE_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...seatedResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(selectedSceneAtom)).toBe('standing');
  });

  it('triggers immediately on first valid detection (bypasses throttle)', () => {
    store.set(selectPoseAtom, POSES_BY_SCENE['standing'][0]);

    renderHook(() => useSceneDetection(), {
      wrapper: createWrapper(store),
    });

    const seatedResult = makePoseResult(createSeatedLandmarks());

    act(() => {
      store.set(poseResultAtom, seatedResult);
    });

    expect(store.get(selectedSceneAtom)).toBe('solo-chair');
  });

  it('does not change scene when landmarks are lost', () => {
    store.set(selectPoseAtom, POSES_BY_SCENE['standing'][0]);

    renderHook(() => useSceneDetection(), {
      wrapper: createWrapper(store),
    });

    burnFirstDetection(store);

    const emptyResult: PoseLandmarkerResult = {
      landmarks: [],
      worldLandmarks: [],
      segmentationMasks: [],
      close: () => {},
    };

    mockNow += SCENE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, emptyResult);
    });

    expect(store.get(selectedSceneAtom)).toBe('standing');
  });

  it('respects throttle interval between samples', () => {
    store.set(selectPoseAtom, POSES_BY_SCENE['standing'][0]);

    renderHook(() => useSceneDetection(), {
      wrapper: createWrapper(store),
    });

    burnFirstDetection(store);

    const seatedResult = makePoseResult(createSeatedLandmarks());

    mockNow += 500;
    act(() => {
      store.set(poseResultAtom, ({ ...seatedResult } as PoseLandmarkerResult));
    });
    mockNow += 500;
    act(() => {
      store.set(poseResultAtom, ({ ...seatedResult } as PoseLandmarkerResult));
    });
    mockNow += 500;
    act(() => {
      store.set(poseResultAtom, ({ ...seatedResult } as PoseLandmarkerResult));
    });

    expect(store.get(selectedSceneAtom)).toBe('standing');
  });

  it('resets debounce buffer when scene classification is inconsistent', () => {
    store.set(selectPoseAtom, POSES_BY_SCENE['standing'][0]);

    renderHook(() => useSceneDetection(), {
      wrapper: createWrapper(store),
    });

    burnFirstDetection(store);

    const seatedResult = makePoseResult(createSeatedLandmarks());
    const standingResult = makePoseResult(createStandingLandmarks());

    mockNow += SCENE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...seatedResult } as PoseLandmarkerResult));
    });
    mockNow += SCENE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...seatedResult } as PoseLandmarkerResult));
    });
    mockNow += SCENE_SAMPLE_INTERVAL_MS;
    act(() => {
      store.set(poseResultAtom, ({ ...standingResult } as PoseLandmarkerResult));
    });

    expect(store.get(selectedSceneAtom)).toBe('standing');
  });

  it('does not trigger scene change when detected scene matches current', () => {
    store.set(selectPoseAtom, POSES_BY_SCENE['standing'][0]);

    renderHook(() => useSceneDetection(), {
      wrapper: createWrapper(store),
    });

    burnFirstDetection(store);

    const standingResult = makePoseResult(createStandingLandmarks());

    for (let i = 0; i < 3; i++) {
      mockNow += SCENE_SAMPLE_INTERVAL_MS;
      act(() => {
        store.set(poseResultAtom, ({ ...standingResult } as PoseLandmarkerResult));
      });
    }

    expect(store.get(selectedSceneAtom)).toBe('standing');
    expect(store.get(currentPoseAtom)).toBe(POSES_BY_SCENE['standing'][0]);
  });
});
