# Story 5.4: Graceful Detection Failure

Status: done

## Story

As a user,
I want the app to handle detection failures gracefully,
so that I never feel stuck or frustrated.

## Acceptance Criteria

1. **AC1: Detection Failure Warning Component** — A `DetectionFailureWarning` component reads `detectionLostAtom`. When `true`, displays "Having trouble detecting you. Try better lighting." at `top-1/3` (same area as distance/framing/correction warnings). Uses `bg-black/60 backdrop-blur-sm` pill styling, `text-white`, `text-sm font-medium`. `data-testid="detection-failure-warning"`, `role="status"`, `aria-live="polite"`.

2. **AC2: Fix Detection-Loss Watchdog** — `usePoseDetection` currently sets `detectionLostAtom = false` and updates `lastPoseReceivedAtRef.current` on **every** POSE_RESULT, including empty-landmark results. This means the watchdog never fires when a person leaves the frame (only when the worker hangs). Fix: only update `lastPoseReceivedAtRef.current` and call `setDetectionLost(false)` when `response.payload.landmarks?.[0]?.length >= 33` (valid pose landmarks present). Empty-landmark POSE_RESULT no longer resets the watchdog clock, so the 3s timer correctly fires when no person is in frame.

3. **AC3: Priority Chain — Detection Failure Is Highest Priority** — When `detectionLostAtom = true`, all other `top-1/3` warnings are suppressed to avoid stacking:
   - `SubjectDistanceWarning` — add `detectionLostAtom` guard: return null when detection is lost
   - `SubjectFramingWarning` — add `detectionLostAtom` guard: return null when detection is lost
   - `PoseCorrectionPrompt` — add `detectionLostAtom` to the existing null-return condition
   - `LightingWarning` stays independent (it's at `top-4`, non-blocking — no change)

4. **AC4: Manual Shutter Always Available** — No code changes needed. `ControlBar` renders when `status === 'ready' || status === 'loading'` (camera-screen.tsx:79), which is independent of detection state. Verify this AC is already satisfied.

5. **AC5: Previous Pose State Preserved** — No code changes needed. `poseHintAtom`, `targetPoseAtom`, `currentPoseAtom` are written only by `selectPoseAtom`/`nextPoseAtom` (user actions). Detection failure does not clear them. Verify in implementation notes.

6. **AC6: No Technical Error Messages** — `CameraErrorBanner` currently renders `errorMessage` (the raw worker error string) in `text-xs text-red-300/80`. Replace with user-friendly guidance text based on error type. Raw error strings must NOT be visible to the user. Keep the user-friendly title strings ("AI Model Failed to Load", "Motion Tracking Error"). Replace body text with actionable guidance.

7. **AC7: CameraScreen Integration** — `DetectionFailureWarning` is rendered inside the camera view area in `camera-screen.tsx`, alongside the other warnings. No new hook call needed in CameraScreen — `detectionLostAtom` is written by `usePoseDetection` (already running via `CameraPreview`).

8. **AC8: Tests Updated** — `use-pose-detection.test.ts` has an existing AC3 test "sets detectionLostAtom after 3 seconds without landmarks" that uses `{ landmarks: [[]] }` for recovery (empty array). After the fix, recovery requires valid landmarks (length >= 33). Update this test and add a new test: "does not clear detectionLostAtom when POSE_RESULT arrives with empty landmarks".

## Tasks / Subtasks

- [x] Task 1: Fix `usePoseDetection` watchdog (AC: #2, #8)
  - [x] 1.1 In `src/lib/hooks/use-pose-detection.ts` — wrap the `lastPoseReceivedAtRef.current = performance.now()` and `setDetectionLost(false)` calls in a `landmarks?.[0]?.length >= 33` guard
  - [x] 1.2 In `src/lib/hooks/use-pose-detection.test.ts` — update AC3 recovery step to use valid 33-landmark payload
  - [x] 1.3 Add test: "does not clear detectionLostAtom when POSE_RESULT with empty landmarks arrives"
- [x] Task 2: Create `DetectionFailureWarning` component (AC: #1)
  - [x] 2.1 Create `src/components/camera/detection-failure-warning.tsx`
  - [x] 2.2 Create `src/components/camera/detection-failure-warning.test.tsx` with tests for: renders when atom true, hidden when atom false, correct message text, a11y attributes
- [x] Task 3: Update priority chain (AC: #3)
  - [x] 3.1 Add `detectionLostAtom` guard to `src/components/camera/subject-distance-warning.tsx`
  - [x] 3.2 Add suppression test to `src/components/camera/subject-distance-warning.test.tsx`
  - [x] 3.3 Add `detectionLostAtom` guard to `src/components/camera/subject-framing-warning.tsx`
  - [x] 3.4 Add suppression test to `src/components/camera/subject-framing-warning.test.tsx`
  - [x] 3.5 Add `detectionLostAtom` to null-return condition in `src/components/camera/pose-correction-prompt.tsx`
  - [x] 3.6 Add suppression test to `src/components/camera/pose-correction-prompt.test.tsx`
- [x] Task 4: Fix `CameraErrorBanner` user-facing copy (AC: #6)
  - [x] 4.1 Replace raw `errorMessage` body text in `src/components/camera/camera-error-banner.tsx` with user-friendly guidance
- [x] Task 5: Wire into `CameraScreen` (AC: #4, #5, #7)
  - [x] 5.1 Add `<DetectionFailureWarning />` import and render in `src/components/screens/camera-screen.tsx`
  - [x] 5.2 Add mock and render test in `src/components/screens/camera-screen.test.tsx`

## Dev Notes

### Critical: Fix `usePoseDetection` Before Building the Component

The existing `detectionLostAtom` infrastructure is already in `pose-store.ts` and `usePoseDetection`, but the watchdog has a bug: it resets its timer on **every** POSE_RESULT, even empty ones. This means `detectionLostAtom` only fires when the **worker stops responding entirely** (hung), not when the person leaves the frame (which returns POSE_RESULT with `landmarks = [[]]`).

**Current broken behavior in `use-pose-detection.ts:66-70`:**

```typescript
if (response.type === 'POSE_RESULT') {
  setPoseResult(response.payload);
  lastPoseReceivedAtRef.current = performance.now();  // resets on EVERY result
  setDetectionLost(false);                            // clears on EVERY result
```

**Fixed behavior:**

```typescript
if (response.type === 'POSE_RESULT') {
  setPoseResult(response.payload);
  if (response.payload.landmarks?.[0]?.length >= 33) {
    lastPoseReceivedAtRef.current = performance.now();
    setDetectionLost(false);
  }
```

The existing watchdog (`DETECTION_LOST_THRESHOLD_MS = 3_000`, `WATCHDOG_INTERVAL_MS = 1_000`) fires when `performance.now() - lastPoseReceivedAtRef.current > 3000ms`. With this fix, `lastPoseReceivedAtRef.current` only updates on valid landmarks, so the watchdog correctly fires after 3s of no valid pose.

`startDetection` sets `lastPoseReceivedAtRef.current = performance.now()` on start — this is intentional and correct. The user gets a 3s grace period from when detection starts before the warning appears.

### Existing Test to Update (`use-pose-detection.test.ts:267-272`)

The existing test "sets detectionLostAtom after 3 seconds without landmarks" uses empty landmarks for "recovery":

```typescript
// CURRENT (wrong after fix):
act(() => {
  onMessageCallback({ type: "POSE_RESULT", payload: { landmarks: [[]] } });
});
expect(mockStore.get(detectionLostAtom)).toBe(false); // empty landmarks cleared it — wrong
```

**Updated recovery should use valid landmarks:**

```typescript
// FIXED:
const validLandmarks = Array.from({ length: 33 }, (_, i) => ({
  x: 0.5,
  y: i * 0.03,
  z: 0,
  visibility: 0.9,
}));
act(() => {
  onMessageCallback({
    type: "POSE_RESULT",
    payload: { landmarks: [validLandmarks] },
  });
});
expect(mockStore.get(detectionLostAtom)).toBe(false);
```

**New test to add:**

```typescript
it("does not clear detectionLostAtom when POSE_RESULT with empty landmarks arrives", () => {
  // Set detectionLostAtom = true first
  mockStore.set(detectionLostAtom, true);

  act(() => {
    onMessageCallback({ type: "POSE_RESULT", payload: { landmarks: [[]] } });
  });

  expect(mockStore.get(detectionLostAtom)).toBe(true); // NOT cleared by empty landmarks
});
```

### `DetectionFailureWarning` Component Structure

Follows the exact same pattern as `SubjectDistanceWarning` (`subject-distance-warning.tsx`):

```typescript
'use client';

import { detectionLostAtom } from '@/lib/stores/pose-store';
import { useAtomValue } from 'jotai';

export function DetectionFailureWarning() {
  const detectionLost = useAtomValue(detectionLostAtom);

  if (!detectionLost) return null;

  return (
    <div
      data-testid="detection-failure-warning"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 z-20"
    >
      <p className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        Having trouble detecting you. Try better lighting.
      </p>
    </div>
  );
}
```

Position: `top-1/3` (same as distance/framing/correction warnings) — the priority chain (AC3) ensures only one `top-1/3` message shows at a time when `detectionLostAtom = true`.

### Priority Chain Updates — Pattern

**`SubjectDistanceWarning`** (current null-return: `if (!subjectTooFar) return null;`):

```typescript
import { detectionLostAtom, subjectTooFarAtom } from "@/lib/stores/pose-store";

const subjectTooFar = useAtomValue(subjectTooFarAtom);
const detectionLost = useAtomValue(detectionLostAtom);

if (!subjectTooFar || detectionLost) return null;
```

**`SubjectFramingWarning`** (current null-return: `if (!framingMessage || subjectTooFar) return null;`):

```typescript
import {
  detectionLostAtom,
  subjectFramingAtom,
  subjectTooFarAtom,
} from "@/lib/stores/pose-store";

const detectionLost = useAtomValue(detectionLostAtom);

if (!framingMessage || subjectTooFar || detectionLost) return null;
```

**`PoseCorrectionPrompt`** (current null-return at `pose-correction-prompt.tsx:63`: `if (!target || !displayedText || subjectTooFar || subjectFraming) return null;`):

```typescript
import {
  detectionLostAtom,
  poseCorrectionAtom,
  subjectFramingAtom,
  subjectTooFarAtom,
  targetPoseAtom,
} from "@/lib/stores/pose-store";

const detectionLost = useAtomValue(detectionLostAtom);

if (
  !target ||
  !displayedText ||
  subjectTooFar ||
  subjectFraming ||
  detectionLost
)
  return null;
```

### CameraErrorBanner — User-Friendly Copy

Current (`camera-error-banner.tsx:37,49-54`):

```typescript
const errorMessage = typeof error === 'string' ? error : (error as WorkerErrorDetail).rawError ? String((error as WorkerErrorDetail).rawError) : 'Unknown error';
// ...
<p className="text-xs text-red-300/80 leading-relaxed">
  {errorMessage}  {/* ← raw technical error shown to user */}
</p>
```

Replace with user-friendly descriptions:

```typescript
const bodyText = isLoadError
  ? 'The AI model could not load. Check your connection and try again.'
  : 'Motion tracking stopped unexpectedly. Tap "Retry" to restart.';

// ...
<p className="text-xs text-red-300/80 leading-relaxed">
  {bodyText}
</p>
```

Remove the `errorMessage` variable entirely (it was only used for the body text). The `isLoadError` check on `WorkerErrorDetail.type` is still needed for the button and body copy selection.

### CameraScreen Integration

`DetectionFailureWarning` slots in alongside the other warning components. Order doesn't affect rendering since they're all `absolute` positioned and the priority chain prevents overlap:

```typescript
import { DetectionFailureWarning } from '@/components/camera/detection-failure-warning';

// In JSX (inside the camera view area):
<DetectionFailureWarning />
```

No new hook call needed. `detectionLostAtom` is driven by `usePoseDetection` which runs inside `CameraPreview` (established in Epic 2). The warning component just reads the atom.

### `camera-screen.test.tsx` — Mock and Test

Add alongside existing warning mocks:

```typescript
jest.mock('@/components/camera/detection-failure-warning', () => ({
  DetectionFailureWarning: () => <div data-testid="detection-failure-warning" />,
}));

// Test:
it('should render DetectionFailureWarning in the camera view', () => {
  render(<CameraScreen />);
  expect(screen.getByTestId('detection-failure-warning')).toBeInTheDocument();
});
```

### Warning Position Map

| Component                 | Position  | Suppressed by                                                                   |
| ------------------------- | --------- | ------------------------------------------------------------------------------- |
| `DetectionFailureWarning` | `top-1/3` | Nothing (highest priority)                                                      |
| `SubjectDistanceWarning`  | `top-1/3` | `detectionLost`, `subjectTooFar=false`                                          |
| `SubjectFramingWarning`   | `top-1/3` | `detectionLost`, `subjectTooFar`, `framingMessage=null`                         |
| `PoseCorrectionPrompt`    | `top-1/3` | `detectionLost`, `subjectTooFar`, `subjectFraming`, `!target`, `!displayedText` |
| `LightingWarning`         | `top-4`   | Not suppressed (independent ambient indicator)                                  |

### AC4 & AC5 Verification — No Code Changes Required

**AC4 (Manual shutter always available):** `ControlBar` renders at `camera-screen.tsx:79` based on `status === 'ready' || status === 'loading'`. This is the camera status from `useCamera()`, which is independent of detection state. Detection failure does not change camera status. ✓ Already satisfied.

**AC5 (Previous pose state preserved):** `poseHintAtom` (`pose-store.ts:72`), `targetPoseAtom` (`pose-store.ts:60`), `currentPoseAtom` (`pose-store.ts:90`) are only written by `selectPoseAtom`/`nextPoseAtom` (user-initiated). `usePoseDetection` never clears these atoms. When detection resumes, the pose matching loop picks up the same `targetPoseAtom` from `targetPoseRef.current`. ✓ Already satisfied.

### Retro Action Items (Epic 4 AI-1 through AI-4)

| Retro Item                        | Enforcement in This Story                                                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1**: Realistic Test Fixtures | No geometric fixture calculations in this story (component-level atom tests only). Verify atom values directly.                                                                              |
| **AI-2**: Hook Composition Rule   | `DetectionFailureWarning` reads `detectionLostAtom` directly via `useAtomValue`. Does NOT call `useDistanceDetection` or any detection hook.                                                 |
| **AI-3**: API Consistency         | `detectionLostAtom` check added to ALL `top-1/3` warnings (`SubjectDistanceWarning`, `SubjectFramingWarning`, `PoseCorrectionPrompt`) — consistent suppression behavior.                     |
| **AI-4**: Test Assertion Depth    | Tests must verify: exact atom-to-render behavior (atom false → null, atom true → renders), exact message text, that empty-landmark POSE_RESULT does NOT clear `detectionLostAtom` after fix. |

### Epic 5 Retro Note (from Story 5.3 Review)

Story 5.3's code review noted: "All 3 detection hooks (5-1, 5-2, 5-3) intentionally do not clear atoms when landmarks are lost. Should be discussed in Epic 5 retrospective." Story 5.4 closes this loop by making `detectionLostAtom` the authoritative "no landmarks" indicator. The distance/framing hooks not clearing on landmark loss is correct — their warnings are suppressed by `detectionLostAtom`. This design decision is recorded here: when detection is lost, `detectionLostAtom` becomes the single source of truth for "no person in frame," and all `top-1/3` UI is funneled through it.

### DO NOT

- Do NOT create a new `useDetectionFailure` hook — the fix is in `usePoseDetection`'s existing watchdog
- Do NOT add `detectionLostAtom` to `LightingWarning` — it's at `top-4` and non-blocking (Story 5.3 design intent)
- Do NOT clear `poseHintAtom` or `targetPoseAtom` when detection is lost — AC5 requires pose state preservation
- Do NOT add detection state gating to `ControlBar` — the shutter must remain available (AC4)
- Do NOT show raw worker error strings in `CameraErrorBanner` — replace with user-friendly copy (AC6)
- Do NOT add new constants to `app.constants.ts` — `DETECTION_LOST_THRESHOLD_MS` stays local to `use-pose-detection.ts` (it's an internal hook detail, not a utility threshold)
- Do NOT add new atoms to `pose-store.ts` — `detectionLostAtom` already exists and is sufficient
- Do NOT modify `usePoseLibrary`, `useSceneDetection`, `useDistanceDetection`, `useFramingDetection`, or `useLightingDetection`

### Project Structure Notes

| File                                 | Action   | Location Rationale                                            |
| ------------------------------------ | -------- | ------------------------------------------------------------- |
| `use-pose-detection.ts`              | Modified | Fix watchdog to track valid landmarks only                    |
| `use-pose-detection.test.ts`         | Modified | Update recovery test, add empty-landmarks test                |
| `detection-failure-warning.tsx`      | New      | `components/camera/` — follows `subject-distance-warning.tsx` |
| `detection-failure-warning.test.tsx` | New      | Co-located with source                                        |
| `subject-distance-warning.tsx`       | Modified | Add `detectionLostAtom` guard                                 |
| `subject-distance-warning.test.tsx`  | Modified | Add suppression test                                          |
| `subject-framing-warning.tsx`        | Modified | Add `detectionLostAtom` guard                                 |
| `subject-framing-warning.test.tsx`   | Modified | Add suppression test                                          |
| `pose-correction-prompt.tsx`         | Modified | Add `detectionLostAtom` to null condition                     |
| `pose-correction-prompt.test.tsx`    | Modified | Add suppression test                                          |
| `camera-error-banner.tsx`            | Modified | Replace raw error text with user-friendly copy                |
| `camera-screen.tsx`                  | Modified | Add `<DetectionFailureWarning />`                             |
| `camera-screen.test.tsx`             | Modified | Add mock + render test                                        |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-5-subject-detection-edge-case-handling.md] Story 5.4 ACs
- [Source: src/lib/hooks/use-pose-detection.ts:66-70] Current watchdog bug — `lastPoseReceivedAtRef.current` resets on every POSE_RESULT
- [Source: src/lib/hooks/use-pose-detection.ts:24-26] `DETECTION_LOST_THRESHOLD_MS = 3_000`, `WATCHDOG_INTERVAL_MS = 1_000`
- [Source: src/lib/hooks/use-pose-detection.ts:100-111] Existing watchdog that sets `detectionLostAtom = true`
- [Source: src/lib/hooks/use-pose-detection.test.ts:233-272] AC3 test needing update
- [Source: src/lib/stores/pose-store.ts:24] `detectionLostAtom` — already exists
- [Source: src/lib/stores/pose-store.ts:48] `detectionErrorAtom` — read by `CameraErrorBanner`
- [Source: src/components/camera/camera-error-banner.tsx:37,49-54] Raw error message display to fix
- [Source: src/components/camera/subject-distance-warning.tsx] Component structure to follow for `DetectionFailureWarning`
- [Source: src/components/camera/subject-framing-warning.tsx:10] Current null-return pattern to extend
- [Source: src/components/camera/pose-correction-prompt.tsx:63] Current null-return to extend
- [Source: src/components/screens/camera-screen.tsx:64-76] Warning component rendering pattern
- [Source: src/components/screens/camera-screen.test.tsx:71-73] Existing mock pattern for warnings
- [Source: _bmad-output/implementation-artifacts/5-3-lighting-condition-warning.md] Story 5.3 note about detection hooks not clearing on landmark loss
- [Source: _bmad-output/implementation-artifacts/epic-4-retro.md] AI-1 through AI-4 retro action items, PT-2 (review detectionLostAtom for 5.4 readiness)

## Dev Agent Record

### Agent Model Used

anthropic/claude-sonnet-4-6

### Debug Log References

No blocking issues encountered. All tasks implemented in a single pass.

### Completion Notes List

- **Task 1 (AC2, AC8):** Fixed `usePoseDetection` watchdog at `use-pose-detection.ts:67-71` — wrapped `lastPoseReceivedAtRef.current` and `setDetectionLost(false)` in `landmarks?.[0]?.length >= 33` guard. Updated existing recovery test to use valid 33-landmark payload. Added new test verifying empty-landmark POSE_RESULT does NOT clear `detectionLostAtom`.
- **Task 2 (AC1):** Created `DetectionFailureWarning` component following `SubjectDistanceWarning` pattern. Reads `detectionLostAtom` directly; renders "Having trouble detecting you. Try better lighting." at `top-1/3` with `bg-black/60 backdrop-blur-sm` pill styling. Full test suite: renders/hidden by atom, exact message text, a11y attributes.
- **Task 3 (AC3):** Added `detectionLostAtom` guard to all three `top-1/3` warning components. `SubjectDistanceWarning`: `if (!subjectTooFar || detectionLost) return null`. `SubjectFramingWarning`: `if (!framingMessage || subjectTooFar || detectionLost) return null`. `PoseCorrectionPrompt`: added `|| detectionLost` to existing null-return. Each has a corresponding suppression test. `LightingWarning` intentionally unchanged (sits at `top-4`).
- **Task 4 (AC6):** Replaced raw `errorMessage` variable in `CameraErrorBanner` with `bodyText` using user-friendly copy based on `isLoadError`. Load error: "The AI model could not load. Check your connection and try again." Runtime error: "Motion tracking stopped unexpectedly. Tap 'Retry' to restart." Raw error strings no longer visible to users.
- **Task 5 (AC4, AC5, AC7):** Added `<DetectionFailureWarning />` to `camera-screen.tsx` inside the camera view area alongside other warnings. No new hook needed — `detectionLostAtom` is already driven by `usePoseDetection` inside `CameraPreview`. AC4 verified: `ControlBar` renders on `status === 'ready' || status === 'loading'` independent of detection state. AC5 verified: `poseHintAtom`, `targetPoseAtom`, `currentPoseAtom` are only written by `selectPoseAtom`/`nextPoseAtom`.
- **Design Decision (Epic 5 Retro closure):** Distance/framing hooks correctly do not clear their atoms on landmark loss. `detectionLostAtom` is the authoritative "no person in frame" signal — all `top-1/3` warnings are suppressed via it, making the priority chain coherent without requiring those hooks to change behavior.
- **Test results:** 256 tests, 31 suites, all passing. No regressions.

### File List

- `src/lib/hooks/use-pose-detection.ts` (modified)
- `src/lib/hooks/use-pose-detection.test.ts` (modified)
- `src/components/camera/detection-failure-warning.tsx` (new)
- `src/components/camera/detection-failure-warning.test.tsx` (new)
- `src/components/camera/subject-distance-warning.tsx` (modified)
- `src/components/camera/subject-distance-warning.test.tsx` (modified)
- `src/components/camera/subject-framing-warning.tsx` (modified)
- `src/components/camera/subject-framing-warning.test.tsx` (modified)
- `src/components/camera/pose-correction-prompt.tsx` (modified)
- `src/components/camera/pose-correction-prompt.test.tsx` (modified)
- `src/components/camera/camera-error-banner.tsx` (modified)
- `src/components/screens/camera-screen.tsx` (modified)
- `src/components/screens/camera-screen.test.tsx` (modified)

## Senior Developer Review (AI)

**Reviewer:** Ami
**Outcome:** Approved — 2 Medium, 2 Low issues found and resolved.

- [FIXED][MEDIUM] `camera-error-banner.tsx:40` — Runtime error body text "Tap 'Retry' to restart." contradicted UI (no Retry button for runtime errors). Changed to "Dismiss and try again."
- [FIXED][MEDIUM] Created `camera-error-banner.test.tsx` — AC6 user-facing copy change had zero test coverage. Added 17 tests covering: null renders nothing, load vs runtime error title/body differentiation, raw error string NOT shown to user, Retry button presence/absence, dismiss and retry behaviour.
- [FIXED][LOW] `use-pose-detection.test.ts:252` — Updated comment from "to start the clock" to accurately describe that empty-landmark POSE_RESULT does NOT reset the watchdog clock after the AC2 fix.
- [FIXED][LOW] `camera-error-banner.tsx:4` — Changed `import { WorkerErrorDetail }` to `import type { WorkerErrorDetail }` (type-only usage).

All ACs verified as implemented. 63 tests pass (17 new tests added).

## Change Log

- Code review passed — 2 Medium issues fixed, 17 tests added. Story status set to done.
- Implemented Story 5.4 — Graceful Detection Failure. Fixed watchdog bug in `usePoseDetection` to only reset clock on valid 33-landmark results. Created `DetectionFailureWarning` component. Added `detectionLostAtom` priority guards to `SubjectDistanceWarning`, `SubjectFramingWarning`, and `PoseCorrectionPrompt`. Replaced raw error strings in `CameraErrorBanner` with user-friendly copy. Wired `DetectionFailureWarning` into `CameraScreen`.
