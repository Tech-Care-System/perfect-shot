# Story 4.3: Scene-Based Pose Recommendation

Status: done

## Story

As a user,
I want the AI to recommend a pose based on my environment,
so that I don't have to choose a pose myself.

## Acceptance Criteria

1. **AC1: Scene Detection Utility** — A pure function `detectScene(landmarks: NormalizedLandmark[]): SceneType` exists in `src/lib/utils/detect-scene.ts`. It analyzes the 33 MediaPipe landmarks to classify the user's posture as one of the four `SceneType` values (`'standing'`, `'solo-chair'`, `'sofa'`, `'stage'`). For MVP, it uses geometric heuristics on landmark positions (not object detection models). Returns `'standing'` when classification confidence is low or landmarks are insufficient.

2. **AC2: Seated vs Standing Classification** — The heuristic distinguishes standing from seated postures using the hip-knee-ankle geometry. When the user's knees are bent (hip-to-knee vertical distance is small relative to torso height), the function classifies as seated (`'solo-chair'` or `'sofa'`). When knees are straight, classifies as `'standing'` or `'stage'`.

3. **AC3: Scene Detection Hook** — A hook `useSceneDetection()` exists in `src/lib/hooks/use-scene-detection.ts`. It subscribes to `poseResultAtom`, runs `detectScene` at a throttled rate (not every frame — sample every ~2 seconds), and calls `usePoseLibrary().selectScene()` when the detected scene differs from `selectedSceneAtom`. Scene changes are debounced: the new scene must be consistent across 3 consecutive samples before triggering a scene switch.

4. **AC4: Automatic Pose Selection on Scene Change** — When the scene changes, `selectScene()` (from Story 4.2) automatically selects the first pose for the new scene, resets `poseScoreAtom` to 0 and `poseCorrectionAtom` to null, and updates `targetPoseAtom` and `poseHintAtom`. The recommended pose appears immediately without user selection.

5. **AC5: Pose Hint Card Shows Recommendation** — After scene detection selects a pose, `PoseHintCard` displays the recommended pose name and action hint. No changes to `PoseHintCard` are needed — it already reads from `poseHintAtom` (verified in Story 4.2).

6. **AC6: No Flicker** — Scene detection does not cause rapid scene switching. The 3-sample debounce (AC3) plus the ~2-second sampling interval means a scene change requires ~6 seconds of consistent new posture before triggering. If landmarks are lost (person leaves frame), the scene does NOT change — it holds the last known scene.

7. **AC7: Initial Scene Detection** — On first valid pose detection (when `currentPoseAtom` is still the auto-initialized default from `usePoseLibrary`), scene detection runs immediately (bypassing the normal sampling interval) so the user sees a relevant pose recommendation as quickly as possible.

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2)
  - [x] 1.1 Create `src/lib/utils/detect-scene.ts` with `detectScene` function
  - [x] 1.2 Implement seated vs standing heuristic using hip-knee-ankle geometry
  - [x] 1.3 Implement chair vs sofa distinction (torso lean angle — upright = chair, reclined = sofa)
  - [x] 1.4 Default `'stage'` for standing with wide lateral stance (shoulder width > threshold), else `'standing'`
- [x] Task 2 (AC: #3, #6, #7)
  - [x] 2.1 Create `src/lib/hooks/use-scene-detection.ts`
  - [x] 2.2 Subscribe to `poseResultAtom` and throttle scene classification to ~2s intervals
  - [x] 2.3 Implement 3-sample debounce buffer: only call `selectScene` when 3 consecutive samples agree on a new scene
  - [x] 2.4 Skip classification when no valid landmarks in `poseResultAtom` (hold last scene)
  - [x] 2.5 Implement first-detection bypass: run immediately on first valid result
- [x] Task 3 (AC: #4, #5)
  - [x] 3.1 Wire `useSceneDetection()` in `CameraScreen` (`src/components/screens/camera-screen.tsx`)
  - [x] 3.2 Verify pose auto-selection and hint card update work end-to-end (manual test)
- [x] Task 4 (AC: ALL)
  - [x] 4.1 Create `src/lib/utils/detect-scene.test.ts`
  - [x] 4.2 Test: standing landmarks → `'standing'`
  - [x] 4.3 Test: seated landmarks (bent knees) → `'solo-chair'`
  - [x] 4.4 Test: reclined seated landmarks → `'sofa'`
  - [x] 4.5 Test: wide stance standing → `'stage'`
  - [x] 4.6 Test: insufficient/invalid landmarks → `'standing'` (default)
  - [x] 4.7 Create `src/lib/hooks/use-scene-detection.test.tsx`
  - [x] 4.8 Test: debounce requires 3 consistent samples before scene change
  - [x] 4.9 Test: first-detection bypass triggers immediately
  - [x] 4.10 Test: lost landmarks do not change scene

## Dev Notes

### Scene Detection Heuristic Approach

Use the 12 matching landmarks already defined in `MATCHING_LANDMARK_INDICES` (`src/lib/types/pose.types.ts:21-28`): shoulders (11, 12), elbows (13, 14), wrists (15, 16), hips (23, 24), knees (25, 26), ankles (27, 28). These are the same landmarks used by `calculatePoseSimilarity`.

Key geometric signals:

| Signal                  | Landmarks                   | Standing                         | Seated                            |
| ----------------------- | --------------------------- | -------------------------------- | --------------------------------- |
| Hip-knee vertical ratio | hips(23,24) vs knees(25,26) | Large gap (knees far below hips) | Small gap (knees near hip height) |
| Knee angle              | hip→knee→ankle angle        | ~180° (straight)                 | ~90° (bent)                       |
| Hip Y position          | hips(23,24) normalized Y    | Lower value (higher in frame)    | Higher value (lower in frame)     |

Chair vs sofa: compare shoulder-hip angle relative to vertical. Upright torso (shoulders directly above hips) = `'solo-chair'`. Reclined torso (shoulders behind hips in Z or shoulders closer to hip Y level) = `'sofa'`.

Stage vs standing: `'stage'` when shoulder width (lateral distance between landmarks 11 and 12) exceeds a threshold relative to torso height, suggesting a wider/presentation stance. Otherwise `'standing'`.

### Function Signature and Location

```
src/lib/utils/detect-scene.ts

function detectScene(landmarks: NormalizedLandmark[]): SceneType
```

Takes the raw 33-landmark array from `poseResultAtom.landmarks[0]` (same as what `calculatePoseSimilarity` receives). Returns a `SceneType`. Pure function, no side effects, no atom access.

### Hook Architecture: `useSceneDetection`

```
src/lib/hooks/use-scene-detection.ts

function useSceneDetection(): void
```

No return value — this is a side-effect-only hook. Internal logic:

1. Subscribe to `poseResultAtom` via `useAtomValue`
2. Read `selectedSceneAtom` via `useAtomValue` to know current scene
3. Get `selectScene` from `usePoseLibrary()` (or use `useSetAtom(selectedSceneAtom)` + `useSetAtom(selectPoseAtom)` directly — see note below)
4. Use `useRef` for: last sample timestamp, debounce buffer (array of last 3 classifications), first-detection flag
5. On each `poseResultAtom` update:
   - If no valid landmarks, skip
   - If first detection flag is false AND `currentPoseAtom` was auto-initialized, run immediately and set flag
   - Else if `performance.now() - lastSampleTime < 2000`, skip
   - Run `detectScene(landmarks[0])`, push to debounce buffer
   - If all 3 buffer entries match AND differ from `selectedSceneAtom`, call `selectScene(newScene)`
   - Update `lastSampleTime`

**Hook dependency consideration**: Calling `usePoseLibrary()` inside `useSceneDetection` is fine — both are called in `CameraScreen`. However, to avoid circular re-render chains, prefer reading atoms directly (`useAtomValue(selectedSceneAtom)`) and only calling `selectScene` via a stable ref. The `selectScene` function from `usePoseLibrary` is already wrapped in `useCallback` with stable deps.

### Integration in CameraScreen

`CameraScreen` already calls `usePoseLibrary()`. Add `useSceneDetection()` call:

```typescript
// In CameraScreen, add:
useSceneDetection();
```

This is the ONLY wiring change. The hook handles everything internally.

### Constants

Add scene detection constants to `src/constants/app.constants.ts`:

```typescript
export const SCENE_SAMPLE_INTERVAL_MS = 2_000;
export const SCENE_DEBOUNCE_COUNT = 3;
```

### Existing Infrastructure — No Changes Needed

| Component/Module       | Why No Changes                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `usePoseLibrary`       | `selectScene()` already handles scene switch + auto-pose-select + score/correction reset |
| `PoseHintCard`         | Already reads `poseHintAtom` — displays automatically when pose is selected              |
| `WireframeCanvas`      | Already reads `targetPoseAtom` — draws new target wireframe automatically                |
| `FeedbackGlow`         | Already reads `poseScoreAtom` — resets to red after scene switch (score = 0)             |
| `PoseCorrectionPrompt` | Already reads `poseCorrectionAtom` — clears after scene switch                           |
| `usePoseDetection`     | Already processes frames and updates `poseResultAtom` — no change needed                 |
| `selectPoseAtom`       | Already atomically syncs `currentPoseAtom`, `targetPoseAtom`, `poseHintAtom`             |

### Data Flow After This Story

```
usePoseDetection (every frame):
  → poseResultAtom = PoseLandmarkerResult

useSceneDetection (every ~2s sample):
  → reads poseResultAtom
  → detectScene(landmarks[0]) → SceneType
  → debounce buffer: [sample1, sample2, sample3]
  → if 3 consecutive match AND differs from current scene:
      → selectScene(newScene)
        → selectedSceneAtom = newScene
        → availablePosesAtom recomputes
        → selectPoseAtom(newScenePoses[0])
            → currentPoseAtom = PosePreset
            → targetPoseAtom = PosePreset.targetLandmarks
            → poseHintAtom = { name, hint }
        → poseScoreAtom = 0
        → poseCorrectionAtom = null

UI updates automatically:
  → PoseHintCard shows new pose name + hint
  → WireframeCanvas draws new target wireframe
  → FeedbackGlow shows red (score reset to 0)
  → PoseCorrectionPrompt clears
```

### Testing Strategy

**Utility tests** (`detect-scene.test.ts`): Create fixture landmark arrays for each scene type. Use the real 33-landmark structure from `NormalizedLandmark`. Test edge cases: missing landmarks, low visibility, ambiguous postures.

**Hook tests** (`use-scene-detection.test.tsx`): Use `renderHook` with Jotai `Provider`. Mock `poseResultAtom` values. Use `vi.useFakeTimers()` or `performance.now` mocking to control sampling intervals. Verify debounce buffer behavior and that `selectScene` is only called after 3 consistent samples.

Test file naming follows project convention: co-located with source.

### Previous Story Learnings

- **Story 4.2**: `selectScene` reads from `POSES_BY_SCENE` directly (not from `availablePosesAtom`) to avoid stale derived atom values within the same synchronous callback.
- **Story 4.2**: Auto-initialization in `usePoseLibrary` uses `useRef(false)` flag to run only once. Scene detection should respect this — don't conflict with the init effect.
- **Story 4.2**: Hook tests use `renderHook` from `@testing-library/react` with a Jotai `Provider` wrapper. Follow the same pattern.
- **Story 4.1**: `POSES_BY_SCENE` returns a `Record<SceneType, PosePreset[]>` — every scene key has poses, so `selectScene` will always find at least one pose.
- **Story 3.1**: `calculatePoseSimilarity` uses `extractMatchingLandmarks` which requires visibility > 0.1. Scene detection should similarly guard against low-visibility landmarks.
- **Story 2.3**: `poseResultAtom` is updated at frame rate (~30 FPS). Scene detection must NOT run at this rate — throttle via timestamp check.

### DO NOT

- Do NOT add object detection or MobileNet — MVP uses landmark heuristics only.
- Do NOT modify `usePoseDetection` — scene detection is a separate concern reading from `poseResultAtom`.
- Do NOT modify `usePoseLibrary` — `selectScene()` already handles everything needed.
- Do NOT modify any existing component (PoseHintCard, WireframeCanvas, FeedbackGlow, PoseCorrectionPrompt) — they already consume the correct atoms.
- Do NOT add UI for manual scene selection — that is not in scope for this story.
- Do NOT persist detected scene to localStorage — not in scope.
- Do NOT run `detectScene` on every frame — throttle to ~2s intervals via timestamp ref.
- Do NOT change scene when landmarks are lost — hold the last known scene.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-pose-library-ai-recommendation.md] Story 4.3 ACs
- [Source: _bmad-output/implementation-artifacts/4-2-pose-loading-and-state-management.md] selectScene implementation, data flow, testing patterns
- [Source: src/lib/hooks/use-pose-detection.ts] poseResultAtom updates, frame processing loop
- [Source: src/lib/types/pose.types.ts] NormalizedLandmark, SceneType, MATCHING_LANDMARK_INDICES
- [Source: src/lib/stores/pose-store.ts] All atoms: poseResultAtom, selectedSceneAtom, currentPoseAtom, selectPoseAtom
- [Source: src/lib/hooks/use-pose-library.ts] selectScene, nextPose, auto-init logic
- [Source: src/lib/utils/calculate-similarity.ts] extractMatchingLandmarks pattern, landmark usage
- [Source: src/constants/app.constants.ts] SCENE_TYPES, POSE_THRESHOLD
- [Source: src/components/screens/camera-screen.tsx] Current CameraScreen composition, usePoseLibrary wiring
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md] Naming conventions, file patterns, test co-location

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (anthropic/claude-opus-4.6)

### Debug Log References

- Fixed sofa test fixture: reclined shoulders too close to hips in Y created tiny torso height, causing knee ratio to hit threshold boundary and fall through to stage classification. Adjusted to more realistic reclined posture with sufficient torso height.
- Fixed first-detection bypass: `usePoseLibrary()` auto-init sets `currentPoseAtom` before effects run, so checking `currentPose === null` never triggered. Simplified to track first valid frame via `hasFirstDetectionRef` only, matching AC7's intent of "first valid pose detection".

### Completion Notes List

- Task 1: Created `detectScene` pure function with geometric heuristics: seated/standing via hip-knee ratio + knee angle, chair/sofa via torso-lean-from-vertical angle, stage/standing via shoulder-width-to-torso ratio. Guards against low-visibility and missing landmarks.
- Task 2: Created `useSceneDetection` hook — subscribes to `poseResultAtom`, throttles to ~2s via `performance.now()` ref, 3-sample debounce buffer before scene switch, first-detection bypass for immediate initial classification. Uses `selectScene` from `usePoseLibrary` via stable ref.
- Task 3: Wired `useSceneDetection()` in `CameraScreen` — single line addition. All downstream components (PoseHintCard, WireframeCanvas, FeedbackGlow, PoseCorrectionPrompt) already consume the correct atoms and update automatically.
- Task 4: 9 unit tests for `detectScene` (standing, seated-chair, sofa, stage, edge cases) + 7 hook tests for `useSceneDetection` (debounce, throttle, first-detection bypass, lost landmarks, scene match).

### Change Log

- Implemented story 4.3 — scene-based pose recommendation with `detectScene` utility, `useSceneDetection` hook, CameraScreen wiring, and comprehensive tests. Added `SCENE_SAMPLE_INTERVAL_MS` and `SCENE_DEBOUNCE_COUNT` constants.
- Code review fixes — (1) Refactored `useSceneDetection` to use atoms directly instead of calling `usePoseLibrary()`, eliminating duplicate hook invocation and redundant auto-init in CameraScreen. (2) Fixed stage test fixture right ankle typo (x=0.92→0.60). (3) Lowered `RECLINED_TORSO_ANGLE_THRESHOLD` from 70° to 30° for practical sofa detection; updated test fixture to realistic posture. (4) Added missing test for knees-with-low-visibility code path.

### File List

- src/lib/utils/detect-scene.ts (new)
- src/lib/utils/detect-scene.test.ts (new)
- src/lib/hooks/use-scene-detection.ts (new)
- src/lib/hooks/use-scene-detection.test.tsx (new)
- src/constants/app.constants.ts (modified)
- src/components/screens/camera-screen.tsx (modified)
