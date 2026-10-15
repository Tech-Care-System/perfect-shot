import {
    detectionErrorAtom,
    detectionLostAtom,
    poseFpsAtom,
    poseResultAtom,
} from '@/lib/stores/pose-store';
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
  const mockPostMessage = jest.fn();
  const mockRestartWorker = jest.fn();
  const mockStore = getDefaultStore();

  function createReadyVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
    return {
      currentTime: 1.0,
      readyState: 3, // HAVE_FUTURE_DATA
      ...overrides,
    } as unknown as HTMLVideoElement;
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

    // Mock createImageBitmap (not in JSDOM)
    global.createImageBitmap = jest.fn().mockResolvedValue({
      width: 640,
      height: 480,
      close: jest.fn(),
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

    const video = createReadyVideo();
    const { result } = renderHook(() => usePoseDetection());

    act(() => {
      result.current.startDetection(video);
    });

    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    (video as { currentTime: number }).currentTime = 2.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    (video as { currentTime: number }).currentTime = 3.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(3);
  });

  it('resumes processing after throttle window elapses in lite mode', async () => {
    mockStore.set(liteModeAtom, true);

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

    perfTime = 130;
    (video as { currentTime: number }).currentTime = 2.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(1);

    perfTime = 200;
    (video as { currentTime: number }).currentTime = 3.0;
    await act(async () => {
      jest.advanceTimersByTime(16);
      await Promise.resolve();
    });

    expect(mockPostMessage).toHaveBeenCalledTimes(2);
  });
});
