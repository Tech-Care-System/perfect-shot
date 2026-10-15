import type { AIWorkerMessage } from '@/lib/ai/worker.types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAIWorker } from './use-ai-worker';

class MockWorker {
  public onmessage: ((event: MessageEvent) => void) | null = null;
  public onerror: ((event: ErrorEvent) => void) | null = null;
  public postMessage = jest.fn((message: AIWorkerMessage, _transfer?: Transferable[]) => {
    if (message.type === 'INIT' && this.onmessage) {
      this.onmessage({ data: { type: 'READY' } } as MessageEvent);
    }
  });
  public terminate = jest.fn();
}

describe('useAIWorker', () => {
  const workerFactory = jest.fn(() => new MockWorker());
  const originalWorker = global.Worker;

  beforeEach(() => {
    jest.useFakeTimers();
    (global as typeof global & { Worker: typeof Worker }).Worker =
      workerFactory as unknown as typeof Worker;
  });

  afterEach(() => {
    jest.useRealTimers();
    (global as typeof global & { Worker: typeof Worker }).Worker = originalWorker;
    jest.clearAllMocks();
  });

  it('spawns worker and reaches ready state', async () => {
    const { result } = renderHook(() => useAIWorker());

    await waitFor(() => {
      expect(result.current.workerStatus).toBe('ready');
    });

    expect(workerFactory).toHaveBeenCalledTimes(1);
    expect(result.current.lastResponse).toEqual({ type: 'READY' });
  });

  it('can post messages via wrapper', async () => {
    const { result } = renderHook(() => useAIWorker());

    await waitFor(() => {
      expect(result.current.workerStatus).toBe('ready');
    });

    act(() => {
      result.current.postMessage({
        type: 'DETECT',
        payload: { image: {} as OffscreenCanvas, timestamp: 1234 },
      });
    });

    const instance = workerFactory.mock.results[0].value as MockWorker;
    expect(instance.postMessage).toHaveBeenCalledWith(
      {
        type: 'DETECT',
        payload: { image: expect.any(Object), timestamp: 1234 },
      },
      []
    );
  });

  it('terminates worker on unmount', async () => {
    const { unmount } = renderHook(() => useAIWorker());
    act(() => {
      jest.advanceTimersByTime(0);
    });
    const instance = workerFactory.mock.results[0].value as MockWorker;

    unmount();

    expect(instance.terminate).toHaveBeenCalled();
  });

  it('transitions to error state when worker fires onerror', async () => {
    const silentFactory = jest.fn(() => {
      const worker = new MockWorker();
      worker.postMessage = jest.fn();
      return worker;
    });
    (global as typeof global & { Worker: typeof Worker }).Worker =
      silentFactory as unknown as typeof Worker;

    const { result } = renderHook(() => useAIWorker());
    act(() => {
      jest.advanceTimersByTime(0);
    });
    const instance = silentFactory.mock.results[0].value as MockWorker;

    act(() => {
      instance.onerror?.({
        message: 'Worker script failed to load',
      } as ErrorEvent);
    });

    expect(result.current.workerStatus).toBe('error');
    expect(result.current.error).toBe('Worker script failed to load');
  });

  it('transitions to error state when worker sends ERROR response', async () => {
    const silentFactory = jest.fn(() => {
      const worker = new MockWorker();
      worker.postMessage = jest.fn();
      return worker;
    });
    (global as typeof global & { Worker: typeof Worker }).Worker =
      silentFactory as unknown as typeof Worker;

    const { result } = renderHook(() => useAIWorker());
    act(() => {
      jest.advanceTimersByTime(0);
    });
    const instance = silentFactory.mock.results[0].value as MockWorker;

    act(() => {
      instance.onmessage?.({
        data: { type: 'ERROR', payload: { error: 'MediaPipe load failed' } },
      } as MessageEvent);
    });

    expect(result.current.workerStatus).toBe('error');
    expect(result.current.error).toBe('MediaPipe load failed');
  });

  it('sets error when postMessage is called with no active worker', async () => {
    const { result } = renderHook(() => useAIWorker());

    await waitFor(() => {
      expect(result.current.workerStatus).toBe('ready');
    });

    act(() => {
      result.current.terminate();
    });

    act(() => {
      result.current.postMessage({
        type: 'DETECT',
        payload: { image: {} as OffscreenCanvas, timestamp: 1234 },
      });
    });

    expect(result.current.workerStatus).toBe('error');
    expect(result.current.error).toBe('Worker is not initialized');
  });

  it('transitions to error state on INIT timeout', () => {
    const silentFactory = jest.fn(() => {
      const worker = new MockWorker();
      worker.postMessage = jest.fn(); // Never replies READY
      return worker;
    });
    (global as typeof global & { Worker: typeof Worker }).Worker =
      silentFactory as unknown as typeof Worker;

    const { result } = renderHook(() => useAIWorker());

    expect(result.current.workerStatus).toBe('loading');

    act(() => {
      jest.advanceTimersByTime(5_000);
    });

    expect(result.current.workerStatus).toBe('error');
    expect(result.current.error).toBe('Worker initialization timed out');
  });

  it('bypasses state updates if onMessage returns true', async () => {
    const onMessage = jest.fn((msg) => msg.type === 'POSE_RESULT');
    const { result } = renderHook(() => useAIWorker({ onMessage }));

    await waitFor(() => {
      expect(result.current.workerStatus).toBe('ready');
    });

    const instance = workerFactory.mock.results[0].value as MockWorker;

    act(() => {
      instance.onmessage?.({
        data: { type: 'POSE_RESULT', payload: {} },
      } as MessageEvent);
    });

    expect(onMessage).toHaveBeenCalledWith({ type: 'POSE_RESULT', payload: {} });
    // Should NOT update lastResponse because onMessage returned true
    expect(result.current.lastResponse).toEqual({ type: 'READY' });
  });

  it('updates state if onMessage returns false or void', async () => {
    const onMessage = jest.fn(() => false);
    const { result } = renderHook(() => useAIWorker({ onMessage }));

    await waitFor(() => {
      expect(result.current.workerStatus).toBe('ready');
    });

    const instance = workerFactory.mock.results[0].value as MockWorker;

    act(() => {
      instance.onmessage?.({
        data: { type: 'POSE_RESULT', payload: { test: true } },
      } as MessageEvent);
    });

    expect(onMessage).toHaveBeenCalled();
    expect(result.current.lastResponse).toEqual({ type: 'POSE_RESULT', payload: { test: true } });
  });
});
