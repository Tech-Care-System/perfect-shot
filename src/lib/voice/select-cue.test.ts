import { selectVoiceCue, type VoiceCueState } from './select-cue';

const baseState: VoiceCueState = {
  cameraReady: true,
  captured: false,
  plan: 'starter',
  detectionLost: false,
  subjectTooFar: false,
  subjectFraming: null,
  lightingPoor: false,
  poseCorrection: null,
  hasTargetPose: false,
  poseMatched: false,
  poseIntroPending: false,
};

describe('selectVoiceCue', () => {
  it('stays silent while the camera is unavailable or a photo is captured', () => {
    expect(selectVoiceCue({ ...baseState, cameraReady: false, poseCorrection: 'Relax your shoulders down' })).toBeNull();
    expect(selectVoiceCue({ ...baseState, captured: true, poseCorrection: 'Relax your shoulders down' })).toBeNull();
  });

  it('does not unlock cues for the Free plan', () => {
    expect(selectVoiceCue({ ...baseState, plan: 'free', poseCorrection: 'Relax your shoulders down' })).toBeNull();
  });

  it('maps supported pose corrections to fixed Starter cues', () => {
    expect(selectVoiceCue({ ...baseState, poseCorrection: 'Relax your shoulders down' })).toBe('starter-relax-shoulders');
    expect(selectVoiceCue({ ...baseState, poseCorrection: 'unrecognized correction' })).toBe('starter-adjust-pose');
  });

  it('prioritizes Pro framing and distance cues over pose cues', () => {
    const withPoseCorrection = { ...baseState, plan: 'pro' as const, poseCorrection: 'Relax your shoulders down' };
    expect(selectVoiceCue({ ...withPoseCorrection, subjectTooFar: true })).toBe('pro-step-closer');
    expect(selectVoiceCue({ ...withPoseCorrection, subjectFraming: 'Move left to fit in frame' })).toBe('pro-move-left');
    expect(selectVoiceCue({ ...withPoseCorrection, lightingPoor: true })).toBe('pro-find-brighter-light');
  });

  it('adds Pro-only pose introduction and encouragement cues', () => {
    expect(selectVoiceCue({ ...baseState, plan: 'pro', hasTargetPose: true, poseIntroPending: true })).toBe('pro-pose-intro');
    expect(selectVoiceCue({ ...baseState, plan: 'pro', hasTargetPose: true, poseIntroPending: false })).toBeNull();
    expect(selectVoiceCue({ ...baseState, plan: 'pro', hasTargetPose: true, poseMatched: true })).toBe('pro-pose-match');
  });
});
