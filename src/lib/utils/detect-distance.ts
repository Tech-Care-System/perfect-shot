import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { SUBJECT_TOO_FAR_TORSO_HEIGHT } from '@/constants/app.constants';

const MIN_VISIBILITY = 0.1;

const LM_SHOULDER_L = 11;
const LM_SHOULDER_R = 12;
const LM_HIP_L = 23;
const LM_HIP_R = 24;

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

function midY(a: NormalizedLandmark, b: NormalizedLandmark): number {
  return (a.y + b.y) / 2;
}

export function detectSubjectDistance(landmarks: NormalizedLandmark[]): 'ok' | 'too-far' {
  if (!landmarks || landmarks.length < 33) return 'ok';

  const shoulderL = getLandmark(landmarks, LM_SHOULDER_L);
  const shoulderR = getLandmark(landmarks, LM_SHOULDER_R);
  const hipL = getLandmark(landmarks, LM_HIP_L);
  const hipR = getLandmark(landmarks, LM_HIP_R);

  if (!shoulderL || !shoulderR || !hipL || !hipR) return 'ok';

  const torsoHeight = Math.abs(midY(shoulderL, shoulderR) - midY(hipL, hipR));

  return torsoHeight >= SUBJECT_TOO_FAR_TORSO_HEIGHT ? 'ok' : 'too-far';
}
