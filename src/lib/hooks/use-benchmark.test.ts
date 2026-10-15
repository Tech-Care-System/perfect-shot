import { BENCHMARK_FRAMES, BENCHMARK_TIMEOUT_MS, BENCHMARK_WARMUP_FRAMES } from '@/constants/app.constants';
import { videoElementAtom } from '@/lib/stores/camera-store';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAtomValue } from 'jotai';
import { useBenchmark } from './use-benchmark';

jest.mock('jotai', () => ({
  ...jest.requireActual('jotai'),
  useAtomValue: jest.fn(),
}));

let mockWorkerInstance: {
  postMessage: jest.Mock;
  terminate: jest.Mock;
  onmessage: ((e: MessageEvent) => void) | null;
};

let mockWorkerConstructor: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();

  mockWorkerInstance = {
    postMessage: jest.fn(),
    terminate: jest.fn(),
    onmessage: null,
  };

  mockWorkerConstructor = jest.fn(
    () => mockWorkerInstance as unknown as Worker
  );
  globalThis.Worker = mockWorkerConstructor as unknown as typeof Worker;

  global.createImageBitmap = jest.fn().mockResolvedValue({} as ImageBitmap);

  let time = 0;
  jest.spyOn(performance, 'now').mockImplementation(() => {
    time += 50;
    return time;
  });

  localStorage.clear();

  (useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
    if (atom === videoElementAtom) return null;
    return undefined;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function setupWorkerResponses() {
  mockWorkerInstance.postMessage.mockImplementation((msg: { type: string }) => {
    setTimeout(() => {
      if (msg.type === 'INIT') {
        mockWorkerInstance.onmessage?.({
          data: { type: 'READY' },
        } as MessageEvent);
      } else if (msg.type === 'DETECT') {
        mockWorkerInstance.onmessage?.({
          data: { type: 'POSE_RESULT', payload: { landmarks: [] } },
        } as MessageEvent);
      }
    }, 0);
  });
}

function setVideoElement(video: HTMLVideoElement | null) {
  (useAtomValue as jest.Mock).mockImplementation((atom: unknown) => {
    if (atom === videoElementAtom) return video;
    return undefined;
  });
}

async function flushAsyncTimers() {
  for (let i = 0; i < 20; i++) {
    jest.advanceTimersByTime(1);
    await Promise.resolve();
  }
}

describe('useBenchmark', () => {
  it('returns stored result from localStorage immediately without creating a worker', () => {
    const stored = { fps: 25, timestamp: 1000 };
    localStorage.setItem('ai-perfect-shot-benchmark', JSON.stringify(stored));

    const { result } = renderHook(() => useBenchmark());

    expect(result.current.status).toBe('ready');
    expect(result.current.result).toEqual(stored);
    expect(mockWorkerConstructor).not.toHaveBeenCalled();
  });

  it('starts with idle status when no stored result and no video element', () => {
    const { result } = renderHook(() => useBenchmark());

    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeNull();
  });

  it('runs benchmark when video element becomes available', async () => {
    setupWorkerResponses();
    const mockVideo = document.createElement('video');

    setVideoElement(mockVideo);
    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.result).not.toBeNull();
    expect(result.current.result!.fps).toBe(10);
  });

  it('creates Worker with correct URL and type module', async () => {
    setupWorkerResponses();
    setVideoElement(document.createElement('video'));

    renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(globalThis.Worker).toHaveBeenCalledWith(
      expect.any(URL),
      { type: 'module' }
    );
  });

  it('sends INIT message with pose_landmarker module', async () => {
    setupWorkerResponses();
    setVideoElement(document.createElement('video'));

    renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'INIT',
        payload: { module: 'pose_landmarker' },
      })
    );
  });

  it('processes warmup + measured frames total', async () => {
    setupWorkerResponses();
    setVideoElement(document.createElement('video'));

    renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    const detectCalls = mockWorkerInstance.postMessage.mock.calls.filter(
      (call: [{ type: string }]) => call[0].type === 'DETECT'
    );
    expect(detectCalls).toHaveLength(BENCHMARK_WARMUP_FRAMES + BENCHMARK_FRAMES);
  });

  it('calculates FPS as Math.round(1000 / avgFrameTimeMs)', async () => {
    setupWorkerResponses();
    setVideoElement(document.createElement('video'));

    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.result!.fps).toBe(10);
  });

  it('stores result in localStorage with correct key and shape', async () => {
    setupWorkerResponses();
    setVideoElement(document.createElement('video'));

    renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    const stored = localStorage.getItem('ai-perfect-shot-benchmark');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toEqual({
      fps: expect.any(Number),
      timestamp: expect.any(Number),
    });
  });

  it('sets status to loading during benchmark', async () => {
    let resolveInit: (() => void) | undefined;
    mockWorkerInstance.postMessage.mockImplementation((msg: { type: string }) => {
      if (msg.type === 'INIT') {
        resolveInit = () => {
          mockWorkerInstance.onmessage?.({
            data: { type: 'READY' },
          } as MessageEvent);
        };
      }
    });

    setVideoElement(document.createElement('video'));
    const { result } = renderHook(() => useBenchmark());

    await waitFor(() => {
      expect(result.current.status).toBe('loading');
    });

    setupWorkerResponses();
    await act(async () => {
      resolveInit?.();
      await flushAsyncTimers();
    });
  });

  it('sends TERMINATE message and calls worker.terminate() after completion', async () => {
    setupWorkerResponses();
    setVideoElement(document.createElement('video'));

    renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'TERMINATE' })
    );
    expect(mockWorkerInstance.terminate).toHaveBeenCalled();
  });

  it('sets status to error if INIT returns ERROR response', async () => {
    mockWorkerInstance.postMessage.mockImplementation((msg: { type: string }) => {
      setTimeout(() => {
        if (msg.type === 'INIT') {
          mockWorkerInstance.onmessage?.({
            data: { type: 'ERROR', payload: { error: 'init failed' } },
          } as MessageEvent);
        }
      }, 0);
    });

    setVideoElement(document.createElement('video'));
    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.result).toBeNull();
  });

  it('sets status to error if DETECT returns ERROR response', async () => {
    mockWorkerInstance.postMessage.mockImplementation((msg: { type: string }) => {
      setTimeout(() => {
        if (msg.type === 'INIT') {
          mockWorkerInstance.onmessage?.({
            data: { type: 'READY' },
          } as MessageEvent);
        } else if (msg.type === 'DETECT') {
          mockWorkerInstance.onmessage?.({
            data: { type: 'ERROR', payload: { error: 'detect failed' } },
          } as MessageEvent);
        }
      }, 0);
    });

    setVideoElement(document.createElement('video'));
    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(result.current.status).toBe('error');
  });

  it('terminates worker on error', async () => {
    mockWorkerInstance.postMessage.mockImplementation((msg: { type: string }) => {
      setTimeout(() => {
        if (msg.type === 'INIT') {
          mockWorkerInstance.onmessage?.({
            data: { type: 'ERROR', payload: { error: 'init failed' } },
          } as MessageEvent);
        }
      }, 0);
    });

    setVideoElement(document.createElement('video'));
    renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(mockWorkerInstance.terminate).toHaveBeenCalled();
  });

  it('does not run benchmark twice even if video element changes', async () => {
    setupWorkerResponses();
    setVideoElement(document.createElement('video'));

    const { rerender } = renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    setVideoElement(document.createElement('video'));
    rerender();

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(globalThis.Worker).toHaveBeenCalledTimes(1);
  });

  it('cleans up worker on unmount during active benchmark', async () => {
    let resolveInit: (() => void) | undefined;
    mockWorkerInstance.postMessage.mockImplementation((msg: { type: string }) => {
      if (msg.type === 'INIT') {
        resolveInit = () => {
          mockWorkerInstance.onmessage?.({
            data: { type: 'READY' },
          } as MessageEvent);
        };
      }
    });

    setVideoElement(document.createElement('video'));
    const { unmount } = renderHook(() => useBenchmark());

    await waitFor(() => {
      expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'INIT' })
      );
    });

    unmount();

    expect(mockWorkerInstance.terminate).toHaveBeenCalled();
    void resolveInit;
  });

  it('sets status to error if createImageBitmap throws', async () => {
    mockWorkerInstance.postMessage.mockImplementation((msg: { type: string }) => {
      setTimeout(() => {
        if (msg.type === 'INIT') {
          mockWorkerInstance.onmessage?.({
            data: { type: 'READY' },
          } as MessageEvent);
        }
      }, 0);
    });
    (global.createImageBitmap as jest.Mock).mockRejectedValue(new Error('video not ready'));

    setVideoElement(document.createElement('video'));
    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(result.current.status).toBe('error');
    expect(mockWorkerInstance.terminate).toHaveBeenCalled();
  });

  it('sets status to error if INIT times out', async () => {
    mockWorkerInstance.postMessage.mockImplementation(() => {});

    setVideoElement(document.createElement('video'));
    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      jest.advanceTimersByTime(BENCHMARK_TIMEOUT_MS);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('error');
    expect(mockWorkerInstance.terminate).toHaveBeenCalled();
  });

  it('ignores malformed localStorage data and runs benchmark', async () => {
    localStorage.setItem('ai-perfect-shot-benchmark', JSON.stringify({ fps: 'bad' }));
    setupWorkerResponses();
    setVideoElement(document.createElement('video'));

    const { result } = renderHook(() => useBenchmark());

    expect(result.current.status).not.toBe('ready');

    await act(async () => {
      await flushAsyncTimers();
    });

    expect(result.current.status).toBe('ready');
    expect(globalThis.Worker).toHaveBeenCalledTimes(1);
  });
});
