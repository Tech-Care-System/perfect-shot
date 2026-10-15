import { MAX_RETRY_COUNT, MEDIAPIPE_CDN_URL, POSE_MODEL_URL } from '@/constants/app.constants';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { workerLogger } from './worker-logger';

const origin = typeof self !== 'undefined' && self.location ? self.location.origin : '';
const MEDIAPIPE_WASM_PATH = `${origin}${MEDIAPIPE_CDN_URL}`;
const LOCAL_POSE_MODEL_URL = `${origin}${POSE_MODEL_URL}`;



function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function initializePoseLandmarker(): Promise<PoseLandmarker> {
  const options = {
    baseOptions: {
      modelAssetPath: LOCAL_POSE_MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  } as const;

  workerLogger.log('initializePoseLandmarker called', { MEDIAPIPE_WASM_PATH, LOCAL_POSE_MODEL_URL });

  let fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>;
  try {
    workerLogger.log('Loading FilesetResolver...');
    fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
    workerLogger.log('FilesetResolver loaded');
  } catch (error) {
    workerLogger.error('FilesetResolver failed', error);
    throw new Error(`Failed to load WASM runtime: ${getErrorMessage(error)}`);
  }

  let poseLandmarker: PoseLandmarker;
  try {
    workerLogger.log('Creating PoseLandmarker...');
    poseLandmarker = await PoseLandmarker.createFromModelPath(fileset, LOCAL_POSE_MODEL_URL);
    workerLogger.log('PoseLandmarker created');
  } catch (error) {
    workerLogger.error('PoseLandmarker creation failed', error);
    throw new Error(`Model download failed: ${getErrorMessage(error)}`);
  }

  try {
    workerLogger.log('Setting options...');
    await poseLandmarker.setOptions(options);
    workerLogger.log('Options set, initialization complete');
  } catch (error) {
    workerLogger.error('Set options failed', error);
    throw new Error(`Failed to configure detector: ${getErrorMessage(error)}`);
  }

  return poseLandmarker;
}

type InitializePoseLandmarker = () => Promise<PoseLandmarker>;

export async function initializeWithRetry(
  initialize: InitializePoseLandmarker = initializePoseLandmarker
): Promise<PoseLandmarker> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY_COUNT; attempt += 1) {
    try {
      return await initialize();
    } catch (error) {
      lastError = error;
      workerLogger.error(
        `MediaPipe initialization attempt ${attempt}/${MAX_RETRY_COUNT} failed`,
        error
      );
    }
  }

  throw new Error(
    `Failed to initialize MediaPipe after ${MAX_RETRY_COUNT} attempts: ${getErrorMessage(lastError)}`
  );
}
