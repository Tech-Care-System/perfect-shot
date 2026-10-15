# Story 6.3: Audio Feedback (Ding Sound)

Status: review

## Story

As a subject being photographed,
I want to hear a "ding" sound when my pose matches,
so that I know to hold still even if I can't see the screen.

## Acceptance Criteria

1. **AC1: Audio Utility** — A `preloadAudio()` function and a `playDing()` function are exported from `src/lib/utils/audio-feedback.ts`. `preloadAudio()` creates an `HTMLAudioElement` for `/sounds/ding.mp3` and calls `.load()`. `playDing()` resets `currentTime = 0` and calls `.play()`. Both functions fail silently — `preloadAudio` catches construction errors, `playDing` catches `play()` promise rejection (handles muted/autoplay-blocked cases). If `preloadAudio` was never called, `playDing` is a no-op.

2. **AC2: iOS Safari Preloading (UX12)** — `preloadAudio()` is called on the first user interaction. In `CameraScreen`, the "Start Camera" button's click handler calls `preloadAudio()` before `startCamera()`. This satisfies iOS Safari's requirement that audio be loaded within a user gesture context. Audio must NOT be preloaded in `useEffect` or on mount — iOS Safari will block it.

3. **AC3: Ding on Threshold Crossing** — The ding plays once when `poseScoreAtom` first crosses `POSE_THRESHOLD` (0.90) while `!detectionLost && !capturedPhoto`. Implemented in `useSmartShutter` via a `hasDingedRef` — set to `true` on first crossing, prevents replay on subsequent frames while score stays above threshold. Reset to `false` when the condition goes false (score drops, photo captured, or detection lost). The ding plays at the SAME moment as the white flash in `FeedbackGlow` (t=0ms), which is 500ms BEFORE auto-capture fires.

4. **AC4: Graceful Failure** — If the device is muted, audio file is missing, or the browser blocks autoplay, no error is thrown, no error is logged, and no UI is affected. The app continues functioning with visual and haptic feedback only. Do NOT show a toast, banner, or error message for audio failure.

5. **AC5: Audio File** — A `ding.mp3` file exists at `public/sounds/ding.mp3`. The file should be a short, pleasant confirmation tone (< 1 second, < 50KB). The `/public/sounds/` directory already exists.

6. **AC6: No Repeat on Hold** — While score stays >= 0.90 continuously (during the 500ms hold period), the ding does NOT replay. It plays exactly once per crossing session. If score drops below 0.90 and crosses again, the ding plays again.

## Tasks / Subtasks

- [x] Task 1: Audio feedback utility (AC: #1, #4)
  - [x] 1.1 Create `src/lib/utils/audio-feedback.ts` — `preloadAudio()` and `playDing()` functions
  - [x] 1.2 Create `src/lib/utils/audio-feedback.test.ts` — tests for preload, play, graceful failure, no-op when not preloaded
- [x] Task 2: Audio asset (AC: #5)
  - [x] 2.1 Add a `ding.mp3` file to `public/sounds/` — short confirmation tone
- [x] Task 3: Ding on threshold crossing in useSmartShutter (AC: #3, #6)
  - [x] 3.1 Add `hasDingedRef` and `playDing()` call to `src/lib/hooks/use-smart-shutter.ts`
  - [x] 3.2 Update `src/lib/hooks/use-smart-shutter.test.tsx` — tests for ding on crossing, no repeat during hold, reset on score drop
- [x] Task 4: Audio preload on first interaction (AC: #2)
  - [x] 4.1 Add `preloadAudio()` call in `CameraScreen`'s Start Camera click handler
  - [x] 4.2 Update `src/components/screens/camera-screen.test.tsx` — test that `preloadAudio` is called on Start Camera click

## Dev Notes

### Audio Utility — `src/lib/utils/audio-feedback.ts`

Follows the `haptic-feedback.ts` pattern: module-level state, exported functions, feature detection, silent failure.

```typescript
let dingSound: HTMLAudioElement | null = null;

export function preloadAudio(): void {
  if (typeof window === "undefined" || dingSound) return;
  try {
    dingSound = new Audio("/sounds/ding.mp3");
    dingSound.preload = "auto";
    dingSound.load();
  } catch {
    // Audio API not available
  }
}

export function playDing(): void {
  if (!dingSound) return;
  try {
    dingSound.currentTime = 0;
    dingSound.play().catch(() => {});
  } catch {
    // Playback failed (muted, blocked, etc.)
  }
}
```

**`dingSound` guard in `preloadAudio`:** The `|| dingSound` check prevents creating multiple Audio elements if called more than once (e.g., user clicks Start Camera, then Retake, then Start Camera again).

**`currentTime = 0`:** Resets playback position so the ding replays from the start if called while a previous ding is still playing (rapid score oscillation).

**`.play().catch(() => {})`:** The `.play()` method returns a Promise that rejects if the browser blocks autoplay. The empty `.catch()` swallows this rejection silently. Do NOT use `async/await` — this is fire-and-forget.

**No class wrapper needed.** The `haptic-feedback.ts` utility uses plain function exports. Follow the same pattern. Module-level `let` provides singleton behavior.

### Testing `audio-feedback.ts` in JSDOM

JSDOM does not have `HTMLAudioElement`. Mock the `Audio` constructor:

```typescript
const mockPlay = jest.fn().mockResolvedValue(undefined);
const mockLoad = jest.fn();
const mockAudio = {
  preload: "",
  load: mockLoad,
  play: mockPlay,
  currentTime: 0,
};
global.Audio = jest
  .fn()
  .mockImplementation(() => mockAudio) as unknown as typeof Audio;
```

Test cases:

- `preloadAudio()`: creates Audio with `/sounds/ding.mp3`, sets `preload = 'auto'`, calls `.load()`
- `preloadAudio()` called twice: only creates one Audio element
- `playDing()` before `preloadAudio()`: no-op, no error
- `playDing()` after `preloadAudio()`: sets `currentTime = 0`, calls `.play()`
- `playDing()` when `.play()` rejects: no error thrown (catches promise rejection)
- `preloadAudio()` when `Audio` constructor throws: no error thrown
- SSR guard: `typeof window === 'undefined'` returns early (test by setting `window` to undefined if possible, or just verify the guard exists)

**Module state reset between tests:** Since `dingSound` is module-level, it persists across tests. Use `jest.resetModules()` and re-import in each test, OR export a `resetAudio()` function for testing only. The cleanest approach: use `jest.isolateModules()` to get a fresh module for each test.

### Ding in `useSmartShutter` — Threshold Crossing Logic

Add a `hasDingedRef` to track whether the ding has played for the current crossing session. This ref operates independently of the hold timer.

```typescript
import { playDing } from "@/lib/utils/audio-feedback";

// Inside useSmartShutter:
const hasDingedRef = useRef(false);

useEffect(() => {
  const shouldCapture =
    score >= POSE_THRESHOLD && !detectionLost && !capturedPhoto;

  // Play ding exactly once per crossing
  if (shouldCapture && !hasDingedRef.current) {
    hasDingedRef.current = true;
    playDing();
  }
  if (!shouldCapture) {
    hasDingedRef.current = false;
  }

  // Existing timer logic (unchanged)
  if (holdTimerRef.current) {
    clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  }

  if (shouldCapture) {
    holdTimerRef.current = setTimeout(() => {
      // ... existing capture logic
    }, SMART_SHUTTER_HOLD_MS);
  }
}, [
  score,
  detectionLost,
  capturedPhoto,
  facingMode,
  videoElement,
  setCapturedPhoto,
]);
```

**Why `hasDingedRef` and not a state variable?** A ref doesn't trigger re-renders. Using `useState` would cause an extra render cycle on every crossing, which is unnecessary — the ding is a fire-and-forget side effect.

**Why the ding is in `useSmartShutter` and not in `FeedbackGlow`?** `FeedbackGlow` is a visual component. Putting audio logic in a render component violates separation of concerns. `useSmartShutter` already watches the same atoms and has the same threshold logic. Story 6.4 (haptic feedback) will add `triggerHaptic('short')` at the exact same point.

**Ding timing relative to auto-capture:**

- t=0ms: Score crosses 0.90 → `hasDingedRef` flips → `playDing()` fires → simultaneously, `FeedbackGlow` fires white flash
- t=0ms–500ms: Hold timer running, subject holds still
- t=500ms: Timer fires → `capturePhoto()` → `capturedPhotoAtom` set → PreviewScreen renders

The ding plays 500ms BEFORE auto-capture. This matches the AC: "the sound plays before or simultaneously with auto-capture".

### Preloading in CameraScreen

Modify the Start Camera click handler at `camera-screen.tsx:115-119`:

```typescript
import { preloadAudio } from '@/lib/utils/audio-feedback';

// In the Start Camera button onClick:
onClick={() => {
  preloadAudio();
  startCamera(facingMode);
}}
```

This is the first user gesture in the app flow. iOS Safari allows `Audio.load()` inside user gesture handlers. Subsequent `playDing()` calls work because the Audio element was created in a gesture context.

**Why not preload in `useSmartShutter`?** `useSmartShutter` runs in a `useEffect`, not a user gesture. iOS Safari blocks audio loading outside gesture handlers.

### Audio Asset — `public/sounds/ding.mp3`

The `public/sounds/` directory already exists (confirmed). Place `ding.mp3` there.

Requirements for the audio file:

- Format: MP3 (universally supported across browsers)
- Duration: < 1 second (short confirmation tone)
- Size: < 50KB (minimize load time)
- Character: Pleasant, bright — not harsh or alarming
- Inspiration: Duolingo micro-celebration (per UX design direction)

If sourcing a royalty-free ding is difficult, a viable alternative: generate a sine-wave tone programmatically using Web Audio API. However, the AC explicitly requires a file at `/public/sounds/ding.mp3`, so prefer an actual file. Web Audio API synthesis can be considered as a future enhancement.

### Existing Infrastructure (Do NOT Recreate)

| Component                         | Location                                        | Relevance                                                |
| --------------------------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `haptic-feedback.ts`              | `src/lib/utils/haptic-feedback.ts`              | Pattern to follow for audio-feedback.ts                  |
| `useSmartShutter`                 | `src/lib/hooks/use-smart-shutter.ts`            | Where to add ding trigger                                |
| `FeedbackGlow` threshold crossing | `src/components/camera/feedback-glow.tsx:52-63` | Same crossing logic — do NOT modify, ding is independent |
| `POSE_THRESHOLD`                  | `src/constants/app.constants.ts`                | Already defined as 0.9                                   |
| `poseScoreAtom`                   | `src/lib/stores/pose-store.ts`                  | Already read by useSmartShutter                          |

### What NOT to Do

- Do NOT create a separate `useAudioFeedback` hook — the trigger point already exists in `useSmartShutter`
- Do NOT modify `FeedbackGlow` — it handles visual feedback only
- Do NOT add an atom for audio state — no UI depends on whether audio played
- Do NOT add a user setting to toggle audio — out of scope for this story
- Do NOT use Web Audio API `AudioContext` — `HTMLAudioElement` is simpler and sufficient
- Do NOT call `playDing()` inside the 500ms timer callback — the ding fires at crossing (t=0ms), not at capture (t=500ms)

### Project Structure Notes

| File                                            | Action   | Location Rationale                                                     |
| ----------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `src/lib/utils/audio-feedback.ts`               | New      | `lib/utils/` — browser API wrapper, follows haptic-feedback.ts pattern |
| `src/lib/utils/audio-feedback.test.ts`          | New      | Co-located with source                                                 |
| `public/sounds/ding.mp3`                        | New      | Static asset served by Next.js                                         |
| `src/lib/hooks/use-smart-shutter.ts`            | Modified | Add hasDingedRef + playDing() call                                     |
| `src/lib/hooks/use-smart-shutter.test.tsx`      | Modified | Add ding-related tests                                                 |
| `src/components/screens/camera-screen.tsx`      | Modified | Add preloadAudio() in Start Camera handler                             |
| `src/components/screens/camera-screen.test.tsx` | Modified | Test preloadAudio called on click                                      |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-6-smart-capture-output.md#Story 6.3]
- [Source: _bmad-output/planning-artifacts/ux-design/responsive-design-accessibility.md#UX12 Audio Preloading]
- [Source: _bmad-output/planning-artifacts/ux-design/core-user-experience.md#Ding Moment]
- [Source: _bmad-output/planning-artifacts/ux-design/user-journey-flows.md#Multimodal Feedback]
- [Source: _bmad-output/project-context.md#iOS Safari Quirks - Audio Pre-loading]
- [Source: _bmad-output/implementation-artifacts/epic-5-retro.md#PT-2 Web Audio Research]

### Retro Action Items Enforcement

| Retro Item                              | Enforcement in This Story                                                                                                                                                                          |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E5)**: Test File Completeness   | New file `audio-feedback.ts` has co-located `audio-feedback.test.ts`. Modified `use-smart-shutter.ts` has existing test file updated. Modified `camera-screen.tsx` has existing test file updated. |
| **AI-2 (E5)**: UI-Copy / Feature Parity | No body copy changes. Audio is non-visual.                                                                                                                                                         |
| **AI-3 (E4/E5)**: Test Assertion Depth  | Tests assert specific mock calls (`play()`, `load()`, `currentTime`), not just function existence.                                                                                                 |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None

### Completion Notes List

- Task 1: Created `audio-feedback.ts` with module-level singleton Audio element. `preloadAudio()` creates and loads Audio on first call, idempotent on subsequent calls. `playDing()` resets currentTime and plays, no-op if not preloaded. All errors caught silently. 6 tests passing.
- Task 2: Generated `ding.mp3` (880Hz sine, 150ms, 1.7KB) via ffmpeg — well under 50KB limit.
- Task 3: Added `hasDingedRef` to `useSmartShutter`. Plays ding exactly once per threshold crossing. Resets when score drops below threshold. 4 new tests added (12 total passing).
- Task 4: Added `preloadAudio()` call in CameraScreen Start Camera handler for iOS Safari user gesture compliance. 1 new test added (18 total passing).
- Full regression suite: 36 suites, 312 tests, 0 failures.

### Change Log

- Story 6.3 implementation — audio feedback ding sound with preloading, threshold crossing trigger, and graceful failure.

### File List

- src/lib/utils/audio-feedback.ts (new)
- src/lib/utils/audio-feedback.test.ts (new)
- public/sounds/ding.mp3 (new)
- src/lib/hooks/use-smart-shutter.ts (modified)
- src/lib/hooks/use-smart-shutter.test.tsx (modified)
- src/components/screens/camera-screen.tsx (modified)
- src/components/screens/camera-screen.test.tsx (modified)
