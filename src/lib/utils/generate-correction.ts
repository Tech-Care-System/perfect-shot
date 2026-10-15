import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { TargetPose } from '@/lib/types/pose.types';
import {
  extractMatchingLandmarks,
  centerOnHips,
  normalizeByTorsoLength,
} from './calculate-similarity';

const CORRECTION_THRESHOLD = 0.15;

const SEGMENTS = [
  { name: 'shoulders', indices: [0, 1], priority: 1 },
  { name: 'hips', indices: [6, 7], priority: 2 },
  { name: 'elbows', indices: [2, 3], priority: 3 },
  { name: 'wrists', indices: [4, 5], priority: 4 },
  { name: 'knees', indices: [8, 9], priority: 5 },
  { name: 'ankles', indices: [10, 11], priority: 6 },
] as const;

function getSegmentDisplacement(
  detected: NormalizedLandmark[],
  target: NormalizedLandmark[],
  indices: readonly number[]
): { dx: number; dy: number; distance: number } {
  let totalDx = 0;
  let totalDy = 0;
  for (const i of indices) {
    totalDx += target[i].x - detected[i].x;
    totalDy += target[i].y - detected[i].y;
  }
  const dx = totalDx / indices.length;
  const dy = totalDy / indices.length;
  return { dx, dy, distance: Math.sqrt(dx * dx + dy * dy) };
}

function getCorrectionMessage(segmentName: string, dx: number, dy: number): string {
  const isYDominant = Math.abs(dy) >= Math.abs(dx);

  switch (segmentName) {
    case 'shoulders':
      if (isYDominant) return dy > 0 ? 'Relax your shoulders down' : 'Raise your shoulders a bit';
      return 'Level your shoulders';
    case 'hips':
      if (isYDominant) return 'Sit up straighter';
      return dx > 0 ? 'Shift your weight to the right' : 'Shift your weight to the left';
    case 'elbows':
      if (isYDominant) return dy > 0 ? 'Lower your arms a bit' : 'Raise your arms higher';
      return 'Bring your arms in closer';
    case 'wrists':
      if (isYDominant) return dy > 0 ? 'Move your hands down' : 'Move your hands up';
      return dx > 0 ? 'Move your hands to the right' : 'Move your hands to the left';
    case 'knees':
      return dy > 0 ? 'Straighten your knees' : 'Bend your knees more';
    case 'ankles':
      return 'Adjust your stance';
    default:
      return 'Adjust your pose';
  }
}

export function generateCorrection(
  detected: NormalizedLandmark[],
  target: TargetPose
): string | null {
  if (!detected || !target || detected.length === 0 || target.length === 0) {
    return null;
  }

  const detectedSubset = extractMatchingLandmarks(detected);
  const targetSubset = extractMatchingLandmarks(target);

  if (detectedSubset.length === 0 || targetSubset.length === 0) {
    return null;
  }

  const detectedNorm = normalizeByTorsoLength(centerOnHips(detectedSubset));
  const targetNorm = normalizeByTorsoLength(centerOnHips(targetSubset));

  for (const segment of SEGMENTS) {
    const disp = getSegmentDisplacement(detectedNorm, targetNorm, segment.indices);
    if (disp.distance >= CORRECTION_THRESHOLD) {
      return getCorrectionMessage(segment.name, disp.dx, disp.dy);
    }
  }

  return null;
}
