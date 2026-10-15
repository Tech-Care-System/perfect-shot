import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';

export type AIWorkerMessage =
  | { type: 'INIT'; payload: { module: 'pose_landmarker' } }
  | { type: 'DETECT'; payload: { image: ImageBitmap | OffscreenCanvas; timestamp: number } }
  | { type: 'TERMINATE' };

export type AIWorkerResponse =
  | { type: 'READY' }
  | { type: 'POSE_RESULT'; payload: PoseLandmarkerResult }
  | { type: 'FPS_UPDATE'; payload: { fps: number } }
  | { type: 'ERROR'; payload: { error: string; type?: 'LOAD_ERROR' | 'RUNTIME_ERROR' } };

