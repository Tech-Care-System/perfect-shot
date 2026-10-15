# Story 5.1: Subject Distance Detection

Status: done

## Story

As a user,
I want to be told if I'm too far from the camera,
so that I can move closer for better pose detection.

## Acceptance Criteria

1. **AC1: Distance Detection Utility** — A pure function `detectSubjectDistance(landmarks)` returns `'ok' | 'too-far'` based on the torso height (shoulder midpoint to hip midpoint in normalized Y coordinates). If torso height < `SUBJECT_TOO_FAR_TORSO_HEIGHT` (0.10), the subject is too far. Returns `'ok'` for invalid/missing landmarks (fail-open).

2. **AC2: Distance State Atom** — A `subjectTooFarAtom: atom<boolean>(false)` in `pose-store.ts` tracks whether the subject is currently too far. Follows existing atom naming convention (`[feature][Field]Atom`).

3. **AC3: Distance Detection Hook** — A `useDistanceDetection()` hook subscribes to `poseResultAtom` and writes to `subjectTooFarAtom`. Samples every `DISTANCE_SAMPLE_INTERVAL_MS` (500ms). Requires `DISTANCE_TOO_FAR_DEBOUNCE` (2) consecutive "too-far" readings to set the atom to `true`. Clears to `false` immediately on a single "ok" reading (asymmetric debounce: slow to warn, fast to clear).

4. **AC4: Warning Display** — A `SubjectDistanceWarning` component reads `subjectTooFarAtom`. When `true`, displays "Step closer to the camera" in the same visual area as `PoseCorrectionPrompt` (top-1/3, centered). Uses encouraging language, not error styling. The message uses `bg-black/60 backdrop-blur-sm` pill styling consistent with `PoseCorrectionPrompt`.

5. **AC5: Correction Suppression** — `PoseCorrectionPrompt` reads `subjectTooFarAtom` and returns `null` when the subject is too far. Distance warning takes priority over pose corrections (corrections are meaningless when too far).

6. **AC6: Warning Dismissal** — The warning disappears when the subject moves to an appropriate distance (torso height >= threshold). The hook clears `subjectTooFarAtom` immediately (no debounce for clearing).

7. **AC7: CameraScreen Integration** — `useDistanceDetection()` is called in `CameraScreen` alongside `useSceneDetection()`. `SubjectDistanceWarning` is rendered in the camera view area.

## Tasks / Subtasks

- [x] Task 1 (AC: #1)
  - [x] 1.1 Create `src/lib/utils/detect-distance.ts` with `detectSubjectDistance(landmarks: NormalizedLandmark[]): 'ok' | 'too-far'`
  - [x] 1.2 Create `src/lib/utils/detect-distance.test.ts` with threshold boundary tests
- [x] Task 2 (AC: #2)
  - [x] 2.1 Add `subjectTooFarAtom` to `src/lib/stores/pose-store.ts`
- [x] Task 3 (AC: #3)
  - [x] 3.1 Add `DISTANCE_SAMPLE_INTERVAL_MS` and `DISTANCE_TOO_FAR_DEBOUNCE` to `src/constants/app.constants.ts`
  - [x] 3.2 Create `src/lib/hooks/use-distance-detection.ts`
  - [x] 3.3 Create `src/lib/hooks/use-distance-detection.test.tsx`
- [x] Task 4 (AC: #4, #5)
  - [x] 4.1 Create `src/components/camera/subject-distance-warning.tsx`
  - [x] 4.2 Add `subjectTooFarAtom` early-return to `PoseCorrectionPrompt`
- [x] Task 5 (AC: #7)
  - [x] 5.1 Wire `useDistanceDetection()` and `SubjectDistanceWarning` in `CameraScreen`

## Dev Notes

### Detection Algorithm

Reuse the same geometric approach as `detect-scene.ts` (torso height in normalized Y). The torso height is `Math.abs(midY(shoulderL, shoulderR) - midY(hipL, hipR))` where landmarks are in normalized coordinates (0.0-1.0).

```
Threshold: SUBJECT_TOO_FAR_TORSO_HEIGHT = 0.10
When torso < 10% of frame height → 'too-far'
When torso >= 10% of frame height → 'ok'
Invalid/missing landmarks → 'ok' (fail-open, don't nag)
```

Use the same landmark indices and visibility validation as `detect-scene.ts`:

- Shoulders: indices 11, 12
- Hips: indices 23, 24
- Minimum visibility: 0.1

The `detect-distance.ts` utility should be independent — do NOT import from `detect-scene.ts`. Both compute torso height independently to avoid coupling.

### Hook Pattern — Follow `useSceneDetection`

`useDistanceDetection()` follows the exact pattern of `use-scene-detection.ts`:

- Read `poseResultAtom` via `useAtomValue`
- Write `subjectTooFarAtom` via `useSetAtom`
- Use `useEffect` on `poseResult` changes
- Throttle via `lastSampleTimeRef` + `DISTANCE_SAMPLE_INTERVAL_MS`
- Debounce via buffer ref

**Key difference from scene detection**: Asymmetric debounce.

- To SET `true`: require `DISTANCE_TOO_FAR_DEBOUNCE` (2) consecutive "too-far" readings
- To SET `false`: immediate on first "ok" reading (clear buffer, set atom)

This gives responsive dismissal (user steps closer → warning gone instantly) while preventing flicker on boundary (user at threshold → needs 2 readings to warn).

### UI Component — `SubjectDistanceWarning`

Minimal component following `PoseCorrectionPrompt` visual pattern:

```
Location: src/components/camera/subject-distance-warning.tsx
Position: Same as PoseCorrectionPrompt — pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 z-20
Styling: bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm text-sm font-medium text-white
Content: "Step closer to the camera"
A11y: role="status" aria-live="polite"
```

Renders `null` when `subjectTooFarAtom` is `false`.

### PoseCorrectionPrompt Change

Add `subjectTooFarAtom` read and early return at `src/components/camera/pose-correction-prompt.tsx`:

```typescript
const subjectTooFar = useAtomValue(subjectTooFarAtom);
// ... existing code ...
if (!target || !displayedText || subjectTooFar) return null;
```

This is the only change to an existing component. It prevents showing corrections when the user is too far (corrections are meaningless at that distance).

### CameraScreen Wiring

In `src/components/screens/camera-screen.tsx`:

```typescript
import { useDistanceDetection } from '@/lib/hooks/use-distance-detection';
import { SubjectDistanceWarning } from '@/components/camera/subject-distance-warning';

// Inside CameraScreen:
useDistanceDetection();

// In JSX, alongside existing overlays:
<SubjectDistanceWarning />
```

### Constants — `app.constants.ts`

Add two constants following existing naming pattern:

```typescript
export const DISTANCE_SAMPLE_INTERVAL_MS = 500;
export const DISTANCE_TOO_FAR_DEBOUNCE = 2;
```

### Test Fixtures — Retro AI-1: Realistic Landmarks

Test fixtures MUST use anatomically plausible landmark positions validated against the threshold (0.10). Examples:

**"Too far" fixture** — torso height < 0.10:

```typescript
// Shoulders at y=0.45, hips at y=0.52 → torso height = 0.07
setLandmark(lm, 11, 0.48, 0.45); // left shoulder
setLandmark(lm, 12, 0.52, 0.45); // right shoulder
setLandmark(lm, 23, 0.49, 0.52); // left hip
setLandmark(lm, 24, 0.51, 0.52); // right hip
```

**"OK distance" fixture** — torso height >= 0.10 (reuse `createStandingLandmarks` from existing tests):

```typescript
// Shoulders at y=0.25, hips at y=0.50 → torso height = 0.25
```

**Boundary test** — torso height exactly at 0.10:

```typescript
// Shoulders at y=0.45, hips at y=0.55 → torso height = 0.10 → 'ok' (>=)
```

### Project Structure Notes

| File                              | Action   | Location Rationale                                              |
| --------------------------------- | -------- | --------------------------------------------------------------- |
| `detect-distance.ts`              | New      | `lib/utils/` — pure utility function, follows `detect-scene.ts` |
| `detect-distance.test.ts`         | New      | Co-located with source                                          |
| `use-distance-detection.ts`       | New      | `lib/hooks/` — follows `use-scene-detection.ts`                 |
| `use-distance-detection.test.tsx` | New      | Co-located with source                                          |
| `subject-distance-warning.tsx`    | New      | `components/camera/` — follows other camera overlay components  |
| `pose-store.ts`                   | Modified | Add 1 atom                                                      |
| `app.constants.ts`                | Modified | Add 2 constants                                                 |
| `pose-correction-prompt.tsx`      | Modified | Add 1 atom read + early return condition                        |
| `camera-screen.tsx`               | Modified | Wire hook + component                                           |

### Epic 4 Retro Enforcement

| Retro Item                        | Enforcement in This Story                                                                                                                                                                      |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1**: Realistic Test Fixtures | Distance test fixtures must have anatomically plausible landmark Y values. Validate fixture torso height against 0.10 threshold before committing.                                             |
| **AI-2**: Hook Composition Rule   | `useDistanceDetection` reads `poseResultAtom` and `subjectTooFarAtom` directly via `useAtomValue`/`useSetAtom`. Does NOT call `useSceneDetection`, `usePoseLibrary`, or any other custom hook. |
| **AI-3**: API Consistency         | `subjectTooFarAtom` follows `[feature][Field]Atom` naming. Boolean type matches `detectionLostAtom` pattern.                                                                                   |
| **AI-4**: Test Assertion Depth    | Tests must verify actual threshold boundary behavior (0.09 → too-far, 0.10 → ok), debounce count behavior, and atom state values — not just that the function returns something.               |

### DO NOT

- Do NOT import from `detect-scene.ts` in `detect-distance.ts` — keep utilities independent
- Do NOT modify `usePoseDetection` — distance detection is a separate concern wired at CameraScreen level
- Do NOT modify `useSceneDetection` — it doesn't know about distance
- Do NOT add distance-based gating to the pose detection loop — detection should continue running even when too far
- Do NOT use error styling (red, alert icons) — the AC requires encouraging, friendly language
- Do NOT add "first detection bypass" like `useSceneDetection` — distance warning doesn't need immediate-first-frame behavior
- Do NOT nest hooks — the hook reads atoms directly (AI-2 from retro)

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-5-subject-detection-edge-case-handling.md] Story 5.1 ACs
- [Source: _bmad-output/implementation-artifacts/epic-4-retro.md] Retro action items AI-1 through AI-4
- [Source: src/lib/utils/detect-scene.ts] Torso height calculation pattern (lines 72-87), landmark validation
- [Source: src/lib/hooks/use-scene-detection.ts] Hook pattern — atom reads, throttle, debounce buffer
- [Source: src/lib/stores/pose-store.ts] Atom conventions, detectionLostAtom boolean pattern
- [Source: src/components/camera/pose-correction-prompt.tsx] Visual styling, positioning, a11y attributes
- [Source: src/components/screens/camera-screen.tsx] Hook wiring pattern (lines 22-24), component rendering (lines 56-64)
- [Source: src/constants/app.constants.ts] Constant naming pattern (SCENE_SAMPLE_INTERVAL_MS, SCENE_DEBOUNCE_COUNT)
- [Source: _bmad-output/project-context.md] File naming, atom naming, hook naming, test placement conventions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no issues encountered.

### Completion Notes List

- Task 1: `detectSubjectDistance` pure function with independent landmark validation (not importing from detect-scene). 10 unit tests covering threshold boundary (0.09 too-far, 0.10 ok), fail-open behavior, and visibility edge cases.
- Task 2: `subjectTooFarAtom` added following `detectionLostAtom` boolean pattern.
- Task 3: Constants added (`SUBJECT_TOO_FAR_TORSO_HEIGHT`, `DISTANCE_SAMPLE_INTERVAL_MS`, `DISTANCE_TOO_FAR_DEBOUNCE`). Hook follows `useSceneDetection` pattern with asymmetric debounce: 2 consecutive too-far readings to set true, immediate clear on ok. 7 unit tests covering debounce, throttle, and reset behavior.
- Task 4: `SubjectDistanceWarning` renders "Step closer to the camera" pill with matching PoseCorrectionPrompt styling. `PoseCorrectionPrompt` returns null when `subjectTooFarAtom` is true.
- Task 5: `useDistanceDetection()` called in CameraScreen alongside `useSceneDetection()`. `SubjectDistanceWarning` rendered in camera view area.

### Change Log

- Implemented subject distance detection — utility, atom, hook, warning component, correction suppression, and CameraScreen wiring.
- Code review fixes — added JSDoc to subjectTooFarAtom, created SubjectDistanceWarning unit tests, added CameraScreen integration test for SubjectDistanceWarning rendering, added explicit jest.mock entries for useDistanceDetection/useSceneDetection/usePoseLibrary in camera-screen.test.tsx, fixed Next Pose test to use proper usePoseLibrary mock.

### File List

- src/lib/utils/detect-distance.ts (new)
- src/lib/utils/detect-distance.test.ts (new)
- src/lib/hooks/use-distance-detection.ts (new)
- src/lib/hooks/use-distance-detection.test.tsx (new)
- src/components/camera/subject-distance-warning.tsx (new)
- src/components/camera/subject-distance-warning.test.tsx (new)
- src/lib/stores/pose-store.ts (modified)
- src/constants/app.constants.ts (modified)
- src/components/camera/pose-correction-prompt.tsx (modified)
- src/components/screens/camera-screen.tsx (modified)
- src/components/screens/camera-screen.test.tsx (modified)
