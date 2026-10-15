export type VoicePlan = 'free' | 'starter' | 'pro';

export const VOICE_CUE_TEXT = {
  'pro-ready': 'Voice coaching is on. Step into the frame and choose a pose.',
  'pro-pose-intro': 'Take a moment to settle into the pose. I will tell you what to adjust.',
  'pro-pose-match': 'Nice work. Hold that pose.',
  'pro-step-closer': 'Take a small step closer to the camera.',
  'pro-step-back': 'Take a small step back so your whole pose fits.',
  'pro-move-left': 'Move a little to your left to fit in the frame.',
  'pro-move-right': 'Move a little to your right to fit in the frame.',
  'pro-center-frame': 'Move toward the center of the frame.',
  'pro-find-brighter-light': 'Try a brighter spot so your pose is easier to see.',
  'pro-turn-toward-light': 'Turn toward the light so your pose is easier to see.',
  'pro-find-frame': 'Step into the frame so I can see your pose.',
  'starter-relax-shoulders': 'Relax your shoulders down.',
  'starter-raise-shoulders': 'Raise your shoulders a bit.',
  'starter-level-shoulders': 'Level your shoulders.',
  'starter-sit-straighter': 'Sit up straighter.',
  'starter-shift-weight-right': 'Shift your weight to the right.',
  'starter-shift-weight-left': 'Shift your weight to the left.',
  'starter-lower-arms': 'Lower your arms a bit.',
  'starter-raise-arms': 'Raise your arms higher.',
  'starter-bring-arms-in': 'Bring your arms in closer.',
  'starter-hands-down': 'Move your hands down.',
  'starter-hands-up': 'Move your hands up.',
  'starter-hands-right': 'Move your hands to the right.',
  'starter-hands-left': 'Move your hands to the left.',
  'starter-straighten-knees': 'Straighten your knees.',
  'starter-bend-knees': 'Bend your knees more.',
  'starter-adjust-stance': 'Adjust your stance.',
  'starter-adjust-pose': 'Make a small adjustment to your pose.',
} as const;

export type VoiceCueId = keyof typeof VOICE_CUE_TEXT;

export const PRO_CUE_IDS = [
  'pro-ready',
  'pro-pose-intro',
  'pro-pose-match',
  'pro-step-closer',
  'pro-step-back',
  'pro-move-left',
  'pro-move-right',
  'pro-center-frame',
  'pro-find-brighter-light',
  'pro-turn-toward-light',
  'pro-find-frame',
] as const satisfies readonly VoiceCueId[];

export const PRO_CUE_SET: ReadonlySet<VoiceCueId> = new Set(PRO_CUE_IDS);

const CORRECTION_CUES: Readonly<Record<string, VoiceCueId>> = {
  'Relax your shoulders down': 'starter-relax-shoulders',
  'Raise your shoulders a bit': 'starter-raise-shoulders',
  'Level your shoulders': 'starter-level-shoulders',
  'Sit up straighter': 'starter-sit-straighter',
  'Shift your weight to the right': 'starter-shift-weight-right',
  'Shift your weight to the left': 'starter-shift-weight-left',
  'Lower your arms a bit': 'starter-lower-arms',
  'Raise your arms higher': 'starter-raise-arms',
  'Bring your arms in closer': 'starter-bring-arms-in',
  'Move your hands down': 'starter-hands-down',
  'Move your hands up': 'starter-hands-up',
  'Move your hands to the right': 'starter-hands-right',
  'Move your hands to the left': 'starter-hands-left',
  'Straighten your knees': 'starter-straighten-knees',
  'Bend your knees more': 'starter-bend-knees',
  'Adjust your stance': 'starter-adjust-stance',
};

export function getCorrectionCue(message: string): VoiceCueId {
  return CORRECTION_CUES[message] ?? 'starter-adjust-pose';
}
