# Story 4.2: Pose Loading and State Management

Status: done

## Story

As a developer,
I want poses loaded into Jotai state for reactive updates,
so that the UI responds instantly to pose changes.

## Acceptance Criteria

1. **AC1: Available Poses Atom** — A derived read-only atom `availablePosesAtom` exists in `src/lib/stores/pose-store.ts`. It returns `PosePreset[]` filtered from `POSES_BY_SCENE` based on the current value of `selectedSceneAtom`. When `selectedSceneAtom` changes, `availablePosesAtom` recomputes automatically.

2. **AC2: Selected Scene Atom** — A writable atom `selectedSceneAtom` exists in `src/lib/stores/pose-store.ts` with type `SceneType` and default value `'standing'`. Changing this atom causes `availablePosesAtom` to recompute.

3. **AC3: Current Pose Atom** — A writable atom `currentPoseAtom` exists in `src/lib/stores/pose-store.ts` with type `PosePreset | null` and default value `null`.

4. **AC4: Select Pose Action Atom** — A write-only action atom `selectPoseAtom` exists in `src/lib/stores/pose-store.ts`. When called with a `PosePreset`, it atomically sets `currentPoseAtom`, `targetPoseAtom` (from `pose.targetLandmarks`), and `poseHintAtom` (from `{ name: pose.name, hint: pose.actionHint }`). When called with `null`, all three are set to `null`. This is the ONLY way to change the current pose — never set `currentPoseAtom` directly.

5. **AC5: usePoseLibrary Hook** — A custom hook `usePoseLibrary` exists in `src/lib/hooks/use-pose-library.ts`. It exposes: `selectedScene`, `availablePoses`, `currentPose`, `selectPose(pose)`, `selectScene(scene)`, `nextPose()`. Calling `selectScene` sets `selectedSceneAtom`, resets `poseScoreAtom` to 0, resets `poseCorrectionAtom` to null, and auto-selects the first pose from the new scene via `selectPoseAtom`. Calling `nextPose` cycles to the next pose in `availablePoses` (wraps to index 0 after the last).

6. **AC6: Default Initialization** — On first render of a component using `usePoseLibrary`, if `currentPoseAtom` is `null`, the hook auto-selects the first pose from the default scene (`'standing'`). This ensures the wireframe overlay, feedback glow, and hint card are active immediately without user intervention.

7. **AC7: Efficient Re-renders** — Components consuming `availablePosesAtom` only re-render when the scene changes. Components consuming `currentPoseAtom` only re-render when the selected pose changes. The high-frequency `poseScoreAtom` and `poseCorrectionAtom` are NOT affected by pose selection (they continue updating at detection frame rate).

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2, #3, #4)
  - [x] 1.1 Add `selectedSceneAtom` to `src/lib/stores/pose-store.ts`
  - [x] 1.2 Add `currentPoseAtom` to `src/lib/stores/pose-store.ts`
  - [x] 1.3 Add `availablePosesAtom` (derived) to `src/lib/stores/pose-store.ts`
  - [x] 1.4 Add `selectPoseAtom` (write-only action) to `src/lib/stores/pose-store.ts`
- [x] Task 2 (AC: #5, #6)
  - [x] 2.1 Create `src/lib/hooks/use-pose-library.ts`
  - [x] 2.2 Implement `selectScene` with auto-select first pose and score/correction reset
  - [x] 2.3 Implement `nextPose` with wrap-around cycling
  - [x] 2.4 Implement auto-initialization on first render when `currentPoseAtom` is null
- [x] Task 3 (AC: ALL)
  - [x] 3.1 Create `src/lib/stores/pose-store.test.ts` for new atoms
  - [x] 3.2 Test: `availablePosesAtom` returns correct poses for each scene type
  - [x] 3.3 Test: `selectPoseAtom` syncs `currentPoseAtom`, `targetPoseAtom`, `poseHintAtom`
  - [x] 3.4 Test: `selectPoseAtom(null)` clears all three atoms
  - [x] 3.5 Create `src/lib/hooks/use-pose-library.test.tsx`
  - [x] 3.6 Test: `selectScene` changes available poses and auto-selects first
  - [x] 3.7 Test: `selectScene` resets score and correction
  - [x] 3.8 Test: `nextPose` cycles through available poses and wraps
  - [x] 3.9 Test: auto-initialization selects first standing pose when currentPose is null

## Dev Notes

### New Atoms in `pose-store.ts`

Add these atoms below the existing `poseCorrectionAtom`:

```typescript
import { POSES_BY_SCENE } from "@/data/poses";
import type { PosePreset, SceneType } from "@/lib/types/pose.types";

export const selectedSceneAtom = atom<SceneType>("standing");

export const currentPoseAtom = atom<PosePreset | null>(null);

export const availablePosesAtom = atom((get) => {
  const scene = get(selectedSceneAtom);
  return POSES_BY_SCENE[scene];
});

export const selectPoseAtom = atom(
  null,
  (get, set, pose: PosePreset | null) => {
    set(currentPoseAtom, pose);
    if (pose) {
      set(targetPoseAtom, pose.targetLandmarks);
      set(poseHintAtom, { name: pose.name, hint: pose.actionHint });
    } else {
      set(targetPoseAtom, null);
      set(poseHintAtom, null);
    }
  },
);
```

`selectPoseAtom` is a write-only action atom (first arg `null` means no read value). It encapsulates the sync logic at the store level so consumers never set `targetPoseAtom` or `poseHintAtom` directly.

`availablePosesAtom` is a derived read-only atom. Jotai tracks its dependency on `selectedSceneAtom` automatically — subscribers re-render only when the scene changes.

### Hook Pattern: `use-pose-library.ts`

```typescript
export function usePoseLibrary() {
  const [selectedScene, setSelectedScene] = useAtom(selectedSceneAtom);
  const availablePoses = useAtomValue(availablePosesAtom);
  const currentPose = useAtomValue(currentPoseAtom);
  const doSelectPose = useSetAtom(selectPoseAtom);
  const setPoseScore = useSetAtom(poseScoreAtom);
  const setPoseCorrection = useSetAtom(poseCorrectionAtom);

  const selectPose = useCallback(
    (pose: PosePreset) => {
      doSelectPose(pose);
    },
    [doSelectPose],
  );

  const selectScene = useCallback(
    (scene: SceneType) => {
      setSelectedScene(scene);
      setPoseScore(0);
      setPoseCorrection(null);
      const scenePoses = POSES_BY_SCENE[scene];
      doSelectPose(scenePoses[0] ?? null);
    },
    [setSelectedScene, setPoseScore, setPoseCorrection, doSelectPose],
  );

  const nextPose = useCallback(() => {
    if (availablePoses.length === 0) return;
    const currentIndex = currentPose
      ? availablePoses.findIndex((p) => p.id === currentPose.id)
      : -1;
    const nextIndex = (currentIndex + 1) % availablePoses.length;
    doSelectPose(availablePoses[nextIndex]);
  }, [availablePoses, currentPose, doSelectPose]);

  const hasInitRef = useRef(false);
  useEffect(() => {
    if (!hasInitRef.current && !currentPose) {
      doSelectPose(availablePoses[0] ?? null);
      hasInitRef.current = true;
    }
  }, [currentPose, doSelectPose, availablePoses]);

  return {
    selectedScene,
    availablePoses,
    currentPose,
    selectPose,
    selectScene,
    nextPose,
  };
}
```

The `selectScene` function reads from `POSES_BY_SCENE` directly (not from `availablePosesAtom`) because the derived atom hasn't updated yet within the same synchronous callback. This avoids stale-value bugs.

### Why `selectPoseAtom` Instead of Syncing in the Hook

The sync logic (currentPose → targetPose + poseHint) lives in the store-level action atom rather than the hook because:

1. Multiple consumers may select poses (this hook, future scene detection in 4.3, tests)
2. Atomic consistency — all three atoms update in one Jotai transaction
3. No risk of forgetting to sync when a new call site is added

### Existing Atom Consumers — No Changes Required

All existing consumers already handle null checks correctly:

- `FeedbackGlow` (`feedback-glow.tsx:75`): `if (!target) return null`
- `PoseCorrectionPrompt` (`pose-correction-prompt.tsx:61`): `if (!target || !displayedText) return null`
- `WireframeCanvas` (`wireframe-canvas.tsx:106`): guards on `targetPose && targetPose.length > 0`
- `PoseHintCard` (`pose-hint-card.tsx:9`): `if (!poseHint) return null`
- `usePoseDetection` (`use-pose-detection.ts:47-48`): reads `targetPoseAtom` via ref, guards on null

Once Story 4.2 sets `targetPoseAtom` via `selectPoseAtom`, these components will start rendering immediately. No component changes needed.

### Data Flow After This Story

```
usePoseLibrary.selectScene('standing')
  → selectedSceneAtom = 'standing'
  → availablePosesAtom recomputes (4 standing poses)
  → selectPoseAtom(standingPoses[0])
      → currentPoseAtom = PosePreset
      → targetPoseAtom = PosePreset.targetLandmarks
      → poseHintAtom = { name, hint }

usePoseDetection (existing, unchanged):
  → reads targetPoseAtom via ref
  → calculates similarity on each frame
  → updates poseScoreAtom, poseCorrectionAtom

UI consumers (existing, unchanged):
  → WireframeCanvas draws target wireframe
  → FeedbackGlow shows red/yellow/green
  → PoseHintCard shows pose name + action hint
  → PoseCorrectionPrompt shows correction text
```

### Where to Wire `usePoseLibrary`

Call `usePoseLibrary()` in `CameraScreen` (`src/components/screens/camera-screen.tsx`). The hook's auto-init effect will select the first standing pose on mount. No additional wiring is needed for this story — the existing atom consumers handle the rest.

```typescript
// In CameraScreen, add:
const { nextPose } = usePoseLibrary();
```

The `nextPose` function and `selectScene` are exposed for Story 4.3 (scene detection) and Story 4.4 (Next Pose button) to consume. For this story, only the auto-initialization fires.

### Testing Strategy

**Atom tests** (`pose-store.test.ts`): Use `createStore()` from Jotai for isolated atom testing without React rendering.

```typescript
import { createStore } from "jotai";
const store = createStore();
store.set(selectedSceneAtom, "sofa");
expect(store.get(availablePosesAtom)).toHaveLength(3);
```

**Hook tests** (`use-pose-library.test.ts`): Use `renderHook` from `@testing-library/react` with a Jotai `Provider` wrapping.

Mock `@/data/poses` to provide deterministic test data (2-3 poses per scene is sufficient).

### Previous Story Learnings

- **Story 4.1**: `PosePreset.targetLandmarks` is a `NormalizedLandmark[]` (33 elements). This is type-compatible with `targetPoseAtom: atom<TargetPose | null>` since `TargetPose = NormalizedLandmark[]`.
- **Story 4.1**: `PosePreset.actionHint` maps to `PoseHint.hint`, and `PosePreset.name` maps to `PoseHint.name`. The `PoseHintCard` already reads these fields from `poseHintAtom`.
- **Story 4.1**: `POSES_BY_SCENE` returns a `Record<SceneType, PosePreset[]>` — direct lookup by scene key, no filtering needed.
- **Story 3.1**: `calculatePoseSimilarity` is called in `usePoseDetection` with `targetPoseAtom` — once a pose is selected, similarity scoring activates automatically.
- **Story 3.2**: `FeedbackGlow` renders only when `targetPoseAtom` is non-null. Selecting a pose will instantly activate the glow overlay.
- **Story 3.5**: `generateCorrection` is called in `usePoseDetection` when score < `POSE_THRESHOLD`. Correction prompts activate automatically once a target pose is set.

### DO NOT

- Do NOT modify `usePoseDetection` — it already reads `targetPoseAtom` and handles scoring/correction.
- Do NOT modify any existing component (FeedbackGlow, WireframeCanvas, PoseHintCard, PoseCorrectionPrompt) — they already consume the atoms correctly.
- Do NOT add scene detection logic — that is Story 4.3.
- Do NOT add UI for the Next Pose button — that is Story 4.4.
- Do NOT add persistence (localStorage) for selected scene/pose — not in scope.
- Do NOT import poses in components — always go through atoms. Components must not import from `@/data/poses` directly.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-4-pose-library-ai-recommendation.md] Story 4.2 ACs
- [Source: _bmad-output/implementation-artifacts/4-1-pose-library-data-structure.md] Downstream consumer notes, PosePreset interface, POSES_BY_SCENE export
- [Source: src/lib/stores/pose-store.ts] Existing atoms: targetPoseAtom, poseHintAtom, poseScoreAtom, poseCorrectionAtom
- [Source: src/lib/types/pose.types.ts] PosePreset, SceneType, TargetPose, PoseHint types
- [Source: src/data/poses/index.ts] ALL_POSES, POSES_BY_SCENE exports
- [Source: src/lib/hooks/use-pose-detection.ts] targetPoseAtom read via ref (line 47-48)
- [Source: _bmad-output/planning-artifacts/architecture/implementation-patterns-consistency-rules.md] Jotai atom naming, hook naming, test co-location
- [Source: _bmad-output/project-context.md] Naming conventions, project structure, Jotai patterns

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Initial test run failed for hook test due to `.ts` extension containing JSX; renamed to `.test.tsx`
- All 19 test suites pass (141 tests), zero regressions

### Completion Notes List

- Added 4 new atoms to `pose-store.ts`: `selectedSceneAtom`, `currentPoseAtom`, `availablePosesAtom` (derived), `selectPoseAtom` (write-only action)
- All new atoms have JSDoc comments matching file conventions
- `selectPoseAtom` atomically syncs `currentPoseAtom`, `targetPoseAtom`, and `poseHintAtom` in a single Jotai transaction
- Created `usePoseLibrary` hook with `selectScene` (resets score/correction, auto-selects first pose), `nextPose` (wrap-around cycling), and auto-initialization on first render
- `selectScene` reads from `POSES_BY_SCENE` directly to avoid stale derived atom values within the same synchronous callback
- Wired `usePoseLibrary()` in CameraScreen for auto-initialization on mount
- 9 atom tests via `createStore()` (isolated, no React rendering)
- 9 hook tests via `renderHook` with Jotai `Provider` wrapper (including cross-scene nextPose cycling)
- Full regression suite: 19 suites, 142 tests, all pass

### Change Log

- Implemented Story 4.2 — pose loading atoms and usePoseLibrary hook with full test coverage
- Code review fixes — wired usePoseLibrary in CameraScreen, added JSDoc comments to new atoms, added cross-scene nextPose test

### File List

- `src/lib/stores/pose-store.ts` (modified — added selectedSceneAtom, currentPoseAtom, availablePosesAtom, selectPoseAtom)
- `src/lib/hooks/use-pose-library.ts` (new — usePoseLibrary hook)
- `src/lib/stores/pose-store.test.ts` (new — atom unit tests)
- `src/lib/hooks/use-pose-library.test.tsx` (new — hook unit tests)
- `src/components/screens/camera-screen.tsx` (modified — added usePoseLibrary call for auto-init)
