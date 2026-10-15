import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { LIGHTING_VISIBILITY_THRESHOLD } from '@/constants/app.constants';

const KEY_LANDMARK_INDICES = [11, 12, 13, 14, 23, 24, 25, 26];

export function detectLighting(landmarks: NormalizedLandmark[]): 'ok' | 'poor' {
  if (!landmarks || landmarks.length < 33) return 'ok';

  const visibilities: number[] = [];
  for (const idx of KEY_LANDMARK_INDICES) {
    const lm = landmarks[idx];
    if (lm && Number.isFinite(lm.visibility)) {
      visibilities.push(lm.visibility as number);
    }
  }

  if (visibilities.length < 4) return 'ok';

  const avg = visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
  return avg < LIGHTING_VISIBILITY_THRESHOLD ? 'poor' : 'ok';
}
