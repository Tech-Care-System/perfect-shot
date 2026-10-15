import type { VoiceCueId, VoicePlan } from './cues';
import { getCorrectionCue } from './cues';

export interface VoiceCueState {
  cameraReady: boolean;
  captured: boolean;
  plan: VoicePlan;
  detectionLost: boolean;
  subjectTooFar: boolean;
  subjectFraming: string | null;
  lightingPoor: boolean;
  poseCorrection: string | null;
  hasTargetPose: boolean;
  poseMatched: boolean;
  poseIntroPending: boolean;
}

export function selectVoiceCue(state: VoiceCueState): VoiceCueId | null {
  if (!state.cameraReady || state.captured || state.plan === 'free') return null;

  if (state.detectionLost) {
    return state.plan === 'pro' ? 'pro-find-frame' : null;
  }

  if (state.plan === 'pro') {
    if (state.subjectTooFar) return 'pro-step-closer';

    if (state.subjectFraming) {
      if (state.subjectFraming.includes('Move right')) return 'pro-move-right';
      if (state.subjectFraming.includes('Move left')) return 'pro-move-left';
      return 'pro-center-frame';
    }

    if (state.lightingPoor) return 'pro-find-brighter-light';
    if (state.hasTargetPose && state.poseIntroPending) return 'pro-pose-intro';
  }

  if (state.poseCorrection) return getCorrectionCue(state.poseCorrection);

  if (state.plan === 'pro') {
    if (state.hasTargetPose && state.poseMatched) return 'pro-pose-match';
    if (!state.hasTargetPose) return 'pro-ready';
  }

  return null;
}
