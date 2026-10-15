# Story 5.2: Subject Framing Detection

Status: done

## Story

As a user,
I want to be told if part of my body is cut off by the frame,
so that I can adjust my position for full body tracking.

## Acceptance Criteria

1. **AC1: Framing Detection Utility** — A pure function `detectFraming(landmarks)` returns `'ok' | 'cut-left' | 'cut-right'` based on key landmark X positions relative to frame edges. If any shoulder/hip landmark's X is within `FRAMING_EDGE_THRESHOLD` (0.05) of the left edge (x < 0.05), returns `'cut-left'`. If within threshold of the right edge (x > 0.95), returns `'cut-right'`. If both sides are cut off, returns `'ok'` (ambiguous — defers to other detection). Returns `'ok'` for invalid/missing landmarks (fail-open).

2. **AC2: Framing State Atom** — A `subjectFramingAtom: atom<string | null>(null)` in `pose-store.ts` stores the user-facing warning message string (e.g., "Move left to fit in frame") or `null` when framing is OK. The message is pre-computed by the hook, including camera mirror adjustment.

3. **AC3: Framing Detection Hook** — A `useFramingDetection()` hook subscribes to `poseResultAtom` and `cameraFacingModeAtom`, writes to `subjectFramingAtom`. Samples every `FRAMING_SAMPLE_INTERVAL_MS` (500ms). Requires `FRAMING_DEBOUNCE_COUNT` (2) consecutive same-direction readings to set the atom. Clears to `null` immediately on a single `'ok'` reading. Resets the debounce counter when the direction changes (e.g., `'cut-left'` to `'cut-right'`).

4. **AC4: Camera Mirror Direction** — The hook adjusts the direction in the message based on `cameraFacingModeAtom`:
   - Back camera (`'environment'`): `cut-left` → "Move right to fit in frame", `cut-right` → "Move left to fit in frame"
   - Front camera (`'user'`): `cut-left` → "Move left to fit in frame", `cut-right` → "Move right to fit in frame"
     This accounts for the CSS mirror on the selfie camera — the message matches what the user sees on screen.

5. **AC5: Warning Display** — A `SubjectFramingWarning` component reads `subjectFramingAtom` and `subjectTooFarAtom`. Displays the message when `subjectFramingAtom` is non-null. Hides when `subjectTooFarAtom` is `true` (distance warning takes priority). Uses the same visual styling as `SubjectDistanceWarning`.

6. **AC6: Correction Suppression** — `PoseCorrectionPrompt` returns `null` when `subjectFramingAtom` is non-null (in addition to existing `subjectTooFar` check). Pose corrections are meaningless when key landmarks are cut off.

7. **AC7: Dynamic Updates** — The warning message updates dynamically as the user moves. Direction changes (left ↔ right) require debounce (2 readings), but clearing requires only 1 `'ok'` reading for responsive dismissal.

8. **AC8: CameraScreen Integration** — `useFramingDetection()` is called in `CameraScreen` alongside `useDistanceDetection()` and `useSceneDetection()`. `SubjectFramingWarning` is rendered in the camera view area.

## Tasks / Subtasks

- [x] Task 1 (AC: #1)
  - [x] 1.1 Create `src/lib/utils/detect-framing.ts` with `detectFraming(landmarks): 'ok' | 'cut-left' | 'cut-right'`
  - [x] 1.2 Create `src/lib/utils/detect-framing.test.ts` with edge boundary tests
- [x] Task 2 (AC: #2)
  - [x] 2.1 Add `subjectFramingAtom` to `src/lib/stores/pose-store.ts`
- [x] Task 3 (AC: #3, #4)
  - [x] 3.1 Add `FRAMING_EDGE_THRESHOLD`, `FRAMING_SAMPLE_INTERVAL_MS`, `FRAMING_DEBOUNCE_COUNT` to `src/constants/app.constants.ts`
  - [x] 3.2 Create `src/lib/hooks/use-framing-detection.ts`
  - [x] 3.3 Create `src/lib/hooks/use-framing-detection.test.tsx`
- [x] Task 4 (AC: #5, #6)
  - [x] 4.1 Create `src/components/camera/subject-framing-warning.tsx`
  - [x] 4.2 Create `src/components/camera/subject-framing-warning.test.tsx`
  - [x] 4.3 Add `subjectFramingAtom` suppression to `PoseCorrectionPrompt`
- [x] Task 5 (AC: #8)
  - [x] 5.1 Wire `useFramingDetection()` and `SubjectFramingWarning` in `CameraScreen`
  - [x] 5.2 Add mock and test for `SubjectFramingWarning` in `camera-screen.test.tsx`

## Dev Notes

### Detection Algorithm

Check whether key landmarks (shoulders, hips) are near the horizontal edges of the frame. MediaPipe returns landmarks in normalized coordinates (0.0-1.0), where x=0.0 is the frame's left edge and x=1.0 is the right edge.

```
Landmarks checked: shoulder L (11), shoulder R (12), hip L (23), hip R (24)
Threshold: FRAMING_EDGE_THRESHOLD = 0.05

If ANY landmark x < 0.05 → 'cut-left' (subject cut off at frame's left edge)
If ANY landmark x > 0.95 → 'cut-right' (subject cut off at frame's right edge)
If BOTH sides triggered → 'ok' (ambiguous — subject very close, defer to distance detection)
Otherwise → 'ok'
```

The utility returns frame-relative directions (`'cut-left'`/`'cut-right'`). The hook converts these to user-facing messages, adjusting for camera mirroring.

### Camera Mirror Logic

The direction in the user-facing message depends on whether CSS mirroring is applied (front camera):

| Frame Result | Back Camera (`environment`)  | Front Camera (`user`)        |
| ------------ | ---------------------------- | ---------------------------- |
| `cut-left`   | "Move right to fit in frame" | "Move left to fit in frame"  |
| `cut-right`  | "Move left to fit in frame"  | "Move right to fit in frame" |

**Reasoning:**

- Back camera (no CSS mirror): frame-left = screen-left. Subject cut on left → move right to center.
- Front camera (CSS `scaleX(-1)` mirror): frame-left = screen-RIGHT. Subject cut on screen-right → move left to center.

The hook reads `cameraFacingModeAtom` from `@/lib/stores/camera-store` (a direct atom read, not a hook call — compliant with retro AI-2).

### Utility Structure — Follow `detect-distance.ts`

`detect-framing.ts` follows the exact structure of `detect-distance.ts`:

```typescript
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { FRAMING_EDGE_THRESHOLD } from "@/constants/app.constants";

const MIN_VISIBILITY = 0.1;
const LM_SHOULDER_L = 11;
const LM_SHOULDER_R = 12;
const LM_HIP_L = 23;
const LM_HIP_R = 24;

// Same isValidLandmark and getLandmark helpers as detect-distance.ts
// (redeclare locally — do NOT import from detect-distance.ts)

export type FramingResult = "ok" | "cut-left" | "cut-right";

export function detectFraming(landmarks: NormalizedLandmark[]): FramingResult {
  // Validate, extract 4 landmarks, check X positions against threshold
}
```

### Hook Structure — Follow `use-distance-detection.ts`

`use-framing-detection.ts` follows the same throttle + debounce pattern, with two differences:

1. **Reads `cameraFacingModeAtom`** to compute the direction message.
2. **Tracks direction for debounce**: If the direction changes between samples (e.g., `'cut-left'` → `'cut-right'`), the debounce counter resets.

```typescript
export function useFramingDetection(): void {
  const poseResult = useAtomValue(poseResultAtom);
  const facingMode = useAtomValue(cameraFacingModeAtom);
  const setSubjectFraming = useSetAtom(subjectFramingAtom);

  const lastSampleTimeRef = useRef(0);
  const consecutiveCountRef = useRef(0);
  const lastResultRef = useRef<FramingResult>("ok");

  useEffect(() => {
    // Guard: valid landmarks
    // Guard: throttle (500ms)
    // detectFraming(landmarks) → result
    // If 'ok' → reset counter, clear atom immediately
    // If same direction as lastResult → increment counter, set atom if >= DEBOUNCE
    // If different direction → reset counter to 1, update lastResult
  }, [poseResult, facingMode, setSubjectFraming]);
}
```

### Message Conversion Helper

Inside the hook file (not exported — internal helper):

```typescript
function getFramingMessage(
  result: FramingResult,
  facingMode: string,
): string | null {
  if (result === "ok") return null;
  const isfront = facingMode === "user";
  if (result === "cut-left") {
    return isfront ? "Move left to fit in frame" : "Move right to fit in frame";
  }
  return isfront ? "Move right to fit in frame" : "Move left to fit in frame";
}
```

### Component — Follow `SubjectDistanceWarning`

`subject-framing-warning.tsx` follows the exact structure of `subject-distance-warning.tsx`:

```typescript
export function SubjectFramingWarning() {
  const framingMessage = useAtomValue(subjectFramingAtom);
  const subjectTooFar = useAtomValue(subjectTooFarAtom);

  if (!framingMessage || subjectTooFar) return null;

  return (
    <div
      data-testid="subject-framing-warning"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 z-20"
    >
      <p className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        {framingMessage}
      </p>
    </div>
  );
}
```

Note: Reads `subjectTooFarAtom` to hide when distance warning is active (distance takes priority).

### Warning Priority Chain

Three warning/feedback components share the same visual area. Priority order:

| Priority    | Condition                    | What Shows               | What Hides                                      |
| ----------- | ---------------------------- | ------------------------ | ----------------------------------------------- |
| 1 (highest) | `subjectTooFarAtom` = true   | `SubjectDistanceWarning` | `SubjectFramingWarning`, `PoseCorrectionPrompt` |
| 2           | `subjectFramingAtom` != null | `SubjectFramingWarning`  | `PoseCorrectionPrompt`                          |
| 3 (lowest)  | Normal flow                  | `PoseCorrectionPrompt`   | —                                               |

### PoseCorrectionPrompt Change

Add `subjectFramingAtom` read at `src/components/camera/pose-correction-prompt.tsx:3`:

```typescript
import {
  poseCorrectionAtom,
  subjectFramingAtom,
  subjectTooFarAtom,
  targetPoseAtom,
} from "@/lib/stores/pose-store";

// Inside component:
const subjectFraming = useAtomValue(subjectFramingAtom);

// Updated return condition (line 62):
if (!target || !displayedText || subjectTooFar || subjectFraming) return null;
```

### Constants — `app.constants.ts`

Add three constants, grouped after the distance detection section:

```typescript
// Framing detection
export const FRAMING_EDGE_THRESHOLD = 0.05;
export const FRAMING_SAMPLE_INTERVAL_MS = 500;
export const FRAMING_DEBOUNCE_COUNT = 2;
```

### CameraScreen Wiring

In `src/components/screens/camera-screen.tsx`:

```typescript
import { useFramingDetection } from '@/lib/hooks/use-framing-detection';
import { SubjectFramingWarning } from '@/components/camera/subject-framing-warning';

// Inside CameraScreen, alongside existing hooks:
useFramingDetection();

// In JSX, after SubjectDistanceWarning:
<SubjectFramingWarning />
```

### Test Fixtures — Retro AI-1: Realistic Landmarks

Test fixtures MUST use anatomically plausible landmark positions validated against the threshold (0.05).

**"Cut left" fixture** — landmark x < 0.05:

```typescript
// Left shoulder at x=0.03, right shoulder at x=0.13 → left side cut off
setLandmark(lm, 11, 0.03, 0.25); // left shoulder near left edge
setLandmark(lm, 12, 0.13, 0.25); // right shoulder in frame
setLandmark(lm, 23, 0.04, 0.5); // left hip near left edge
setLandmark(lm, 24, 0.14, 0.5); // right hip in frame
```

**"Cut right" fixture** — landmark x > 0.95:

```typescript
// Right shoulder at x=0.97 → right side cut off
setLandmark(lm, 11, 0.87, 0.25);
setLandmark(lm, 12, 0.97, 0.25); // near right edge
setLandmark(lm, 23, 0.86, 0.5);
setLandmark(lm, 24, 0.96, 0.5); // near right edge
```

**"Well framed" fixture** — all landmarks well within frame (reuse `createStandingLandmarks` pattern):

```typescript
// Shoulders at x=0.45/0.55, hips at x=0.46/0.54 → safely within frame
```

**"Both sides cut off" fixture** — returns 'ok':

```typescript
setLandmark(lm, 11, 0.02, 0.25); // left near left edge
setLandmark(lm, 12, 0.98, 0.25); // right near right edge
setLandmark(lm, 23, 0.03, 0.5);
setLandmark(lm, 24, 0.97, 0.5);
```

**Boundary test** — landmark at exactly 0.05:

```typescript
// x = 0.05 → NOT cut off (threshold is exclusive: x < 0.05 → cut)
setLandmark(lm, 11, 0.05, 0.25);
```

### Project Structure Notes

| File                               | Action   | Location Rationale                                            |
| ---------------------------------- | -------- | ------------------------------------------------------------- |
| `detect-framing.ts`                | New      | `lib/utils/` — pure utility, follows `detect-distance.ts`     |
| `detect-framing.test.ts`           | New      | Co-located with source                                        |
| `use-framing-detection.ts`         | New      | `lib/hooks/` — follows `use-distance-detection.ts`            |
| `use-framing-detection.test.tsx`   | New      | Co-located with source                                        |
| `subject-framing-warning.tsx`      | New      | `components/camera/` — follows `subject-distance-warning.tsx` |
| `subject-framing-warning.test.tsx` | New      | Co-located with source                                        |
| `pose-store.ts`                    | Modified | Add 1 atom                                                    |
| `app.constants.ts`                 | Modified | Add 3 constants                                               |
| `pose-correction-prompt.tsx`       | Modified | Add 1 atom read + early return condition                      |
| `camera-screen.tsx`                | Modified | Wire hook + component                                         |
| `camera-screen.test.tsx`           | Modified | Add mock + test                                               |

### Epic 4 Retro Enforcement

| Retro Item                        | Enforcement in This Story                                                                                                                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1**: Realistic Test Fixtures | Framing test fixtures must use plausible landmark X values. Validate against 0.05 threshold. Don't put landmarks at x=0.01 AND x=0.99 unless testing the "both sides" case.             |
| **AI-2**: Hook Composition Rule   | `useFramingDetection` reads atoms directly (`poseResultAtom`, `cameraFacingModeAtom`, `subjectFramingAtom`). Does NOT call `useCamera`, `useDistanceDetection`, or any other hook.      |
| **AI-3**: API Consistency         | `subjectFramingAtom` stores `string \| null` (matching `poseCorrectionAtom` pattern for dynamic messages). The atom name follows `[feature][Field]Atom`.                                |
| **AI-4**: Test Assertion Depth    | Tests must verify exact message strings ("Move left to fit in frame"), threshold boundary behavior (x=0.04 → cut, x=0.05 → ok), debounce counter behavior, and direction change resets. |

### Story 5.1 Learnings Applied

- **Zero debug issues** in Story 5.1. The detect-distance pattern is proven and this story replicates it.
- **Asymmetric debounce** pattern (slow to warn, fast to clear) carried forward from 5.1.
- **PoseCorrectionPrompt suppression** pattern from 5.1 extended — now checks both `subjectTooFar` and `subjectFraming`.
- **CameraScreen wiring** is additive — just add one hook call and one component, no changes to existing wiring.
- **SubjectDistanceWarning** component is the exact template for `SubjectFramingWarning`.

### DO NOT

- Do NOT import from `detect-distance.ts` — redeclare landmark helpers locally
- Do NOT call `useCamera()` or `useDistanceDetection()` from within `useFramingDetection()` — read atoms directly (AI-2)
- Do NOT check Y-axis (top/bottom) edges — the AC specifies "Move [left/right]" only
- Do NOT use error styling (red icons, alert) — keep the encouraging pill style
- Do NOT modify `SubjectDistanceWarning` or `useDistanceDetection` — they are independent
- Do NOT modify `usePoseDetection` — framing is a separate concern at CameraScreen level
- Do NOT add debounce for clearing the warning — AC requires responsive dismissal when "fully in frame"

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-5-subject-detection-edge-case-handling.md] Story 5.2 ACs
- [Source: _bmad-output/implementation-artifacts/5-1-subject-distance-detection.md] Previous story — detect-distance pattern, hook pattern, component pattern, all learnings
- [Source: _bmad-output/implementation-artifacts/epic-4-retro.md] Retro action items AI-1 through AI-4
- [Source: src/lib/utils/detect-distance.ts] Utility structure — landmark validation, fail-open, threshold comparison
- [Source: src/lib/hooks/use-distance-detection.ts] Hook structure — throttle + debounce, atom reads/writes
- [Source: src/components/camera/subject-distance-warning.tsx] Component structure — conditional render, a11y, styling
- [Source: src/lib/stores/pose-store.ts] Atom conventions — subjectTooFarAtom boolean, poseCorrectionAtom string|null
- [Source: src/lib/stores/camera-store.ts] cameraFacingModeAtom — needed for mirror direction
- [Source: src/components/camera/pose-correction-prompt.tsx:62] Current suppression logic — `subjectTooFar` check
- [Source: src/components/screens/camera-screen.tsx:26-27] Hook wiring pattern — useSceneDetection(), useDistanceDetection()
- [Source: src/components/screens/camera-screen.test.tsx:43-57] Mock pattern for hooks and components
- [Source: src/constants/app.constants.ts:19-22] Distance detection constants — naming pattern

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation, no issues encountered.

### Completion Notes List

- Task 1: `detectFraming` pure function checking shoulder/hip X positions against `FRAMING_EDGE_THRESHOLD` (0.05). Returns `'ok'` when both sides cut (ambiguous). 14 unit tests covering boundary behavior (0.04 cut, 0.05 ok), both-sides case, fail-open, and visibility edge cases.
- Task 2: `subjectFramingAtom` added as `atom<string | null>(null)` following `poseCorrectionAtom` pattern.
- Task 3: Constants added (`FRAMING_EDGE_THRESHOLD`, `FRAMING_SAMPLE_INTERVAL_MS`, `FRAMING_DEBOUNCE_COUNT`). Hook reads `cameraFacingModeAtom` directly for mirror-aware messages. Asymmetric debounce with direction change reset. 10 unit tests covering mirror logic, debounce, throttle, and direction changes.
- Task 4: `SubjectFramingWarning` renders dynamic message, hides when `subjectTooFarAtom` is true (distance priority). 6 component tests. `PoseCorrectionPrompt` returns null when `subjectFramingAtom` is non-null.
- Task 5: `useFramingDetection()` called in CameraScreen. `SubjectFramingWarning` rendered after `SubjectDistanceWarning`. Mock and test added to `camera-screen.test.tsx`.

### Change Log

- Implemented subject framing detection — utility, atom, hook with camera mirror logic, warning component with priority chain, correction suppression, and CameraScreen wiring.
- Code review fixes — added JSDoc to subjectFramingAtom, typed getFramingMessage with CameraFacingMode, added camera-flip effect for immediate message direction update, added test for PoseCorrectionPrompt framing suppression, added test for direction change after established warning, added test for camera-flip message update.

### File List

- src/lib/utils/detect-framing.ts (new)
- src/lib/utils/detect-framing.test.ts (new)
- src/lib/hooks/use-framing-detection.ts (new)
- src/lib/hooks/use-framing-detection.test.tsx (new)
- src/components/camera/subject-framing-warning.tsx (new)
- src/components/camera/subject-framing-warning.test.tsx (new)
- src/lib/stores/pose-store.ts (modified)
- src/constants/app.constants.ts (modified)
- src/components/camera/pose-correction-prompt.tsx (modified)
- src/components/screens/camera-screen.tsx (modified)
- src/components/camera/pose-correction-prompt.test.tsx (modified)
- src/components/screens/camera-screen.test.tsx (modified)
