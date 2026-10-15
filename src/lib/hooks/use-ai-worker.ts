'use client';

import type { AIWorkerMessage, AIWorkerResponse } from '@/lib/ai/worker.types';
import { WorkerErrorDetail } from '@/lib/types/error.types';
import type { AsyncStatus } from '@/lib/types/status.types';
import { logger } from '@/lib/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

// MediaPipe loads local WASM and model assets before the worker can send READY.
// Keep the startup budget aligned with the existing 15-second benchmark deadline.
const INIT_TIMEOUT_MILLISECONDS = 15_000;

const COMPONENT_NAME = 'useAIWorker';

export interface AIWorkerOptions {
  onMessage?: (response: AIWorkerResponse) => boolean | void;
}

export function useAIWorker(options?: AIWorkerOptions) {
  const workerRef = useRef<Worker | null>(null);
  const optionsRef = useRef(options);

  // Keep options stable for worker.onmessage without re-triggering useEffect
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const initStartedAtRef = useRef(0);
  const [workerStatus, setWorkerStatus] = useState<AsyncStatus>('loading');
  const [lastResponse, setLastResponse] = useState<AIWorkerResponse | null>(null);
  const [error, setError] = useState<string | WorkerErrorDetail | null>(null);
  const [initializationDurationMs, setInitializationDurationMs] = useState<number | null>(null);


  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bootstrapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createWorker = useCallback(() => {
    if (bootstrapTimeoutRef.current !== null) {
      clearTimeout(bootstrapTimeoutRef.current);
      bootstrapTimeoutRef.current = null;
    }

    // Clean up any existing worker
    if (initTimeoutRef.current !== null) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    initStartedAtRef.current = performance.now();
    setWorkerStatus('loading');
    setError(null);

    const worker = new Worker(new URL('../ai/worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    initTimeoutRef.current = setTimeout(() => {
      initTimeoutRef.current = null;
      if (workerRef.current === worker) {
        logger.error(
          COMPONENT_NAME,
          `Worker INIT timed out after ${INIT_TIMEOUT_MILLISECONDS / 1000} seconds`
        );
        setWorkerStatus('error');
        setError('Worker initialization timed out');
      }
    }, INIT_TIMEOUT_MILLISECONDS);

    worker.onmessage = (event: MessageEvent<AIWorkerResponse>) => {
      const response = event.data;

      // Execute callback if provided
      const handled = optionsRef.current?.onMessage?.(response);

      // If handled returns true, bypass React state update to optimize performance
      if (handled === true) {
        return;
      }

      setLastResponse(response);

      if (response.type === 'READY') {
        if (initTimeoutRef.current !== null) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        setWorkerStatus('ready');
        setInitializationDurationMs(Math.round(performance.now() - initStartedAtRef.current));
      } else if (response.type === 'ERROR') {
        if (initTimeoutRef.current !== null) {
          clearTimeout(initTimeoutRef.current);
          initTimeoutRef.current = null;
        }
        setWorkerStatus('error');
        // Check if payload has detailed error info
        if (response.payload.type) {
           setError({
             type: response.payload.type,
             rawError: response.payload.error
           });
        } else {
           setError(response.payload.error);
        }
        setInitializationDurationMs(Math.round(performance.now() - initStartedAtRef.current));
      }
    };

    worker.onerror = (event: ErrorEvent) => {
      if (initTimeoutRef.current !== null) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      const message = event.message || 'Unhandled worker error';
      logger.error(COMPONENT_NAME, 'Worker runtime error', message);
      setWorkerStatus('error');
      setError(message);
    };

    worker.postMessage({ type: 'INIT', payload: { module: 'pose_landmarker' } } satisfies AIWorkerMessage);
  }, []);

  useEffect(() => {
    bootstrapTimeoutRef.current = setTimeout(() => {
      bootstrapTimeoutRef.current = null;
      createWorker();
    }, 0);


    return () => {
      if (bootstrapTimeoutRef.current !== null) {
        clearTimeout(bootstrapTimeoutRef.current);
        bootstrapTimeoutRef.current = null;
      }
      if (initTimeoutRef.current !== null) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      setWorkerStatus('idle');
      setInitializationDurationMs(null);
    };
  }, [createWorker]);

  const postMessage = useCallback((message: AIWorkerMessage, transfer?: Transferable[]): boolean => {
    if (!workerRef.current) {
      const messageText = 'Worker is not initialized';
      setWorkerStatus('error');
      setError(messageText);
      return false;
    }

    workerRef.current.postMessage(message, transfer || []);
    return true;
  }, []);

  const terminate = useCallback(() => {
    if (!workerRef.current) {
      return;
    }

    workerRef.current.postMessage({ type: 'TERMINATE' } satisfies AIWorkerMessage);
    workerRef.current.terminate();
    workerRef.current = null;
    setWorkerStatus('idle');
  }, []);

  return {
    workerStatus,
    lastResponse,
    error,
    initializationDurationMs,
    postMessage,
    terminate,
    restartWorker: createWorker,
  };
}
