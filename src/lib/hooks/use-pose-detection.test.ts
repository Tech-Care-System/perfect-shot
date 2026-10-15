import {
    detectionErrorAtom,
    detectionLostAtom,
    poseFpsAtom,
    poseResultAtom,
} from '@/lib/stores/pose-store';
import type { AIWorkerResponse } from '@/lib/ai/worker.types';
import { liteModeAtom } from '@/lib/stores/settings-store';
import { act, renderHook } from '@testing-library/react';
import { getDefaultStore } from 'jotai';
import { useAIWorker } from './use-ai-worker';
import { usePoseDetection } from './use-pose-detection';

jest.mock('./use-ai-worker');

// Mock requestAnimationFrame and cancelAnimationFrame at the top level for JSDOM
const mockRaf = jest.fn((cb) => {
  return setTimeout(() => (cb as (time: number) => void)(Date.now()), 16) as unknown as number;
});
const mockCaf = jest.fn((id) => {
  clearTimeout(id as unknown as NodeJS.Timeout);
});

Object.defineProperty(window, 'requestAnimationFrame', {
  value: mockRaf,
  configurable: true,
  writable: true,
});
Object.defineProperty(window, 'cancelAnimationFrame', {
  value: mockCaf,
  configurable: true,
  writable: true,
});

describe('usePoseDetection', () => {
  const mockPostMessage = jest.fn(() => true);
  const mockRestartWorker = jest.fn();
  const mockStore = getDefaultStore();
  let mockBitmapClose: jest.Mock;

  function createReadyVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
    return {
      currentTime: 1.0,
      readyState: 3, // HAVE_FUTURE_DATA
      ...overrides,
    } as unknown as HTMLVideoElement;
  }

  function createEmptyPoseResponse(): Extract<AIWorkerResponse, { type: 'POSE_RESULT' }> {
    return {
      type: 'POSE_RESULT',
      payload: { landmarks: [], worldLandmarks: [], close: () => {} },
    };
  }

  function mockWorkerReturn(overrides: Partial<ReturnType<typeof useAIWorker>> = {}) {
    (useAIWorker as jest.Mock).mockReturnValue({
      postMessage: mockPostMessage,
      workerStatus: 'ready',
      error: null,
      restartWorker: mockRestartWorker,
      ...overrides,
    });
  }

  beforeEach(() => {
    jest.useFakeTimers();
    mockBitmapClose = jest.fn();

    // Mock createImageBitmap (not in JSDOM)
    global.createImageBitmap = jest.fn().mockResolvedValue({
      width: 640,
      height: 480,
      close: mockBitmapClose,
    } as unknown as ImageBitmap);

    mockWorkerReturn();

    // Reset atoms
    mockStore.set(poseResultAtom, null);
    mockStore.set(poseFpsAtom, 0);
    mockStore.set(detectionLostAtom, false);
    mockStore.set(detectionErrorAtom, null);
    mockStore.set(liteModeAtom, false);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  // ── AC1: Loop mechanics ────────────────────────────────────────

  it('starts detection and sends DETECT message when video is ready', async () => {
    const { result } = renderHook(() => usePoseDetection());

    act(() => {
      result.current.startDetection(createReadyVideo());
    });

    // Trigger loop and allow async parts to complete
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'DETECT',
        payload: expect.objectContaining({
          timestamp: expect.any(Number),
        }),
      }),
      expect.any(Array) // Transfer list for ImageBitmap
    );
  });

  it('skips duplicate frames with the same currentTime', async () => {
    const { result } = renderHook(() => usePoseDetection());

    act(() => {
      result.current.startDetection(createReadyVideo());
    });

    // Run multiple frames with same currentTime
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    // Should only have been called once despite multiple loop iterations
    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it('keeps one DETECT in flight and resumes when its result arrives', async () => {
    let onMessage: ((response: AIWorkerResponse) => boolean | void) | null = null;
    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessage = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    const video = createReadyVideo();
    const { result } = renderHook(() => usePoseDetection());
    await act(async () => {
      result.current.startDetection(video);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    (video as { currentTime: number }).currentTime = 2;
    await act(async () => {
      jest.advanceTimersByTime(80);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    const response = createEmptyPoseResponse();
    act(() => onMessage?.(response));
    expect(mockStore.get(poseResultAtom)).toEqual(response.payload);
    (video as { currentTime: number }).currentTime = 3;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);
    expect(mockBitmapClose).not.toHaveBeenCalled();
  });

  it('releases the in-flight gate on an ERROR response', async () => {
    let onMessage: ((response: AIWorkerResponse) => boolean | void) | null = null;
    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessage = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    const video = createReadyVideo();
    const { result } = renderHook(() => usePoseDetection());
    await act(async () => {
      result.current.startDetection(video);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    act(() => {
      expect(onMessage?.({ type: 'ERROR', payload: { error: 'inference failed' } })).toBe(false);
    });
    (video as { currentTime: number }).currentTime = 2;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);
  });

  it('closes a captured ImageBitmap if detection stops before transfer', async () => {
    let resolveBitmap: ((image: ImageBitmap) => void) | null = null;
    const imageBitmap = { width: 640, height: 480, close: mockBitmapClose } as unknown as ImageBitmap;
    global.createImageBitmap = jest.fn(() => new Promise((resolve) => {
      resolveBitmap = resolve;
    }));

    const { result } = renderHook(() => usePoseDetection());
    act(() => {
      result.current.startDetection(createReadyVideo());
      result.current.stopDetection();
    });

    await act(async () => {
      resolveBitmap?.(imageBitmap);
      await Promise.resolve();
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(mockBitmapClose).toHaveBeenCalledTimes(1);
  });

  it('releases the gate on stop and ignores a late result from the stopped frame', async () => {
    let onMessage: ((response: AIWorkerResponse) => boolean | void) | null = null;
    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessage = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    const video = createReadyVideo();
    const { result } = renderHook(() => usePoseDetection());
    await act(async () => {
      result.current.startDetection(video);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    act(() => result.current.stopDetection());
    (video as { currentTime: number }).currentTime = 2;
    await act(async () => {
      result.current.startDetection(video);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(2);

    act(() => onMessage?.(createEmptyPoseResponse()));
    expect(mockStore.get(poseResultAtom)).toBeNull();
    (video as { currentTime: number }).currentTime = 3;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(2);

    const currentResponse = createEmptyPoseResponse();
    act(() => onMessage?.(currentResponse));
    expect(mockStore.get(poseResultAtom)).toEqual(currentResponse.payload);
    (video as { currentTime: number }).currentTime = 4;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(3);
  });

  it('clears the in-flight gate when the worker restarts', async () => {
    let workerStatus: 'ready' | 'loading' = 'ready';
    (useAIWorker as jest.Mock).mockImplementation(() => ({
      postMessage: mockPostMessage,
      workerStatus,
      error: null,
      restartWorker: mockRestartWorker,
    }));

    const video = createReadyVideo();
    const { result, rerender } = renderHook(() => usePoseDetection());
    await act(async () => {
      result.current.startDetection(video);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    act(() => {
      workerStatus = 'loading';
      rerender();
    });
    act(() => {
      workerStatus = 'ready';
      rerender();
    });
    (video as { currentTime: number }).currentTime = 2;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);
  });

  // ── Finding 6: readyState gating ──────────────────────────────

  it('does not start loop when video.readyState < 2', () => {
    const { result } = renderHook(() => usePoseDetection());
    const unreadyVideo = createReadyVideo({ readyState: 1 }); // HAVE_METADATA

    act(() => {
      result.current.startDetection(unreadyVideo);
    });

    // loop() should never have been called
    expect(mockRaf).not.toHaveBeenCalled();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  // ── AC2: Atom updates bypass re-renders ────────────────────────

  it('updates atoms when worker sends responses', () => {
    let onMessageCallback: (msg: { type: string; payload: unknown }) => boolean | void = () => false;

    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessageCallback = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    renderHook(() => usePoseDetection());

    const mockPoseResult = { landmarks: [[]] };
    act(() => {
      const handled = onMessageCallback({ type: 'POSE_RESULT', payload: mockPoseResult });
      expect(handled).toBe(true);
    });

    expect(mockStore.get(poseResultAtom)).toEqual(mockPoseResult);

    act(() => {
      const handled = onMessageCallback({ type: 'FPS_UPDATE', payload: { fps: 30 } });
      expect(handled).toBe(true);
    });

    expect(mockStore.get(poseFpsAtom)).toBe(30);
  });

  it('does not re-render the hook when pose-result atom changes', () => {
    let renderCount = 0;
    let onMessageCallback: (msg: { type: string; payload: unknown }) => boolean | void = () => false;

    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessageCallback = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    renderHook(() => {
      renderCount++;
      return usePoseDetection();
    });

    const initialRenderCount = renderCount;

    // Simulate 5 high-frequency pose results
    act(() => {
      for (let i = 0; i < 5; i++) {
        onMessageCallback({ type: 'POSE_RESULT', payload: { landmarks: [[{ x: i }]] } });
      }
    });

    // The hook should NOT have re-rendered because onMessage returns true,
    // bypassing setLastResponse in useAIWorker
    expect(renderCount).toBe(initialRenderCount);
  });

  // ── Loop start/stop ───────────────────────────────────────────

  it('stops detection and no further messages are sent', async () => {
    const { result } = renderHook(() => usePoseDetection());

    await act(async () => {
      result.current.startDetection(createReadyVideo());
      await Promise.resolve();
    });

    act(() => {
      result.current.stopDetection();
    });

    mockPostMessage.mockClear();

    // Advance time and check that no more messages are sent
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  // ── AC3: Detection-loss watchdog ──────────────────────────────

  it('sets detectionLostAtom after 3 seconds without landmarks', async () => {
    let onMessageCallback: (msg: { type: string; payload: unknown }) => boolean | void = () => false;

    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessageCallback = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    const { result } = renderHook(() => usePoseDetection());

    act(() => {
      result.current.startDetection(createReadyVideo());
    });

    // Empty-landmark POSE_RESULT does NOT reset the watchdog clock (AC2 fix)
    // Clock was already started by startDetection above
    act(() => {
      onMessageCallback({ type: 'POSE_RESULT', payload: { landmarks: [[]] } });
    });

    expect(mockStore.get(detectionLostAtom)).toBe(false);

    // Advance past the 3s threshold
    act(() => {
      jest.advanceTimersByTime(4_000);
    });

    expect(mockStore.get(detectionLostAtom)).toBe(true);

    // Simulate landmark recovery with valid 33-landmark payload
    const validLandmarks = Array.from({ length: 33 }, (_, i) => ({ x: 0.5, y: i * 0.03, z: 0, visibility: 0.9 }));
    act(() => {
      onMessageCallback({ type: 'POSE_RESULT', payload: { landmarks: [validLandmarks] } });
    });

    expect(mockStore.get(detectionLostAtom)).toBe(false);
  });

  it('does not clear detectionLostAtom when POSE_RESULT with empty landmarks arrives', () => {
    let onMessageCallback: (msg: { type: string; payload: unknown }) => boolean | void = () => false;

    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessageCallback = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    renderHook(() => usePoseDetection());

    mockStore.set(detectionLostAtom, true);

    act(() => {
      onMessageCallback({ type: 'POSE_RESULT', payload: { landmarks: [[]] } });
    });

    expect(mockStore.get(detectionLostAtom)).toBe(true);
  });

  // ── AC5: Error recovery ───────────────────────────────────────

  it('attempts one worker restart on error, then surfaces failure on second error', () => {
    const { result, rerender } = renderHook(() => usePoseDetection());

    // Activate detection
    act(() => {
      result.current.startDetection(createReadyVideo());
    });

    // Simulate first worker error
    mockWorkerReturn({ workerStatus: 'error', error: 'Worker crashed' });
    rerender();

    // Should have attempted restart
    expect(mockRestartWorker).toHaveBeenCalledTimes(1);
    expect(mockStore.get(detectionErrorAtom)).toBeNull();

    // Simulate worker restarting (goes to loading briefly)
    mockWorkerReturn({ workerStatus: 'loading', error: null });
    rerender();

    // Simulate second failure after restart attempt
    mockWorkerReturn({ workerStatus: 'error', error: 'Worker crashed again' });
    rerender();

    // Should NOT restart again — should surface error to UI
    expect(mockRestartWorker).toHaveBeenCalledTimes(1); // Still just 1
    expect(mockStore.get(detectionErrorAtom)).toBe('Worker crashed again');
  });

  // ── Lite mode throttle ───────────────────────────────────────

  it('throttles DETECT messages in lite mode', async () => {
    mockStore.set(liteModeAtom, true);
    let onMessage: ((response: AIWorkerResponse) => boolean | void) | null = null;
    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessage = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    let perfTime = 100;
    jest.spyOn(performance, 'now').mockImplementation(() => perfTime);

    const video = createReadyVideo();
    const { result } = renderHook(() => usePoseDetection());

    await act(async () => {
      result.current.startDetection(video);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    act(() => onMessage?.(createEmptyPoseResponse()));

    perfTime = 130;
    (video as { currentTime: number }).currentTime = 2.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    perfTime = 150;
    (video as { currentTime: number }).currentTime = 3.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
  });

  it('does not throttle in normal mode', async () => {
    mockStore.set(liteModeAtom, false);
    let onMessage: ((response: AIWorkerResponse) => boolean | void) | null = null;
    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessage = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    const video = createReadyVideo();
    const { result } = renderHook(() => usePoseDetection());

    await act(async () => {
      result.current.startDetection(video);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    act(() => onMessage?.(createEmptyPoseResponse()));
    (video as { currentTime: number }).currentTime = 2.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(2);

    act(() => onMessage?.(createEmptyPoseResponse()));
    (video as { currentTime: number }).currentTime = 3.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });
    expect(mockPostMessage).toHaveBeenCalledTimes(3);
  });

  it('resumes processing after throttle window elapses in lite mode', async () => {
    mockStore.set(liteModeAtom, true);
    let onMessage: ((response: AIWorkerResponse) => boolean | void) | null = null;
    (useAIWorker as jest.Mock).mockImplementation((options) => {
      onMessage = options.onMessage;
      return {
        postMessage: mockPostMessage,
        workerStatus: 'ready',
        error: null,
        restartWorker: mockRestartWorker,
      };
    });

    let perfTime = 100;
    jest.spyOn(performance, 'now').mockImplementation(() => perfTime);

    const video = createReadyVideo();
    const { result } = renderHook(() => usePoseDetection());

    act(() => {
      result.current.startDetection(video);
    });

    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    act(() => onMessage?.(createEmptyPoseResponse()));

    perfTime = 130;
    (video as { currentTime: number }).currentTime = 2.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);
    act(() => onMessage?.(createEmptyPoseResponse()));

    perfTime = 200;
    (video as { currentTime: number }).currentTime = 3.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);
  });
});
