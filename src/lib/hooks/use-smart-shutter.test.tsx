import { SMART_SHUTTER_HOLD_MS } from '@/constants/app.constants';
import {
  capturedPhotoAtom,
  cameraFacingModeAtom,
  videoElementAtom,
} from '@/lib/stores/camera-store';
import {
  detectionLostAtom,
  poseScoreAtom,
} from '@/lib/stores/pose-store';
import { capturePhoto } from '@/lib/utils/capture-photo';
import { renderHook, act } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import type { ReactNode } from 'react';
import { useSmartShutter } from './use-smart-shutter';

jest.mock('@/lib/utils/capture-photo', () => ({
  capturePhoto: jest.fn().mockReturnValue('data:image/jpeg;base64,mock'),
}));

jest.mock('@/lib/utils/audio-feedback', () => ({
  playDing: jest.fn(),
}));

jest.mock('@/lib/utils/haptic-feedback', () => ({
  triggerHaptic: jest.fn(),
}));

import { playDing } from '@/lib/utils/audio-feedback';
import { triggerHaptic } from '@/lib/utils/haptic-feedback';

const mockCapturePhoto = capturePhoto as jest.MockedFunction<typeof capturePhoto>;
const mockPlayDing = playDing as jest.MockedFunction<typeof playDing>;
const mockTriggerHaptic = triggerHaptic as jest.MockedFunction<typeof triggerHaptic>;

function createWrapper(store: ReturnType<typeof createStore>) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

function mockVideoElement(): HTMLVideoElement {
  return { videoWidth: 1920, videoHeight: 1080 } as HTMLVideoElement;
}

describe('useSmartShutter', () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    jest.useFakeTimers();
    store = createStore();
    mockCapturePhoto.mockClear();
    mockPlayDing.mockClear();
    mockTriggerHaptic.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('triggers capture after score >= 0.90 held for 500ms', () => {
    const video = mockVideoElement();
    store.set(videoElementAtom, video);
    store.set(cameraFacingModeAtom, 'environment');

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });

    act(() => {
      jest.advanceTimersByTime(SMART_SHUTTER_HOLD_MS);
    });

    expect(mockCapturePhoto).toHaveBeenCalledWith(video, false);
    expect(store.get(capturedPhotoAtom)).toBe('data:image/jpeg;base64,mock');
  });

  it('resets timer when score drops below threshold before 500ms', () => {
    const video = mockVideoElement();
    store.set(videoElementAtom, video);

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    act(() => {
      jest.advanceTimersByTime(400);
    });

    act(() => {
      store.set(poseScoreAtom, 0.5);
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(mockCapturePhoto).not.toHaveBeenCalled();
    expect(store.get(capturedPhotoAtom)).toBeNull();
  });

  it('does not start timer when detectionLost is true', () => {
    const video = mockVideoElement();
    store.set(videoElementAtom, video);
    store.set(detectionLostAtom, true);

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    act(() => {
      jest.advanceTimersByTime(SMART_SHUTTER_HOLD_MS);
    });

    expect(mockCapturePhoto).not.toHaveBeenCalled();
  });

  it('does not start timer when capturedPhoto is already set', () => {
    const video = mockVideoElement();
    store.set(videoElementAtom, video);
    store.set(capturedPhotoAtom, 'data:image/jpeg;base64,existing');

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    act(() => {
      jest.advanceTimersByTime(SMART_SHUTTER_HOLD_MS);
    });

    expect(mockCapturePhoto).not.toHaveBeenCalled();
  });

  it('passes isMirrored=true when facingMode is user', () => {
    const video = mockVideoElement();
    store.set(videoElementAtom, video);
    store.set(cameraFacingModeAtom, 'user');

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    act(() => {
      jest.advanceTimersByTime(SMART_SHUTTER_HOLD_MS);
    });

    expect(mockCapturePhoto).toHaveBeenCalledWith(video, true);
  });

  it('passes isMirrored=false when facingMode is environment', () => {
    const video = mockVideoElement();
    store.set(videoElementAtom, video);
    store.set(cameraFacingModeAtom, 'environment');

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    act(() => {
      jest.advanceTimersByTime(SMART_SHUTTER_HOLD_MS);
    });

    expect(mockCapturePhoto).toHaveBeenCalledWith(video, false);
  });

  it('clears timer on unmount', () => {
    const video = mockVideoElement();
    store.set(videoElementAtom, video);

    const { unmount } = renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(SMART_SHUTTER_HOLD_MS);
    });

    expect(mockCapturePhoto).not.toHaveBeenCalled();
  });

  it('does not capture when videoElement is null', () => {
    store.set(videoElementAtom, null);

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    act(() => {
      jest.advanceTimersByTime(SMART_SHUTTER_HOLD_MS);
    });

    expect(mockCapturePhoto).not.toHaveBeenCalled();
    expect(store.get(capturedPhotoAtom)).toBeNull();
  });

  it('plays ding once when score crosses threshold', () => {
    store.set(videoElementAtom, mockVideoElement());

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });

    expect(mockPlayDing).toHaveBeenCalledTimes(1);
  });

  it('does not replay ding while score stays above threshold', () => {
    store.set(videoElementAtom, mockVideoElement());

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    act(() => {
      store.set(poseScoreAtom, 0.99);
    });

    expect(mockPlayDing).toHaveBeenCalledTimes(1);
  });

  it('replays ding when score drops and crosses threshold again', () => {
    store.set(videoElementAtom, mockVideoElement());

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });

    expect(mockPlayDing).toHaveBeenCalledTimes(1);

    act(() => {
      store.set(poseScoreAtom, 0.5);
    });

    act(() => {
      store.set(poseScoreAtom, 0.93);
    });

    expect(mockPlayDing).toHaveBeenCalledTimes(2);
  });

  it('does not play ding when detectionLost is true', () => {
    store.set(videoElementAtom, mockVideoElement());
    store.set(detectionLostAtom, true);

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    expect(mockPlayDing).not.toHaveBeenCalled();
  });

  it('does not play ding when capturedPhoto is already set', () => {
    store.set(videoElementAtom, mockVideoElement());
    store.set(capturedPhotoAtom, 'data:image/jpeg;base64,existing');

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    expect(mockPlayDing).not.toHaveBeenCalled();
  });

  it('triggers ding and haptic simultaneously on threshold crossing', () => {
    store.set(videoElementAtom, mockVideoElement());

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });

    expect(mockPlayDing).toHaveBeenCalledTimes(1);
    expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);
    expect(mockTriggerHaptic).toHaveBeenCalledWith('short');
  });

  it('triggers haptic once when score crosses threshold', () => {
    store.set(videoElementAtom, mockVideoElement());

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });

    expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);
    expect(mockTriggerHaptic).toHaveBeenCalledWith('short');
  });

  it('does not replay haptic while score stays above threshold', () => {
    store.set(videoElementAtom, mockVideoElement());

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    act(() => {
      store.set(poseScoreAtom, 0.99);
    });

    expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);
  });

  it('replays haptic when score drops and crosses threshold again', () => {
    store.set(videoElementAtom, mockVideoElement());

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.92);
    });

    expect(mockTriggerHaptic).toHaveBeenCalledTimes(1);

    act(() => {
      store.set(poseScoreAtom, 0.5);
    });

    act(() => {
      store.set(poseScoreAtom, 0.93);
    });

    expect(mockTriggerHaptic).toHaveBeenCalledTimes(2);
  });

  it('does not trigger haptic when detectionLost is true', () => {
    store.set(videoElementAtom, mockVideoElement());
    store.set(detectionLostAtom, true);

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    expect(mockTriggerHaptic).not.toHaveBeenCalled();
  });

  it('does not trigger haptic when capturedPhoto is already set', () => {
    store.set(videoElementAtom, mockVideoElement());
    store.set(capturedPhotoAtom, 'data:image/jpeg;base64,existing');

    renderHook(() => useSmartShutter(), {
      wrapper: createWrapper(store),
    });

    act(() => {
      store.set(poseScoreAtom, 0.95);
    });

    expect(mockTriggerHaptic).not.toHaveBeenCalled();
  });
});
