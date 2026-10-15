import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { TargetPose } from '@/lib/types/pose.types';
import { MATCHING_LANDMARK_INDICES } from '@/lib/types/pose.types';

const Z_AXIS_WEIGHT = 0.3;
const MIN_VISIBILITY = 0.1;

const SUBSET_SHOULDER_L = 0;
const SUBSET_SHOULDER_R = 1;
const SUBSET_HIP_L = 6;
const SUBSET_HIP_R = 7;

interface Point3d {
  x: number;
  y: number;
  z: number;
}

function midpoint(a: Point3d, b: Point3d): Point3d {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

function distance3d(a: Point3d, b: Point3d): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function extractMatchingLandmarks(landmarks: NormalizedLandmark[]): NormalizedLandmark[] {
  const result: NormalizedLandmark[] = [];
  for (const index of MATCHING_LANDMARK_INDICES) {
    const lm = landmarks[index];
    if (!lm || !Number.isFinite(lm.x) || !Number.isFinite(lm.y) || (lm.visibility !== undefined && lm.visibility < MIN_VISIBILITY)) {
      return [];
    }
    result.push(lm);
  }
  return result;
}

export function centerOnHips(subset: NormalizedLandmark[]): NormalizedLandmark[] {
  const hipL = subset[SUBSET_HIP_L];
  const hipR = subset[SUBSET_HIP_R];

  if (!hipL || !hipR) return subset;

  const center = midpoint(hipL, hipR);

  return subset.map((lm) => ({
    x: lm.x - center.x,
    y: lm.y - center.y,
    z: lm.z - center.z,
    visibility: lm.visibility,
  }));
}

export function normalizeByTorsoLength(subset: NormalizedLandmark[]): NormalizedLandmark[] {
  const hipL = subset[SUBSET_HIP_L];
  const hipR = subset[SUBSET_HIP_R];
  const shoulderL = subset[SUBSET_SHOULDER_L];
  const shoulderR = subset[SUBSET_SHOULDER_R];

  if (!hipL || !hipR || !shoulderL || !shoulderR) return subset;

  const hipMid = midpoint(hipL, hipR);
  const shoulderMid = midpoint(shoulderL, shoulderR);
  const torsoLength = distance3d(hipMid, shoulderMid);

  if (torsoLength < 1e-6) return subset;

  return subset.map((lm) => ({
    x: lm.x / torsoLength,
    y: lm.y / torsoLength,
    z: lm.z / torsoLength,
    visibility: lm.visibility,
  }));
}

function toWeightedVector(landmarks: NormalizedLandmark[]): number[] {
  const vector: number[] = [];
  for (const lm of landmarks) {
    vector.push(lm.x, lm.y, (lm.z ?? 0) * Z_AXIS_WEIGHT);
  }
  return vector;
}

export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 1e-10) return 0;

  return Math.max(0, Math.min(1, dot / denom));
}

export function calculatePoseSimilarity(
  detected: NormalizedLandmark[],
  target: TargetPose
): number {
  if (!detected || !target || detected.length === 0 || target.length === 0) {
    return 0;
  }

  const detectedSubset = extractMatchingLandmarks(detected);
  const targetSubset = extractMatchingLandmarks(target);

  if (detectedSubset.length === 0 || targetSubset.length === 0) {
    return 0;
  }

  const detectedCentered = centerOnHips(detectedSubset);
  const targetCentered = centerOnHips(targetSubset);

  const detectedNormalized = normalizeByTorsoLength(detectedCentered);
  const targetNormalized = normalizeByTorsoLength(targetCentered);

  const vectorA = toWeightedVector(detectedNormalized);
  const vectorB = toWeightedVector(targetNormalized);

  return calculateCosineSimilarity(vectorA, vectorB);
}
