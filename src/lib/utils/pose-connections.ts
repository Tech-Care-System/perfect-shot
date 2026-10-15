export type PoseConnection = [number, number];

/**
 * Landmark index pairs for drawing a human skeleton with MediaPipe Pose.
 * https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker
 */
export const POSE_CONNECTIONS: PoseConnection[] = [
  // Upper body
  [11, 12], // shoulders
  [11, 13], // left upper arm
  [13, 15], // left lower arm
  [15, 17],
  [15, 19],
  [15, 21],
  [12, 14], // right upper arm
  [14, 16], // right lower arm
  [16, 18],
  [16, 20],
  [16, 22],

  // Torso and hips
  [11, 23],
  [12, 24],
  [23, 24],

  // Lower body
  [23, 25], // left thigh
  [25, 27], // left shin
  [27, 29],
  [27, 31],
  [24, 26], // right thigh
  [26, 28], // right shin
  [28, 30],
  [28, 32],
];
