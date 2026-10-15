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
      const sent = result.current.postMessage({
        type: 'DETECT',
        payload: { image: {} as OffscreenCanvas, timestamp: 1234 },
      });
      expect(sent).toBe(true);
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

  it('does not create a worker if unmounted before deferred initialization', () => {
    const { unmount } = renderHook(() => useAIWorker());

    unmount();
    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(workerFactory).not.toHaveBeenCalled();
  });

  it('starts only one worker when StrictMode replays the initialization effect', () => {
    renderHook(() => useAIWorker(), { reactStrictMode: true });

    act(() => {
      jest.advanceTimersByTime(0);
    });

    expect(workerFactory).toHaveBeenCalledTimes(1);
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
      const sent = result.current.postMessage({
        type: 'DETECT',
        payload: { image: {} as OffscreenCanvas, timestamp: 1234 },
      });
      expect(sent).toBe(false);
    });

    expect(result.current.workerStatus).toBe('error');
    expect(result.current.error).toBe('Worker is not initialized');
  });

  it('does not time out while MediaPipe is still initializing after five seconds', () => {
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
      jest.advanceTimersByTime(5_000);
    });

    expect(result.current.workerStatus).toBe('loading');
    expect(result.current.error).toBeNull();

    act(() => {
      instance.onmessage?.({ data: { type: 'READY' } } as MessageEvent);
    });

    expect(result.current.workerStatus).toBe('ready');
    expect(result.current.error).toBeNull();
  });

  it('transitions to error state on the extended INIT timeout', () => {
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
      jest.advanceTimersByTime(15_000);
    });

    expect(result.current.workerStatus).toBe('error');
    expect(result.current.error).toBe('Worker initialization timed out');
  });

  it('restarts cleanly after an INIT timeout and accepts READY from the replacement worker', () => {
    const instances: MockWorker[] = [];
    const silentFactory = jest.fn(() => {
      const worker = new MockWorker();
      worker.postMessage = jest.fn();
      instances.push(worker);
      return worker;
    });
    (global as typeof global & { Worker: typeof Worker }).Worker =
      silentFactory as unknown as typeof Worker;

    const { result } = renderHook(() => useAIWorker());
    act(() => {
      jest.advanceTimersByTime(0);
    });

    act(() => {
      jest.advanceTimersByTime(15_000);
    });
    expect(result.current.workerStatus).toBe('error');

    act(() => {
      result.current.restartWorker();
    });
    const replacement = instances[1];
    expect(instances).toHaveLength(2);
    expect(instances[0].terminate).toHaveBeenCalled();
    expect(result.current.workerStatus).toBe('loading');

    act(() => {
      replacement.onmessage?.({ data: { type: 'READY' } } as MessageEvent);
      jest.advanceTimersByTime(15_000);
    });

    expect(result.current.workerStatus).toBe('ready');
    expect(result.current.error).toBeNull();
  });

  it('preserves the worker initialization error instead of replacing it with a timeout', () => {
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
        data: { type: 'ERROR', payload: { error: 'Model download failed' } },
      } as MessageEvent);
      jest.advanceTimersByTime(15_000);
    });

    expect(result.current.workerStatus).toBe('error');
    expect(result.current.error).toBe('Model download failed');
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
