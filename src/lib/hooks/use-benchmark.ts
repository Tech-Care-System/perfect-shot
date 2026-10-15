'use client';

import {
    BENCHMARK_FRAMES,
    BENCHMARK_STORAGE_KEY,
    BENCHMARK_TIMEOUT_MS,
    BENCHMARK_WARMUP_FRAMES,
} from '@/constants/app.constants';
import type { AIWorkerMessage, AIWorkerResponse } from '@/lib/ai/worker.types';
import { videoElementAtom } from '@/lib/stores/camera-store';
import type { AsyncStatus } from '@/lib/types/status.types';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface BenchmarkResult {
  fps: number;
  timestamp: number;
}

function isValidResult(value: unknown): value is BenchmarkResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BenchmarkResult).fps === 'number' &&
    (value as BenchmarkResult).fps > 0 &&
    isFinite((value as BenchmarkResult).fps) &&
    typeof (value as BenchmarkResult).timestamp === 'number'
  );
}

function getStoredResult(): BenchmarkResult | null {
  try {
    const raw = localStorage.getItem(BENCHMARK_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidResult(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function storeResult(result: BenchmarkResult): void {
  try {
    localStorage.setItem(BENCHMARK_STORAGE_KEY, JSON.stringify(result));
  } catch {
    // Silent failure
  }
}

export function useBenchmark() {
  const videoElement = useAtomValue(videoElementAtom);
  const [status, setStatus] = useState<AsyncStatus>(() => {
    const stored = getStoredResult();
    return stored ? 'ready' : 'idle';
  });
  const [result, setResult] = useState<BenchmarkResult | null>(getStoredResult);
  const hasRunRef = useRef(status === 'ready');
  const workerRef = useRef<Worker | null>(null);

  const runBenchmark = useCallback(async (video: HTMLVideoElement) => {
    setStatus('loading');

    try {
      const worker = new Worker(
        new URL('../ai/worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;

      const timeout = <T,>(ms: number, label: string) =>
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error(`${label} timeout`)), ms);
        });

      await Promise.race([
        new Promise<void>((resolve, reject) => {
          worker.onmessage = (e: MessageEvent<AIWorkerResponse>) => {
            if (e.data.type === 'READY') resolve();
            else if (e.data.type === 'ERROR') reject(new Error(e.data.payload.error));
          };
          worker.postMessage({
            type: 'INIT',
            payload: { module: 'pose_landmarker' },
          } satisfies AIWorkerMessage);
        }),
        timeout<void>(BENCHMARK_TIMEOUT_MS, 'INIT'),
      ]);

      const totalFrames = BENCHMARK_WARMUP_FRAMES + BENCHMARK_FRAMES;
      const frameTimes: number[] = [];

      for (let i = 0; i < totalFrames; i++) {
        const imageBitmap = await createImageBitmap(video);
        const start = performance.now();

        await Promise.race([
          new Promise<void>((resolve, reject) => {
            worker.onmessage = (e: MessageEvent<AIWorkerResponse>) => {
              if (e.data.type === 'POSE_RESULT') resolve();
              else if (e.data.type === 'ERROR') reject(new Error(e.data.payload.error));
            };
            worker.postMessage(
              {
                type: 'DETECT',
                payload: { image: imageBitmap, timestamp: performance.now() },
              } satisfies AIWorkerMessage,
              [imageBitmap]
            );
          }),
          timeout<void>(BENCHMARK_TIMEOUT_MS, 'DETECT'),
        ]);

        const elapsed = performance.now() - start;
        if (i >= BENCHMARK_WARMUP_FRAMES) {
          frameTimes.push(elapsed);
        }
      }

      worker.postMessage({ type: 'TERMINATE' } satisfies AIWorkerMessage);
      worker.terminate();
      workerRef.current = null;

      const avgFrameTime =
        frameTimes.reduce((sum, t) => sum + t, 0) / frameTimes.length;
      const fps = Math.round(1000 / avgFrameTime);

      const benchmarkResult: BenchmarkResult = {
        fps,
        timestamp: Date.now(),
      };
      storeResult(benchmarkResult);
      setResult(benchmarkResult);
      setStatus('ready');
    } catch {
      setStatus('error');
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (videoElement && !hasRunRef.current) {
      hasRunRef.current = true;
      setTimeout(() => runBenchmark(videoElement), 0);
    }

  }, [videoElement, runBenchmark]);

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return { status, result };
}
