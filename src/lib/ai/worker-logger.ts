/**
 * Worker-safe logging utility.
 * Mirrors the project's logger.ts pattern but is safe for Web Worker contexts
 * where Node.js globals like `process.env` may not be available.
 */

const WORKER_TAG = 'AI Worker';

export const workerLogger = {
  log: (message: string, data?: unknown) => {
    console.log(`[${WORKER_TAG}] ${message}`, data ?? '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[${WORKER_TAG}] ${message}`, data ?? '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[${WORKER_TAG}] ${message}`, error ?? '');
  },
};
