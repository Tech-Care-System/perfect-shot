import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { FRAMING_EDGE_THRESHOLD } from '@/constants/app.constants';

const MIN_VISIBILITY = 0.1;

const LM_SHOULDER_L = 11;
const LM_SHOULDER_R = 12;
const LM_HIP_L = 23;
const LM_HIP_R = 24;

export type FramingResult = 'ok' | 'cut-left' | 'cut-right';

function isValidLandmark(lm: NormalizedLandmark | undefined): lm is NormalizedLandmark {
  return (
    lm !== undefined &&
    Number.isFinite(lm.x) &&
    Number.isFinite(lm.y) &&
    (lm.visibility === undefined || lm.visibility >= MIN_VISIBILITY)
  );
}

function getLandmark(landmarks: NormalizedLandmark[], index: number): NormalizedLandmark | null {
  const lm = landmarks[index];
  return isValidLandmark(lm) ? lm : null;
}

export function detectFraming(landmarks: NormalizedLandmark[]): FramingResult {
  if (!landmarks || landmarks.length < 33) return 'ok';

  const indices = [LM_SHOULDER_L, LM_SHOULDER_R, LM_HIP_L, LM_HIP_R];
  const valid = indices.map((i) => getLandmark(landmarks, i)).filter(Boolean) as NormalizedLandmark[];

  if (valid.length === 0) return 'ok';

  let cutLeft = false;
  let cutRight = false;

  for (const lm of valid) {
    if (lm.x < FRAMING_EDGE_THRESHOLD) cutLeft = true;
    if (lm.x > 1 - FRAMING_EDGE_THRESHOLD) cutRight = true;
  }

  if (cutLeft && cutRight) return 'ok';
  if (cutLeft) return 'cut-left';
  if (cutRight) return 'cut-right';
  return 'ok';
}
