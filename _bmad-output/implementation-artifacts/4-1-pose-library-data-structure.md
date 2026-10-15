# Story 4.1: Pose Library Data Structure

Status: done

## Story

As a developer,
I want a structured pose library with scene-tagged poses,
so that poses can be organized and filtered by scene type.

## Acceptance Criteria

1. **AC1: PosePreset Type** — A `PosePreset` interface exists in `src/lib/types/pose.types.ts` with fields: `id` (string), `name` (string), `actionHint` (string), `sceneType` (SceneType), and `targetLandmarks` (TargetPose). A `SceneType` union type covers `'solo-chair' | 'sofa' | 'standing' | 'stage'`.

2. **AC2: JSON Data Files** — JSON files exist in `src/data/poses/` for each scene type: `solo-chair.json`, `sofa.json`, `standing.json`, `stage.json`.

3. **AC3: Pose Count** — Each scene type has 3-4 poses (12-16 total across all files).

4. **AC4: Pose Content** — Each pose entry has all `PosePreset` fields populated. `targetLandmarks` is a 33-element array of `{ x, y, z, visibility }` matching MediaPipe `NormalizedLandmark` format. The 12 matching landmarks (indices 11-16, 23-28) have anatomically distinct positions per pose. Non-matching landmarks (0-10, 17-22, 29-32) have reasonable default positions.

5. **AC5: Type-Safe Export** — An `index.ts` file in `src/data/poses/` exports all poses with type safety: `ALL_POSES: PosePreset[]` and `POSES_BY_SCENE: Record<SceneType, PosePreset[]>`.

6. **AC6: Unique IDs** — Each pose has a unique `id` following the pattern `{sceneType}-{number}` (e.g., `standing-1`, `sofa-2`).

## Tasks / Subtasks

- [x] Task 1 (AC: #1)
  - [x] 1.1 Add `SceneType` union type to `src/lib/types/pose.types.ts`
  - [x] 1.2 Add `PosePreset` interface to `src/lib/types/pose.types.ts`
  - [x] 1.3 Add `SCENE_TYPES` constant array to `src/constants/app.constants.ts`
- [x] Task 2 (AC: #2, #3, #4, #6)
  - [x] 2.1 Create `src/data/poses/standing.json` with 4 standing pose presets
  - [x] 2.2 Create `src/data/poses/solo-chair.json` with 3 seated poses
  - [x] 2.3 Create `src/data/poses/sofa.json` with 3 sofa poses
  - [x] 2.4 Create `src/data/poses/stage.json` with 3 stage/presentation poses
- [x] Task 3 (AC: #5)
  - [x] 3.1 Create `src/data/poses/index.ts`
  - [x] 3.2 Import all JSON files with type assertions
  - [x] 3.3 Export `ALL_POSES` (flat array) and `POSES_BY_SCENE` (grouped by scene type)
- [x] Task 4 (AC: ALL)
  - [x] 4.1 Create `src/data/poses/poses.test.ts`
  - [x] 4.2 Test: ALL_POSES has 13 entries (4+3+3+3)
  - [x] 4.3 Test: POSES_BY_SCENE has all 4 scene types as keys
  - [x] 4.4 Test: every pose has non-empty id, name, actionHint, valid sceneType
  - [x] 4.5 Test: every pose targetLandmarks has exactly 33 elements
  - [x] 4.6 Test: all pose IDs are unique
  - [x] 4.7 Test: matching landmarks (indices 11-16, 23-28) have visibility >= 0.5

## Dev Notes

### Type Definitions

**Add to `src/lib/types/pose.types.ts`:**

```typescript
export type SceneType = "solo-chair" | "sofa" | "standing" | "stage";

export interface PosePreset {
  id: string;
  name: string;
  actionHint: string;
  sceneType: SceneType;
  targetLandmarks: TargetPose;
}
```

`targetLandmarks` reuses the existing `TargetPose` type (`NormalizedLandmark[]`). This keeps type compatibility with `targetPoseAtom`, `calculatePoseSimilarity`, and `WireframeCanvas` drawing — no adapter code needed.

**Add to `src/constants/app.constants.ts`:**

```typescript
export const SCENE_TYPES = ["solo-chair", "sofa", "standing", "stage"] as const;
```

### JSON File Structure

Each JSON file is an array of pose objects:

```json
[
  {
    "id": "standing-1",
    "name": "Power Stance",
    "actionHint": "Feet apart, hands on hips",
    "sceneType": "standing",
    "targetLandmarks": [
      { "x": 0.5, "y": 0.15, "z": 0, "visibility": 0.9 },
      ...33 total landmarks
    ]
  }
]
```

### Landmark Coordinate System

MediaPipe `NormalizedLandmark` uses:

- `x`: 0.0 (left edge) to 1.0 (right edge)
- `y`: 0.0 (top edge) to 1.0 (bottom edge)
- `z`: depth relative to hip midpoint (negative = closer to camera)
- `visibility`: 0.0 to 1.0 confidence

All coordinates are from the **camera's perspective** (not mirrored). Landmark 11 = person's left shoulder (appears on right side of unmirrored image).

### Landmark Index Reference (MediaPipe Pose, 33 total)

```
Head/Face (0-10):  0=nose, 1-4=eyes, 5-6=ears, 7-10=mouth
Upper Body (11-16): 11=L shoulder, 12=R shoulder, 13=L elbow, 14=R elbow, 15=L wrist, 16=R wrist
Hands (17-22):     17-18=L/R pinky, 19-20=L/R index, 21-22=L/R thumb
Lower Body (23-28): 23=L hip, 24=R hip, 25=L knee, 26=R knee, 27=L ankle, 28=R ankle
Feet (29-32):      29-30=L/R heel, 31-32=L/R foot index
```

### Pose Design Guidelines

Each pose MUST have anatomically distinct positions for the 12 matching landmarks (indices 11-16, 23-28). These are the only landmarks that affect the similarity score. The differences between poses should be large enough that `calculatePoseSimilarity` returns < 0.7 when comparing different poses.

**Standing poses (4):**

- `standing-1` "Power Stance" — feet wide, hands on hips (elbows out)
- `standing-2` "Relaxed Lean" — weight on one leg, one hand in pocket
- `standing-3` "Arms Crossed" — arms folded at chest height
- `standing-4` "Confident Walk" — mid-stride, one arm forward

**Solo chair poses (3):**

- `solo-chair-1` "Confident Sit" — leaning back, one arm on armrest
- `solo-chair-2` "Lean Forward" — elbows on knees, engaged posture
- `solo-chair-3` "Crossed Legs" — legs crossed, hands relaxed on lap

**Sofa poses (3):**

- `sofa-1` "Casual Lean" — leaning to one side, arm on sofa back
- `sofa-2` "Spread Out" — arms wide on sofa back, legs apart
- `sofa-3` "Cozy Curl" — legs tucked, leaning into corner

**Stage poses (3):**

- `stage-1` "Stage Power" — wide stance, arms open/gesturing
- `stage-2` "Speaker Point" — one arm pointing, other at side
- `stage-3` "Victory" — both arms raised above shoulders

For non-matching landmarks (head, hands, feet), use reasonable defaults relative to the body position. Head (0-10) centered above shoulders, hands (17-22) near wrists, feet (29-32) near ankles.

### Approximate Landmark Positions for a Neutral Standing Pose

Use this as a baseline and offset specific landmarks per pose:

```
y ≈ 0.12: nose (0)
y ≈ 0.10-0.14: eyes/ears (1-6)
y ≈ 0.15: mouth (7-10)
y ≈ 0.28: shoulders (11, 12)  x ≈ 0.42/0.58
y ≈ 0.42: elbows (13, 14)     x ≈ 0.38/0.62
y ≈ 0.55: wrists (15, 16)     x ≈ 0.36/0.64
y ≈ 0.55: hands (17-22)       x near wrists
y ≈ 0.58: hips (23, 24)       x ≈ 0.46/0.54
y ≈ 0.75: knees (25, 26)      x ≈ 0.45/0.55
y ≈ 0.90: ankles (27, 28)     x ≈ 0.44/0.56
y ≈ 0.92: feet (29-32)        x near ankles
```

Sitting poses shift hips up (y ≈ 0.50), knees forward (z more negative), and lower body landmarks closer together.

### Index.ts Export Pattern

```typescript
import type { PosePreset, SceneType } from "@/lib/types/pose.types";
import soloChairPoses from "./solo-chair.json";
import sofaPoses from "./sofa.json";
import standingPoses from "./standing.json";
import stagePoses from "./stage.json";

export const ALL_POSES: PosePreset[] = [
  ...(standingPoses as PosePreset[]),
  ...(soloChairPoses as PosePreset[]),
  ...(sofaPoses as PosePreset[]),
  ...(stagePoses as PosePreset[]),
];

export const POSES_BY_SCENE: Record<SceneType, PosePreset[]> = {
  standing: standingPoses as PosePreset[],
  "solo-chair": soloChairPoses as PosePreset[],
  sofa: sofaPoses as PosePreset[],
  stage: stagePoses as PosePreset[],
};
```

JSON imports require `resolveJsonModule: true` in `tsconfig.json` — this is enabled by default in Next.js.

### Downstream Consumers (DO NOT implement yet)

These atoms are set by Story 4.2, not this story. Listed for context:

- `targetPoseAtom` — set from `PosePreset.targetLandmarks` when a pose is selected
- `poseHintAtom` — set from `{ name: PosePreset.name, hint: PosePreset.actionHint }` when a pose is selected
- `currentPoseAtom` — tracks selected `PosePreset` (added in 4.2)
- `availablePosesAtom` — filtered by scene type (added in 4.2)

### DO NOT

- Do NOT create new atoms — this story is data structure only. Atoms come in Story 4.2.
- Do NOT modify `targetPoseAtom` or `poseHintAtom` — they already exist and will be populated in 4.2.
- Do NOT add scene detection logic — that is Story 4.3.
- Do NOT add UI for pose selection — that is Story 4.4.
- Do NOT use a `PoseLandmark` interface — use the existing `NormalizedLandmark` type from `@mediapipe/tasks-vision` (via `TargetPose`).
- Do NOT put pose data in `public/` — it's bundled statically via imports, not fetched.

### Previous Story Learnings

- **Story 3.1**: `MATCHING_LANDMARK_INDICES` excludes head (0-10) and hand detail (17-22). The similarity score is driven by the 12 body landmarks. Pose variations MUST differ primarily at these indices.
- **Story 3.1**: `extractMatchingLandmarks` rejects landmarks with `visibility < 0.1`. All matching landmarks in pose data must have `visibility >= 0.5`.
- **Story 3.4**: `PoseHint` type (`{ name, hint }`) already exists — `PosePreset` extends this concept with `sceneType` and `targetLandmarks`. When a pose is selected (Story 4.2), `name` → `PoseHint.name` and `actionHint` → `PoseHint.hint`.
- **Story 3.5**: Correction text is derived from landmark position differences. Poses should have clearly different limb positions to produce useful corrections.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-pose-library-ai-recommendation.md] Story 4.1 ACs
- [Source: _bmad-output/planning-artifacts/archive/architecture.md] PosePreset interface, data/poses/ structure, pose library design
- [Source: _bmad-output/planning-artifacts/ux-design/core-user-experience.md] Casual/fun tone for actionHint text
- [Source: src/lib/types/pose.types.ts] Existing TargetPose type and MATCHING_LANDMARK_INDICES
- [Source: src/lib/utils/calculate-similarity.ts] Normalization pipeline and landmark extraction

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (via Ami)

### Debug Log References

None — clean implementation, no issues encountered.

### Completion Notes List

- Added `SceneType` union and `PosePreset` interface to `pose.types.ts`
- `SceneType` derived from `SCENE_TYPES` constant to prevent drift
- Added `SCENE_TYPES` constant to `app.constants.ts`
- Created 13 pose presets across 4 scene types: standing (4), solo-chair (3), sofa (3), stage (3)
- Each pose has 33 landmarks with anatomically distinct body positions for the 12 matching indices
- All within-scene pose pairs have cosine similarity < 0.7 (max 0.69)
- Poses include z-depth values for 3D differentiation
- Poses use casual actionHint text and follow `{sceneType}-{number}` ID pattern
- Created `index.ts` with type-safe `ALL_POSES` and `POSES_BY_SCENE` exports
- 8 tests covering count, keys, fields, landmark count, unique IDs, ID pattern, visibility, and cross-pose distinguishability
- Full regression suite: 17 suites, 124 tests, all pass

### Change Log

- Implemented Story 4.1 — pose library types, data, and exports with tests
- Code review fixes — regenerated pose data for similarity < 0.7, derived SceneType from SCENE_TYPES, added ID pattern and distinguishability tests

### File List

- src/lib/types/pose.types.ts (new — SceneType derived from SCENE_TYPES, PosePreset, TargetPose, MATCHING_LANDMARK_INDICES)
- src/constants/app.constants.ts (modified — added SCENE_TYPES)
- src/data/poses/standing.json (new)
- src/data/poses/solo-chair.json (new)
- src/data/poses/sofa.json (new)
- src/data/poses/stage.json (new)
- src/data/poses/index.ts (new)
- src/data/poses/poses.test.ts (new)
