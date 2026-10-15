/// <reference lib="webworker" />

import { initializeWithRetry } from './pose-detector';
import { workerLogger } from './worker-logger';
import type { AIWorkerMessage, AIWorkerResponse } from './worker.types';

type PoseLandmarker = Awaited<ReturnType<typeof initializeWithRetry>>;

let poseLandmarker: PoseLandmarker | null = null;
let initializationPromise: Promise<PoseLandmarker> | null = null;
let frameCount = 0;
let lastFpsUpdateAt: number | null = null;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function ensureInitialized(): Promise<PoseLandmarker> {
  if (poseLandmarker) {
    return poseLandmarker;
  }

  if (!initializationPromise) {
    initializationPromise = initializeWithRetry();
  }

  try {
    poseLandmarker = await initializationPromise;
    return poseLandmarker;
  } finally {
    initializationPromise = null;
  }
}

export async function handleWorkerMessage(message: AIWorkerMessage): Promise<AIWorkerResponse | null> {
  switch (message.type) {
    case 'INIT': {
      try {
        await ensureInitialized();
        return { type: 'READY' };
      } catch (error) {
        poseLandmarker = null;
        return {
          type: 'ERROR',
          payload: { error: toErrorMessage(error), type: 'LOAD_ERROR' },
        };

      }
    }
    case 'DETECT': {
      const image = message.payload.image;
      try {
        if (!poseLandmarker) {
          return {
            type: 'ERROR',
            payload: {
              error: 'PoseLandmarker is not initialized. Send INIT and wait for READY before DETECT.',
            },
          };
        }

        if (Math.random() < 0.05) workerLogger.log('Received DETECT', message.payload.timestamp);
        const result = poseLandmarker.detectForVideo(image, message.payload.timestamp);
        if (Math.random() < 0.05) workerLogger.log('Generated POSE_RESULT', result.landmarks.length > 0 ? 'landmarks found' : 'no landmarks');

        return {
          type: 'POSE_RESULT',
          payload: result,
        };

      } catch (error) {
        return {
          type: 'ERROR',
          payload: { error: `Pose detection failed: ${toErrorMessage(error)}`, type: 'RUNTIME_ERROR' },
        };
      } finally {
        // The transferred bitmap belongs to the worker and must be released after inference.
        if ('close' in image && typeof image.close === 'function') {
          image.close();
        }
      }
    }
    case 'TERMINATE':
      if (poseLandmarker) {
        poseLandmarker.close();
        poseLandmarker = null;
      }
      initializationPromise = null;
      return null;
    default: {
      const exhaustiveCheck: never = message;
      throw new Error(`Unsupported worker message: ${String(exhaustiveCheck)}`);
    }
  }
}

export function setupAIWorker(scope: DedicatedWorkerGlobalScope) {
  scope.onmessage = async (event: MessageEvent<AIWorkerMessage>) => {
    try {
      const result = await handleWorkerMessage(event.data);
      if (result) {
        scope.postMessage(result);
      }

      // Calculate and send periodic FPS updates (AC4)
      if (event.data.type === 'DETECT') {
        const now = performance.now();

        // Initialize on first frame to avoid bogus initial sample
        if (lastFpsUpdateAt === null) {
          lastFpsUpdateAt = now;
          frameCount = 0;
        }

        frameCount++;
        const elapsed = now - lastFpsUpdateAt;

        if (elapsed >= 1000) {
          const fps = Math.round((frameCount * 1000) / elapsed);
          scope.postMessage({
            type: 'FPS_UPDATE',
            payload: { fps },
          } satisfies AIWorkerResponse);
          frameCount = 0;
          lastFpsUpdateAt = now;
        }
      }

      if (event.data.type === 'TERMINATE') {
        scope.close();
      }
    } catch (error) {
      const response: AIWorkerResponse = {
        type: 'ERROR',
        payload: {
          error: error instanceof Error ? error.message : 'Unknown worker error',
        },
      };
      scope.postMessage(response);
    }
  };

  scope.onerror = (event: ErrorEvent) => {
    const errorMessage = event.message || 'Unhandled error in AI worker';
    // Log for dev visibility before posting structured ERROR to main thread
    workerLogger.error('Unhandled error', errorMessage);

    const response: AIWorkerResponse = {
      type: 'ERROR',
      payload: { error: errorMessage },
    };
    scope.postMessage(response);
    return true;
  };
}

declare const self: DedicatedWorkerGlobalScope;

if (typeof self !== 'undefined' && typeof self.postMessage === 'function') {
  setupAIWorker(self);
}
