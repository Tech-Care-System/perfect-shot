import type { AIWorkerMessage } from './worker.types';

const validInit: AIWorkerMessage = {
  type: 'INIT',
  payload: { module: 'pose_landmarker' },
};

const validTerminate: AIWorkerMessage = { type: 'TERMINATE' };
const validDetect: AIWorkerMessage = {
  type: 'DETECT',
  payload: { image: {} as OffscreenCanvas, timestamp: 0 },
};

// @ts-expect-error invalid worker action should fail compile-time
const invalidAction: AIWorkerMessage = { type: 'BOOT' };

// @ts-expect-error INIT requires payload.module
const invalidInitPayload: AIWorkerMessage = { type: 'INIT', payload: {} };

// @ts-expect-error DETECT requires payload.timestamp
const invalidDetectPayload: AIWorkerMessage = { type: 'DETECT', payload: { image: {} as OffscreenCanvas } };

void validInit;
void validTerminate;
void validDetect;
void invalidAction;
void invalidInitPayload;
void invalidDetectPayload;
