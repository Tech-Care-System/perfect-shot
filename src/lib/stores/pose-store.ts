import type { PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import type { PoseHint, PosePreset, SceneType, TargetPose } from '@/lib/types/pose.types';
import type { WorkerErrorDetail } from '@/lib/types/error.types';
import { POSES_BY_SCENE } from '@/data/poses';
import { atom } from 'jotai';

/**
 * High-frequency atom for pose detection results.
 * Updated via Jotai's store.set to bypass React's render cycle for performance.
 * Landmark coordinates are normalized (0.0 to 1.0).
 */
export const poseResultAtom = atom<PoseLandmarkerResult | null>(null);

/**
 * Current performance metrics for pose detection in frames per second.
 * Updated periodically (~1s interval) by the AI worker's FPS_UPDATE messages.
 */
export const poseFpsAtom = atom<number>(0);

/**
 * Whether pose detection has been lost (no valid landmarks for > 3 seconds).
 * Consumers can use this to show a non-intrusive "step into frame" notification.
 */
export const detectionLostAtom = atom<boolean>(false);

/**
 * Whether the subject is too far from the camera for reliable pose detection.
 * Set by useDistanceDetection when torso height falls below SUBJECT_TOO_FAR_TORSO_HEIGHT.
 */
export const subjectTooFarAtom = atom<boolean>(false);

/**
 * User-facing framing warning message (e.g., "Move left to fit in frame") or null when OK.
 * Set by useFramingDetection when key landmarks are near horizontal frame edges.
 */
export const subjectFramingAtom = atom<string | null>(null);

/**
 * Whether lighting conditions are poor based on average landmark visibility.
 * Set by useLightingDetection when average visibility falls below LIGHTING_VISIBILITY_THRESHOLD.
 */
export const lightingPoorAtom = atom<boolean>(false);

/**
 * Non-null when the detection system has failed and recovery was unsuccessful.
 * Consumers can use this to show an error toast or fallback UI.
 */
export const detectionErrorAtom = atom<string | WorkerErrorDetail | null>(null);

/**
 * Signal atom to trigger a manual retry of the detection system.
 * Increment this number to signal a retry attempt.
 */
export const detectionRetrySignalAtom = atom<number>(0);

/**
 * The target pose to match against. Null until a pose is loaded (Epic 4).
 * Read via ref in usePoseDetection to avoid stale closures.
 */
export const targetPoseAtom = atom<TargetPose | null>(null);

/**
 * Cosine similarity score (0.0–1.0) between the user's detected pose and the target.
 * Updated at detection frame rate (~30 FPS). Remains 0 when no target or no landmarks.
 */
export const poseScoreAtom = atom<number>(0);

/**
 * Display metadata for the currently selected pose (name + action hint).
 * Null until a pose is selected (Epic 4). Read by PoseHintCard for overlay display.
 */
export const poseHintAtom = atom<PoseHint | null>(null);

/**
 * Single corrective suggestion string for the most impactful body segment deviation.
 * Updated at detection frame rate. Null when score >= 0.90, no target, or no landmarks.
 */
export const poseCorrectionAtom = atom<string | null>(null);

/**
 * Currently selected scene type for pose filtering.
 * Changing this causes availablePosesAtom to recompute automatically.
 */
export const selectedSceneAtom = atom<SceneType>('standing');

/**
 * The currently selected PosePreset, or null if no pose is active.
 * Set only via selectPoseAtom to keep targetPoseAtom and poseHintAtom in sync.
 */
export const currentPoseAtom = atom<PosePreset | null>(null);

/**
 * Derived read-only atom returning PosePreset[] for the current selectedSceneAtom.
 * Subscribers re-render only when the scene changes.
 */
export const availablePosesAtom = atom((get) => {
  const scene = get(selectedSceneAtom);
  return POSES_BY_SCENE[scene];
});

/**
 * Write-only action atom that atomically syncs currentPoseAtom, targetPoseAtom,
 * and poseHintAtom. Pass a PosePreset to select, or null to clear all three.
 */
export const selectPoseAtom = atom(null, (get, set, pose: PosePreset | null) => {
  set(currentPoseAtom, pose);
  if (pose) {
    set(targetPoseAtom, pose.targetLandmarks);
    set(poseHintAtom, { name: pose.name, hint: pose.actionHint });
  } else {
    set(targetPoseAtom, null);
    set(poseHintAtom, null);
  }
});

export const nextPoseAtom = atom(null, (get, set) => {
  const scene = get(selectedSceneAtom);
  const poses = POSES_BY_SCENE[scene];
  if (poses.length === 0) return;
  const currentPose = get(currentPoseAtom);
  const currentIndex = currentPose
    ? poses.findIndex((p) => p.id === currentPose.id)
    : -1;
  const nextIndex = (currentIndex + 1) % poses.length;
  set(poseScoreAtom, 0);
  set(poseCorrectionAtom, null);
  set(selectPoseAtom, poses[nextIndex]);
});
