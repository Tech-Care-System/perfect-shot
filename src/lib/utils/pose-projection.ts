import type { NormalizedLandmark } from '@mediapipe/tasks-vision';

// The authored pose library uses a portrait frame, independently of camera resolution.
export const REFERENCE_POSE_ASPECT_RATIO = 9 / 16;

export interface PoseGuideFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function projectReferencePose(
  landmarks: NormalizedLandmark[],
  canvasWidth: number,
  canvasHeight: number,
  frame: PoseGuideFrame,
  mirrored: boolean,
): NormalizedLandmark[] {
  if (![canvasWidth, canvasHeight, frame.width, frame.height].every((value) => Number.isFinite(value) && value > 0)
    || !Number.isFinite(frame.x) || !Number.isFinite(frame.y)) return [];

  const height = Math.min(frame.height, frame.width / REFERENCE_POSE_ASPECT_RATIO) * 0.9;
  const width = height * REFERENCE_POSE_ASPECT_RATIO;
  const left = frame.x + (frame.width - width) / 2;
  const top = frame.y + (frame.height - height) / 2;
  return landmarks.map((point) => ({
    ...point,
    x: (left + (mirrored ? 1 - point.x : point.x) * width) / canvasWidth,
    y: (top + point.y * height) / canvasHeight,
  }));
}

export function normalizeCameraPose(
  landmarks: NormalizedLandmark[],
  sourceWidth: number,
  sourceHeight: number,
): NormalizedLandmark[] {
  if (![sourceWidth, sourceHeight].every((value) => Number.isFinite(value) && value > 0)) return landmarks;
  const factor = (sourceWidth / sourceHeight) / REFERENCE_POSE_ASPECT_RATIO;
  return landmarks.map((point) => ({
    ...point,
    x: (point.x - 0.5) * factor + 0.5,
    z: point.z * factor,
  }));
}
