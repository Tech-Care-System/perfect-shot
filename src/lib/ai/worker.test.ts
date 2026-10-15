import { initializeWithRetry } from './pose-detector';
import { handleWorkerMessage, setupAIWorker } from './worker';
import type { AIWorkerMessage, AIWorkerResponse } from './worker.types';

jest.mock('./pose-detector', () => ({
  initializeWithRetry: jest.fn(),
}));

const mockedInitializeWithRetry = jest.mocked(initializeWithRetry);

describe('AI Worker message handling', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await handleWorkerMessage({ type: 'TERMINATE' });
  });

  it('returns READY for INIT message after successful MediaPipe initialization', async () => {
    const poseLandmarker = {
      detectForVideo: jest.fn(),
      close: jest.fn(),
    };
    mockedInitializeWithRetry.mockResolvedValue(
      poseLandmarker as unknown as Awaited<ReturnType<typeof initializeWithRetry>>
    );

    const response = await handleWorkerMessage({
      type: 'INIT',
      payload: { module: 'pose_landmarker' },
    });

    expect(response).toEqual({ type: 'READY' });
    expect(mockedInitializeWithRetry).toHaveBeenCalledTimes(1);
  });

  it('returns ERROR when INIT fails', async () => {
    mockedInitializeWithRetry.mockRejectedValue(new Error('Model download failed'));

    const response = await handleWorkerMessage({
      type: 'INIT',
      payload: { module: 'pose_landmarker' },
    });

    expect(response?.type).toBe('ERROR');
    if (response?.type === 'ERROR') {
      expect(response.payload.error).toContain('Model download failed');
    }
  });

  it('returns ERROR if DETECT is called before initialization', async () => {
    const imageBitmap = { close: jest.fn() } as unknown as ImageBitmap;
    const response = await handleWorkerMessage({
      type: 'DETECT',
      payload: { image: imageBitmap, timestamp: 1000 },
    });

    expect(imageBitmap.close).toHaveBeenCalledTimes(1);
    expect(response?.type).toBe('ERROR');
    if (response?.type === 'ERROR') {
      expect(response.payload.error).toContain('not initialized');
    }
  });

  it('returns POSE_RESULT and calls detectForVideo after successful INIT', async () => {
    const poseResult = { landmarks: [] };
    const imageBitmap = { close: jest.fn() } as unknown as ImageBitmap;
    const poseLandmarker = {
      detectForVideo: jest.fn().mockReturnValue(poseResult),
      close: jest.fn(),
    };

    mockedInitializeWithRetry.mockResolvedValue(
      poseLandmarker as unknown as Awaited<ReturnType<typeof initializeWithRetry>>
    );

    await handleWorkerMessage({
      type: 'INIT',
      payload: { module: 'pose_landmarker' },
    });

    const response = await handleWorkerMessage({
      type: 'DETECT',
      payload: { image: imageBitmap, timestamp: 1234 },
    });

    expect(poseLandmarker.detectForVideo).toHaveBeenCalledWith(imageBitmap, 1234);
    expect(imageBitmap.close).toHaveBeenCalledTimes(1);
    expect(response).toEqual({
      type: 'POSE_RESULT',
      payload: poseResult,
    });
  });

  it('returns ERROR when detectForVideo throws', async () => {
    const imageBitmap = { close: jest.fn() } as unknown as ImageBitmap;
    const poseLandmarker = {
      detectForVideo: jest.fn(() => {
        throw new Error('inference failure');
      }),
      close: jest.fn(),
    };

    mockedInitializeWithRetry.mockResolvedValue(
      poseLandmarker as unknown as Awaited<ReturnType<typeof initializeWithRetry>>
    );

    await handleWorkerMessage({
      type: 'INIT',
      payload: { module: 'pose_landmarker' },
    });

    const response = await handleWorkerMessage({
      type: 'DETECT',
      payload: { image: imageBitmap, timestamp: 42 },
    });

    expect(imageBitmap.close).toHaveBeenCalledTimes(1);
    expect(response?.type).toBe('ERROR');
    if (response?.type === 'ERROR') {
      expect(response.payload.error).toContain('Pose detection failed');
    }
  });

  it('calls poseLandmarker.close() and returns null on TERMINATE', async () => {
    const poseLandmarker = {
      detectForVideo: jest.fn(),
      close: jest.fn(),
    };
    mockedInitializeWithRetry.mockResolvedValue(
      poseLandmarker as unknown as Awaited<ReturnType<typeof initializeWithRetry>>
    );

    await handleWorkerMessage({
      type: 'INIT',
      payload: { module: 'pose_landmarker' },
    });
    const response = await handleWorkerMessage({ type: 'TERMINATE' });

    expect(response).toBeNull();
    expect(poseLandmarker.close).toHaveBeenCalledTimes(1);
  });
});

describe('setupAIWorker', () => {
  function createMockScope() {
    const posted: AIWorkerResponse[] = [];
    return {
      onmessage: null as ((event: MessageEvent<AIWorkerMessage>) => Promise<void>) | null,
      onerror: null as ((event: ErrorEvent) => boolean | void) | null,
      postMessage: jest.fn((msg: AIWorkerResponse) => posted.push(msg)),
      close: jest.fn(),
      posted,
    };
  }

  beforeEach(async () => {
    jest.clearAllMocks();
    await handleWorkerMessage({ type: 'TERMINATE' });
  });

  it('wires onmessage and onerror handlers', () => {
    const scope = createMockScope();
    setupAIWorker(scope as unknown as DedicatedWorkerGlobalScope);

    expect(scope.onmessage).toBeInstanceOf(Function);
    expect(scope.onerror).toBeInstanceOf(Function);
  });

  it('posts READY when INIT message is received', async () => {
    const scope = createMockScope();
    const poseLandmarker = {
      detectForVideo: jest.fn(),
      close: jest.fn(),
    };
    mockedInitializeWithRetry.mockResolvedValue(
      poseLandmarker as unknown as Awaited<ReturnType<typeof initializeWithRetry>>
    );
    setupAIWorker(scope as unknown as DedicatedWorkerGlobalScope);

    await scope.onmessage?.({
      data: { type: 'INIT', payload: { module: 'pose_landmarker' } },
    } as MessageEvent<AIWorkerMessage>);

    expect(scope.postMessage).toHaveBeenCalledWith({ type: 'READY' });
  });

  it('calls scope.close() on TERMINATE message', async () => {
    const scope = createMockScope();
    setupAIWorker(scope as unknown as DedicatedWorkerGlobalScope);

    await scope.onmessage?.({
      data: { type: 'TERMINATE' },
    } as MessageEvent<AIWorkerMessage>);

    expect(scope.close).toHaveBeenCalled();
    expect(scope.posted).toHaveLength(0);
  });

  it('catches handler errors and posts ERROR response', async () => {
    const scope = createMockScope();
    setupAIWorker(scope as unknown as DedicatedWorkerGlobalScope);

    await scope.onmessage?.({
      data: { type: 'INVALID_ACTION' } as unknown as AIWorkerMessage,
    } as MessageEvent<AIWorkerMessage>);

    expect(scope.posted).toHaveLength(1);
    expect(scope.posted[0].type).toBe('ERROR');
  });

  it('posts ERROR and returns true from onerror handler', () => {
    const scope = createMockScope();
    setupAIWorker(scope as unknown as DedicatedWorkerGlobalScope);

    const result = scope.onerror?.({
      message: 'Unhandled runtime error',
    } as ErrorEvent);

    expect(result).toBe(true);
    expect(scope.posted).toHaveLength(1);
    expect(scope.posted[0]).toEqual({
      type: 'ERROR',
      payload: { error: 'Unhandled runtime error' },
    });
  });
});
