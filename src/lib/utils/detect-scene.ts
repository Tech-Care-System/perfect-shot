import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import type { SceneType } from '@/lib/types/pose.types';

const MIN_VISIBILITY = 0.1;

const LM_SHOULDER_L = 11;
const LM_SHOULDER_R = 12;
const LM_HIP_L = 23;
const LM_HIP_R = 24;
const LM_KNEE_L = 25;
const LM_KNEE_R = 26;
const LM_ANKLE_L = 27;
const LM_ANKLE_R = 28;

const SEATED_KNEE_RATIO_THRESHOLD = 0.4;
const RECLINED_TORSO_ANGLE_THRESHOLD = 30;
const WIDE_STANCE_RATIO_THRESHOLD = 0.6;

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

function angleDegrees(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;
  const dot = baX * bcX + baY * bcY;
  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);
  if (magBA < 1e-6 || magBC < 1e-6) return 180;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

function torsoAngleFromVertical(
  shoulderL: NormalizedLandmark,
  shoulderR: NormalizedLandmark,
  hipL: NormalizedLandmark,
  hipR: NormalizedLandmark
): number {
  const shoulderMidX = (shoulderL.x + shoulderR.x) / 2;
  const shoulderMidY = (shoulderL.y + shoulderR.y) / 2;
  const hipMidX = (hipL.x + hipR.x) / 2;
  const hipMidY = (hipL.y + hipR.y) / 2;

  const dx = shoulderMidX - hipMidX;
  const dy = hipMidY - shoulderMidY;

  if (Math.abs(dy) < 1e-6 && Math.abs(dx) < 1e-6) return 0;
  return (Math.atan2(Math.abs(dx), dy) * 180) / Math.PI;
}

export function detectScene(landmarks: NormalizedLandmark[]): SceneType {
  if (!landmarks || landmarks.length < 33) return 'standing';

  const shoulderL = getLandmark(landmarks, LM_SHOULDER_L);
  const shoulderR = getLandmark(landmarks, LM_SHOULDER_R);
  const hipL = getLandmark(landmarks, LM_HIP_L);
  const hipR = getLandmark(landmarks, LM_HIP_R);
  const kneeL = getLandmark(landmarks, LM_KNEE_L);
  const kneeR = getLandmark(landmarks, LM_KNEE_R);
  const ankleL = getLandmark(landmarks, LM_ANKLE_L);
  const ankleR = getLandmark(landmarks, LM_ANKLE_R);

  if (!shoulderL || !shoulderR || !hipL || !hipR) return 'standing';

  const torsoHeight = Math.abs(midY(shoulderL, shoulderR) - midY(hipL, hipR));
  if (torsoHeight < 1e-6) return 'standing';

  const hasKnees = kneeL && kneeR;
  const hasAnkles = ankleL && ankleR;

  if (hasKnees) {
    const hipKneeVertical = Math.abs(midY(hipL, hipR) - midY(kneeL, kneeR));
    const kneeRatio = hipKneeVertical / torsoHeight;

    let isSeated = kneeRatio < SEATED_KNEE_RATIO_THRESHOLD;

    if (!isSeated && hasAnkles) {
      const kneeAngleL = angleDegrees(hipL, kneeL, ankleL);
      const kneeAngleR = angleDegrees(hipR, kneeR, ankleR);
      const avgKneeAngle = (kneeAngleL + kneeAngleR) / 2;
      isSeated = avgKneeAngle < 140;
    }

    if (isSeated) {
      const torsoAngle = torsoAngleFromVertical(shoulderL, shoulderR, hipL, hipR);
      return torsoAngle > RECLINED_TORSO_ANGLE_THRESHOLD ? 'sofa' : 'solo-chair';
    }
  }

  const shoulderWidth = Math.abs(shoulderL.x - shoulderR.x);
  const widthRatio = shoulderWidth / torsoHeight;

  return widthRatio > WIDE_STANCE_RATIO_THRESHOLD ? 'stage' : 'standing';
}
