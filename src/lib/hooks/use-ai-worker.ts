'use client';

import type { AIWorkerMessage, AIWorkerResponse } from '@/lib/ai/worker.types';
import { WorkerErrorDetail } from '@/lib/types/error.types';
import type { AsyncStatus } from '@/lib/types/status.types';
import { logger } from '@/lib/utils/logger';
import { useCallback, useEffect, useRef, useState } from 'react';

const INIT_TIMEOUT_MILLISECONDS = 5_000;

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

  const createWorker = useCallback(() => {
    // Clean up any existing worker
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
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
      if (workerRef.current === worker) {
        logger.error(COMPONENT_NAME, 'Worker INIT timed out after 5 seconds');
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
        if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
        setWorkerStatus('ready');
        setInitializationDurationMs(Math.round(performance.now() - initStartedAtRef.current));
      } else if (response.type === 'ERROR') {
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
      const message = event.message || 'Unhandled worker error';
      logger.error(COMPONENT_NAME, 'Worker runtime error', message);
      setWorkerStatus('error');
      setError(message);
    };

    worker.postMessage({ type: 'INIT', payload: { module: 'pose_landmarker' } } satisfies AIWorkerMessage);
  }, []);

  useEffect(() => {
    setTimeout(createWorker, 0);


    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
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
