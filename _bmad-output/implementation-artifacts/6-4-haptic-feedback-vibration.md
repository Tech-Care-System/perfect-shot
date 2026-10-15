# Story 6.4: Haptic Feedback (Vibration)

Status: review

## Story

As a subject being photographed,
I want the phone to vibrate when my pose matches,
so that I feel the confirmation physically.

## Acceptance Criteria

1. **AC1: Haptic on Threshold Crossing** — `triggerHaptic('short')` is called in `useSmartShutter` at the exact same point as `playDing()` — when `poseScoreAtom` first crosses `POSE_THRESHOLD` (0.90) while `!detectionLost && !capturedPhoto`. The vibration fires at t=0ms (same instant as ding + white flash), 500ms BEFORE auto-capture. Uses the existing `triggerHaptic` function from `src/lib/utils/haptic-feedback.ts`.

2. **AC2: Feature Detection (UX13)** — The existing `triggerHaptic()` already checks `'vibrate' in navigator` before calling `navigator.vibrate(50)`. No additional feature detection needed. Do NOT add a separate check in `useSmartShutter`.

3. **AC3: Graceful Failure** — If the device does not support vibration (iOS Safari, Firefox 129+, desktop browsers), no error is thrown, no error is logged, and no UI is affected. The existing `triggerHaptic()` handles this via feature detection + try/catch. Do NOT show a toast, banner, or error message for vibration failure.

4. **AC4: No Repeat on Hold** — While score stays >= 0.90 continuously (during the 500ms hold period), the haptic does NOT replay. It fires exactly once per crossing session because it shares the `hasDingedRef` gate with `playDing()`. If score drops below 0.90 and crosses again, the haptic fires again.

5. **AC5: Simultaneous with Audio** — `triggerHaptic('short')` fires on the same line/block as `playDing()`. Both are fire-and-forget side effects triggered by the same condition. The timing is: ding plays + vibration pulses at t=0ms, white flash at t=0ms, auto-capture at t=500ms.

## Tasks / Subtasks

- [x] Task 1: Add haptic trigger to useSmartShutter (AC: #1, #4, #5)
  - [x] 1.1 Add `triggerHaptic('short')` call next to `playDing()` in `src/lib/hooks/use-smart-shutter.ts`
- [x] Task 2: Update useSmartShutter tests (AC: #1, #4)
  - [x] 2.1 Add mock for `haptic-feedback` module in `src/lib/hooks/use-smart-shutter.test.tsx`
  - [x] 2.2 Add test: haptic triggers once when score crosses threshold
  - [x] 2.3 Add test: haptic does not replay while score stays above threshold
  - [x] 2.4 Add test: haptic replays when score drops and crosses threshold again
  - [x] 2.5 Add test: haptic does not trigger when detectionLost is true
  - [x] 2.6 Add test: haptic does not trigger when capturedPhoto is already set

## Dev Notes

### Implementation — Single Line Addition

The entire implementation is one line added to `useSmartShutter` at `src/lib/hooks/use-smart-shutter.ts:27`:

```typescript
import { triggerHaptic } from "@/lib/utils/haptic-feedback";

// Inside the useEffect, in the existing threshold-crossing block (line 25-28):
if (shouldCapture && !hasDingedRef.current) {
  hasDingedRef.current = true;
  playDing();
  triggerHaptic("short"); // ← ADD THIS LINE
}
```

The `hasDingedRef` gate already prevents repeats during hold. The `shouldCapture` condition already includes `!detectionLost && !capturedPhoto`. No new refs, state, or logic needed.

### Existing `haptic-feedback.ts` — Do NOT Modify

The utility at `src/lib/utils/haptic-feedback.ts` already implements everything needed:

- Feature detection: `typeof navigator === 'undefined' || !('vibrate' in navigator)` → early return
- Duration mapping: `short` = 50ms, `medium` = 100ms, `long` = 200ms
- Silent failure: try/catch with empty catch block
- No class wrapper, plain function export — matches `audio-feedback.ts` pattern

### Testing `triggerHaptic` in useSmartShutter Tests

The existing test file already mocks `audio-feedback`. Add an identical mock for `haptic-feedback`:

```typescript
jest.mock("@/lib/utils/haptic-feedback", () => ({
  triggerHaptic: jest.fn(),
}));

import { triggerHaptic } from "@/lib/utils/haptic-feedback";
const mockTriggerHaptic = triggerHaptic as jest.MockedFunction<
  typeof triggerHaptic
>;
```

Add `mockTriggerHaptic.mockClear()` in `beforeEach`.

Test cases mirror the existing ding tests exactly — the haptic triggers at the same point under the same conditions:

| Test Case                                   | Expected                             |
| ------------------------------------------- | ------------------------------------ |
| Score crosses 0.90                          | `triggerHaptic('short')` called once |
| Score stays above 0.90 (0.92 → 0.95 → 0.99) | `triggerHaptic` called once total    |
| Score drops below 0.90 then crosses again   | `triggerHaptic` called twice total   |
| `detectionLost = true` + score 0.95         | `triggerHaptic` not called           |
| `capturedPhoto` already set + score 0.95    | `triggerHaptic` not called           |

### Vibration API Browser Support

| Browser          | Support                | Notes                                         |
| ---------------- | ---------------------- | --------------------------------------------- |
| Chrome Android   | Supported (v30+)       | Primary target, works reliably                |
| Samsung Internet | Supported (v4+)        |                                               |
| Edge             | Supported (v79+)       |                                               |
| Firefox          | **REMOVED from v129+** | Was supported v11-128, removed in 2024        |
| Safari (macOS)   | Not supported          | Never implemented                             |
| iOS Safari       | Not supported          | Never implemented — all iOS browsers affected |
| Opera            | Supported (v17+)       |                                               |

The feature detection in `triggerHaptic()` handles all unsupported cases. No code changes needed for browser support — this is purely informational to set expectations. Haptic feedback will work on Android Chrome (the primary mobile target) but NOT on iOS Safari.

### Existing Infrastructure (Do NOT Recreate)

| Component         | Location                                | Relevance                                              |
| ----------------- | --------------------------------------- | ------------------------------------------------------ |
| `triggerHaptic()` | `src/lib/utils/haptic-feedback.ts`      | Already exists — call it, do NOT create a new utility  |
| `playDing()`      | `src/lib/utils/audio-feedback.ts`       | Co-fires with haptic at same crossing point            |
| `useSmartShutter` | `src/lib/hooks/use-smart-shutter.ts`    | Where to add the `triggerHaptic` call                  |
| `hasDingedRef`    | `src/lib/hooks/use-smart-shutter.ts:20` | Already gates both ding and haptic — no new ref needed |
| `POSE_THRESHOLD`  | `src/constants/app.constants.ts`        | Already defined as 0.9                                 |
| `poseScoreAtom`   | `src/lib/stores/pose-store.ts`          | Already read by useSmartShutter                        |

### What NOT to Do

- Do NOT create a `useHapticFeedback` hook — `triggerHaptic` is a plain utility function
- Do NOT modify `haptic-feedback.ts` — it already has the correct implementation
- Do NOT add a new ref for haptic (like `hasVibratedRef`) — reuse `hasDingedRef`
- Do NOT add an atom for haptic state — no UI depends on whether vibration occurred
- Do NOT add a user setting to toggle haptic — out of scope
- Do NOT add conditional logic to skip haptic on iOS — `triggerHaptic` already handles feature detection
- Do NOT rename `hasDingedRef` to something generic — the ref already gates both ding and haptic, naming is fine

### Project Structure Notes

| File                                       | Action   | Location Rationale                                    |
| ------------------------------------------ | -------- | ----------------------------------------------------- |
| `src/lib/hooks/use-smart-shutter.ts`       | Modified | Add `triggerHaptic('short')` call — 1 import + 1 line |
| `src/lib/hooks/use-smart-shutter.test.tsx` | Modified | Add haptic mock + 5 new test cases                    |

No new files. No new directories. No moved files.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-smart-capture-output.md#Story 6.4]
- [Source: _bmad-output/planning-artifacts/ux-design/responsive-design-accessibility.md#Accessibility Strategy - Multimodal]
- [Source: _bmad-output/planning-artifacts/ux-design/core-user-experience.md#Dual-Channel Output]
- [Source: _bmad-output/planning-artifacts/ux-design/user-journey-flows.md#Multimodal Feedback]
- [Source: _bmad-output/project-context.md#iOS Safari Quirks - Limited Haptic API]
- [Source: _bmad-output/implementation-artifacts/6-3-audio-feedback-ding-sound.md#Ding in useSmartShutter]

### Previous Story Intelligence (Story 6.3)

- `hasDingedRef` pattern established: single `useRef(false)` gates one-shot side effects per threshold crossing session. Story 6.4 reuses the same ref — no new ref needed.
- `playDing()` placement confirmed at `useSmartShutter.ts:27`, inside the `shouldCapture && !hasDingedRef.current` block. `triggerHaptic('short')` goes on the next line.
- Story 6.3 tested 4 ding scenarios (crossing, no-repeat, re-crossing, detectionLost). Story 6.4 tests must mirror these plus add capturedPhoto guard.
- Story 6.3 total: 312 tests across 36 suites, 0 failures.

### Retro Action Items Enforcement

| Retro Item                              | Enforcement in This Story                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E5)**: Test File Completeness   | Modified `use-smart-shutter.ts` has existing test file `use-smart-shutter.test.tsx` updated with 5 new haptic test cases. `haptic-feedback.ts` is NOT modified — no test update needed. |
| **AI-2 (E5)**: UI-Copy / Feature Parity | No body copy changes. Haptic is non-visual.                                                                                                                                             |
| **AI-3 (E4/E5)**: Test Assertion Depth  | Tests assert specific mock calls (`triggerHaptic('short')` with argument), call counts, and negative cases — not just function existence.                                               |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (anthropic/claude-opus-4.6)

### Debug Log References

None — no issues encountered.

### Completion Notes List

- Added `triggerHaptic('short')` call next to `playDing()` in the threshold-crossing block of `useSmartShutter`. The `hasDingedRef` gate prevents repeats during hold, matching AC #1, #4, #5.
- Added `haptic-feedback` mock and 5 new test cases mirroring the existing ding tests: crossing, no-repeat, re-crossing, detectionLost guard, capturedPhoto guard.
- Full test suite: 318 tests across 36 suites, 0 failures, 0 regressions.
- No modifications to `haptic-feedback.ts` — existing utility handles feature detection and graceful failure (AC #2, #3).

### Change Log

- Added haptic feedback trigger to smart shutter threshold crossing (1 import + 1 line). Added 5 haptic test cases to useSmartShutter tests.

### File List

- `src/lib/hooks/use-smart-shutter.ts` (modified)
- `src/lib/hooks/use-smart-shutter.test.tsx` (modified)
