import { MAX_RETRY_COUNT, MEDIAPIPE_CDN_URL, POSE_MODEL_URL } from '@/constants/app.constants';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { initializePoseLandmarker, initializeWithRetry } from './pose-detector';
import { workerLogger } from './worker-logger';

jest.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: jest.fn(),
  },
  PoseLandmarker: {
    createFromModelPath: jest.fn(),
  },
}));

jest.mock('./worker-logger', () => ({
  workerLogger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockedForVisionTasks = jest.mocked(FilesetResolver.forVisionTasks);
const mockedCreateFromModelPath = jest.mocked(PoseLandmarker.createFromModelPath);

describe('initializePoseLandmarker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads WASM fileset and model, then configures VIDEO mode', async () => {
    const fileset = { wasmLoaderPath: 'loader', wasmBinaryPath: 'binary' };
    const poseLandmarker = {
      setOptions: jest.fn().mockResolvedValue(undefined),
    };

    mockedForVisionTasks.mockResolvedValue(fileset);
    mockedCreateFromModelPath.mockResolvedValue(
      poseLandmarker as unknown as Awaited<ReturnType<typeof PoseLandmarker.createFromModelPath>>
    );

    const result = await initializePoseLandmarker();

    const origin = typeof self !== 'undefined' && self.location ? self.location.origin : '';
    expect(mockedForVisionTasks).toHaveBeenCalledWith(`${origin}${MEDIAPIPE_CDN_URL}`);
    expect(mockedCreateFromModelPath).toHaveBeenCalledWith(fileset, `${origin}${POSE_MODEL_URL}`);
    expect(poseLandmarker.setOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        runningMode: 'VIDEO',
        numPoses: 1,
      })
    );
    expect(result).toBe(poseLandmarker);
  });

  it('throws actionable error when WASM runtime cannot be loaded', async () => {
    mockedForVisionTasks.mockRejectedValue(new Error('Network down'));

    await expect(initializePoseLandmarker()).rejects.toThrow(
      'Failed to load WASM runtime: Network down'
    );
  });

  it('throws actionable error when model download fails', async () => {
    mockedForVisionTasks.mockResolvedValue({ wasmLoaderPath: 'loader', wasmBinaryPath: 'binary' });
    mockedCreateFromModelPath.mockRejectedValue(new Error('404 model not found'));

    await expect(initializePoseLandmarker()).rejects.toThrow(
      'Model download failed: 404 model not found'
    );
  });
});

describe('initializeWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retries when first attempt fails and then succeeds', async () => {
    const poseLandmarker = { close: jest.fn() };
    const initialize = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary network error'))
      .mockResolvedValueOnce(poseLandmarker);
    const errorSpy = jest.mocked(workerLogger.error);

    const result = await initializeWithRetry(
      initialize as () => Promise<Awaited<ReturnType<typeof PoseLandmarker.createFromModelPath>>>
    );

    expect(initialize).toHaveBeenCalledTimes(2);
    expect(result).toBe(poseLandmarker);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining(`attempt 1/${MAX_RETRY_COUNT} failed`),
      expect.any(Error)
    );
  });

  it('throws descriptive error when all retries fail', async () => {
    const initialize = jest.fn().mockRejectedValue(new Error('Failed to load WASM runtime'));
    const errorSpy = jest.mocked(workerLogger.error);

    await expect(
      initializeWithRetry(
        initialize as () => Promise<Awaited<ReturnType<typeof PoseLandmarker.createFromModelPath>>>
      )
    ).rejects.toThrow(
      `Failed to initialize MediaPipe after ${MAX_RETRY_COUNT} attempts: Failed to load WASM runtime`
    );

    expect(initialize).toHaveBeenCalledTimes(MAX_RETRY_COUNT);
    expect(errorSpy).toHaveBeenCalledTimes(MAX_RETRY_COUNT);
  });
});
