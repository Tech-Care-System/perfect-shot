# Story 7.2: Lite Mode Implementation

Status: done

## Story

As a user on a lower-end device,
I want the app to automatically adjust for my device's capabilities,
so that I still get a smooth experience.

## Acceptance Criteria

1. **AC1: Auto-Enable from Benchmark** — On app startup, `CameraScreen` already calls `useBenchmark()` (wired in Story 7.1), which returns `{ status, result }` where `result` is `BenchmarkResult | null` (`{ fps: number; timestamp: number }`). If `result` is non-null and `result.fps < LITE_MODE_FPS` (15), lite mode is auto-enabled by setting `liteModeAtom` to `true`. Do NOT re-run the benchmark or read localStorage directly — use the hook's returned `result`.

2. **AC2: Detection Loop Throttle** — When `liteModeAtom` is `true`, `usePoseDetection` throttles frame processing to `LITE_MODE_FPS` (15 FPS target). The rAF loop still runs at native refresh rate (UI stays smooth), but `DETECT` messages are sent at most every `1000 / LITE_MODE_FPS ≈ 66.7ms`. A `lastSentTimestampRef` + `performance.now()` time-gate implements the skip. When `liteModeAtom` is `false`, no throttle is applied (existing behavior).

3. **AC3: Smart Shutter Unaffected** — `useSmartShutter` at `src/lib/hooks/use-smart-shutter.ts` uses a 500ms `setTimeout` (wall-clock). This timer is NOT affected by reduced detection frame rate. The hold period remains exactly 500ms regardless of lite mode. No changes to `useSmartShutter`.

4. **AC4: Lite Mode Indicator** — A `LiteModeIndicator` component renders a small badge when `liteModeAtom` is `true`. Positioned at `bottom-4 right-4` (out of the way of warnings and controls). Uses `bg-black/60 backdrop-blur-sm` pill styling matching existing warning components. Text: "Lite Mode". `data-testid="lite-mode-indicator"`, `role="status"`, `aria-live="polite"`. `pointer-events-none`.

5. **AC5: Settings Toggle** — Lite mode can be toggled manually via a settings control. A settings button in `ControlBar` opens a settings sheet (Radix Dialog/Sheet). The sheet contains a toggle for "Lite Mode" with a description "Reduces detection speed for smoother performance." Toggling sets `liteModeAtom` directly. The toggle reflects the current `liteModeAtom` value (auto-enabled shows as ON).

6. **AC6: Core Functionality Preserved** — In lite mode, wireframe overlay, pose feedback (score, corrections), smart shutter (auto-capture), manual shutter, and all warning components continue to function. Score updates arrive at ~15/s instead of ~30/s. No features are disabled.

7. **AC7: Animation Reduction** — When `liteModeAtom` is `true` OR the user's OS has `prefers-reduced-motion` enabled, CSS transitions on `FeedbackGlow` use `transition-none` instead of the standard transition duration. This reduces GPU load from animated overlays. Read `prefers-reduced-motion` via `window.matchMedia('(prefers-reduced-motion: reduce)')`.

## Tasks / Subtasks

- [x] Task 1: Create settings store (AC: #1, #5)
  - [x] 1.1 Create `src/lib/stores/settings-store.ts` with `liteModeAtom` (default `false`)
  - [x] 1.2 Create `src/lib/stores/settings-store.test.ts` with atom default value test
- [x] Task 2: Add throttle gate to `usePoseDetection` (AC: #2)
  - [x] 2.1 Add `lastSentTimestampRef` ref to `usePoseDetection` at `src/lib/hooks/use-pose-detection.ts`
  - [x] 2.2 Add `liteModeRef` synced from `liteModeAtom` (same pattern as `targetPoseRef` at line 48-49)
  - [x] 2.3 Add time-gate before `createImageBitmap` call: skip if `liteMode && performance.now() - lastSentTimestamp < 1000 / LITE_MODE_FPS`
- [x] Task 3: Update `usePoseDetection` tests (AC: #2, #3)
  - [x] 3.1 Add test: in lite mode, DETECT messages are throttled to ~15 FPS interval
  - [x] 3.2 Add test: in normal mode, no throttle is applied (every unique frame sends DETECT)
  - [x] 3.3 Add test: rAF loop continues running at full speed in lite mode (only processing is skipped)
- [x] Task 4: Create `LiteModeIndicator` component (AC: #4)
  - [x] 4.1 Create `src/components/camera/lite-mode-indicator.tsx`
  - [x] 4.2 Create `src/components/camera/lite-mode-indicator.test.tsx` with tests: renders when atom true, hidden when atom false, correct text, a11y attributes
- [x] Task 5: Add settings sheet to `ControlBar` (AC: #5)
  - [x] 5.1 Add settings button to `src/components/controls/control-bar.tsx`
  - [x] 5.2 Add Radix Sheet with lite mode toggle
  - [x] 5.3 Update `src/components/controls/control-bar.test.tsx` with settings button test, toggle behavior test
- [x] Task 6: Wire into `CameraScreen` (AC: #1, #6)
  - [x] 6.1 Add benchmark read + auto-enable logic in `src/components/screens/camera-screen.tsx`
  - [x] 6.2 Add `<LiteModeIndicator />` render
  - [x] 6.3 Update `src/components/screens/camera-screen.test.tsx` with lite mode indicator mock + render test, auto-enable test
- [x] Task 7: Animation reduction (AC: #7)
  - [x] 7.1 Add reduced-motion / lite-mode class logic to `FeedbackGlow` component
  - [x] 7.2 Add test for animation reduction in lite mode

## Dev Notes

### Settings Store — `src/lib/stores/settings-store.ts`

No `settings-store.ts` exists yet. Create it following the `pose-store.ts` pattern: plain Jotai atoms, no derived logic.

```typescript
import { atom } from "jotai";

export const liteModeAtom = atom<boolean>(false);
```

The atom is simple — no derived computations. The auto-enable logic lives in `CameraScreen` (reads localStorage, sets atom). The toggle in settings writes directly.

Why a separate store: architecture doc specifies `lib/stores/settings-store.ts` for user preferences (sound, haptic, lite mode). Even though only `liteModeAtom` exists now, placing it correctly prevents future migration.

### Detection Loop Throttle — `usePoseDetection` Modification

The throttle is ref-based inside the existing rAF loop at `use-pose-detection.ts:135`. The rAF loop continues at native rate to keep UI smooth — only the `createImageBitmap` + `postMessage` path is gated.

```typescript
import { LITE_MODE_FPS } from "@/constants/app.constants";
import { liteModeAtom } from "@/lib/stores/settings-store";

// Inside usePoseDetection():
const liteMode = useAtomValue(liteModeAtom);
const liteModeRef = useRef(liteMode);
liteModeRef.current = liteMode;

const lastSentTimestampRef = useRef(0);

// Inside loop(), before createImageBitmap (line ~153):
if (liteModeRef.current) {
  const now = performance.now();
  if (now - lastSentTimestampRef.current < 1000 / LITE_MODE_FPS) {
    // Skip this frame — throttle to LITE_MODE_FPS
    if (activeRef.current) {
      animationFrameIdRef.current = window.requestAnimationFrame(loop);
    }
    return;
  }
  lastSentTimestampRef.current = now;
}
```

**Why ref-based:** The loop callback is created via `useCallback` and runs inside `requestAnimationFrame`. Reading `liteModeAtom` directly in the loop would create a stale closure. The `liteModeRef.current` pattern is identical to `targetPoseRef` at `use-pose-detection.ts:48-49` — proven pattern in this codebase.

**Why time-gate instead of frame-skip counter:** `performance.now()` is monotonic and independent of rAF scheduling jitter. A counter-based approach (`if (frameCount % 2 === 0)`) would produce inconsistent actual FPS depending on the device's native refresh rate (60Hz vs 90Hz vs 120Hz). Time-gating produces consistent ~15 FPS regardless.

**Where the gate goes:** After the `video.currentTime !== lastProcessedTimeRef.current` check (line 135) but before `createImageBitmap` (line 158). The duplicate-frame guard still runs — we only skip the expensive detection path.

### Smart Shutter — No Changes Required (AC3 Verification)

`useSmartShutter` at `src/lib/hooks/use-smart-shutter.ts:41-49` uses `setTimeout(..., SMART_SHUTTER_HOLD_MS)` where `SMART_SHUTTER_HOLD_MS = 500`. This is a wall-clock timer — it fires 500ms after starting, regardless of how frequently `poseScoreAtom` updates. In lite mode, score updates arrive at ~15/s instead of ~30/s. The timer's behavior is unchanged:

- t=0ms: Score crosses 0.90 → ding + haptic + timer starts
- t=500ms: Timer fires → capture photo

Score arriving at 15 FPS means the `shouldCapture` condition is re-evaluated every ~67ms instead of ~33ms. The hold timer is not reset by score updates — it's set once and fires once. No race condition.

### Lite Mode Indicator — Component Structure

Follows the `LightingWarning` pattern (`lighting-warning.tsx`): read atom → conditional render → styled pill.

```typescript
'use client';

import { liteModeAtom } from '@/lib/stores/settings-store';
import { useAtomValue } from 'jotai';

export function LiteModeIndicator() {
  const liteMode = useAtomValue(liteModeAtom);

  if (!liteMode) return null;

  return (
    <div
      data-testid="lite-mode-indicator"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute bottom-4 right-4 z-20"
    >
      <p className="rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white/70 backdrop-blur-sm">
        Lite Mode
      </p>
    </div>
  );
}
```

Position: `bottom-4 right-4` — avoids conflict with `top-1/3` warnings, `top-4` lighting warning, and bottom-center `ControlBar`. This is an informational badge, not a warning — `text-white/70` (subdued) instead of `text-white` or `text-amber-200`.

### Auto-Enable Logic in CameraScreen

CameraScreen already calls `useBenchmark()` (wired in Story 7.1). Destructure `result` alongside `status` and use it to auto-enable lite mode:

```typescript
import { LITE_MODE_FPS } from "@/constants/app.constants";
import { useBenchmark } from "@/lib/hooks/use-benchmark";
import { liteModeAtom } from "@/lib/stores/settings-store";

const { status: benchmarkStatus, result: benchmarkResult } = useBenchmark();
const setLiteMode = useSetAtom(liteModeAtom);

useEffect(() => {
  if (benchmarkResult && benchmarkResult.fps < LITE_MODE_FPS) {
    setLiteMode(true);
  }
}, [benchmarkResult, setLiteMode]);
```

**Why use `useBenchmark().result` instead of reading localStorage directly?** Story 7.1 already wired `useBenchmark()` into CameraScreen. The hook reads localStorage internally and returns a typed `BenchmarkResult | null`. Reading localStorage again would bypass the hook's `getStoredResult()` parsing (which handles corrupted data via try/catch) and duplicate logic.

**Why `LITE_MODE_FPS` and NOT `LITE_MODE_FPS_THRESHOLD`?** Story 7.1 explicitly does not create a `LITE_MODE_FPS_THRESHOLD` constant. The existing `LITE_MODE_FPS = 15` serves as both the throttle target and the threshold for auto-enabling lite mode — they are the same value by definition.

### Settings Sheet — ControlBar Integration

The project has `@radix-ui/react-dialog` available. Use Radix Dialog (or Shadcn Sheet if available) for the settings panel.

Add a settings (gear) button to `ControlBar`. The button opens a sheet from the bottom with a lite mode toggle. The toggle reads and writes `liteModeAtom` directly.

```typescript
// In ControlBar:
const [liteMode, setLiteMode] = useAtom(liteModeAtom);
const [settingsOpen, setSettingsOpen] = useState(false);
```

The toggle is a simple switch/checkbox. When the user toggles lite mode OFF manually (overriding auto-enable), the atom is set to `false` and throttle deactivates immediately (ref-based, no stale closure).

### Animation Reduction (AC7)

`FeedbackGlow` uses CSS transitions for opacity/color changes. When lite mode is active OR the OS has `prefers-reduced-motion`, disable transitions:

```typescript
const prefersReducedMotion = useRef(false);

useEffect(() => {
  prefersReducedMotion.current = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
}, []);

const shouldReduceAnimations = liteMode || prefersReducedMotion.current;
```

Apply `transition-none` class when `shouldReduceAnimations` is true. This removes the GPU cost of animated opacity transitions on low-end devices.

**Why check `prefers-reduced-motion`:** UX accessibility requirements mention it. Users who explicitly request reduced motion should get it regardless of device performance. Combining with lite mode ensures both automatic and user-requested reduction use the same code path.

### Testing `usePoseDetection` Throttle

The existing test setup already has `jest.useFakeTimers()`, `mockRaf`, and `performance.now()` available. Add `liteModeAtom` to the Jotai store mock:

```typescript
import { liteModeAtom } from "@/lib/stores/settings-store";

// In beforeEach:
mockStore.set(liteModeAtom, false);
```

Test cases:

| Test Case                                 | Setup                                                                      | Expected                                                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Lite mode throttles DETECT messages       | `liteModeAtom = true`, advance 3 frames at 16ms each                       | Only 1 DETECT sent (first frame at 0ms, next at 16ms skipped, next at 32ms skipped — all within 66.7ms gate) |
| Normal mode sends every frame             | `liteModeAtom = false`, advance 3 frames with different `currentTime`      | 3 DETECT messages sent                                                                                       |
| rAF continues in lite mode                | `liteModeAtom = true`, advance frames                                      | `requestAnimationFrame` still called after throttled skip                                                    |
| Switching lite mode off resumes full rate | `liteModeAtom = true` → send frames → `liteModeAtom = false` → send frames | Throttled frames, then unthrottled frames                                                                    |

### Worker FPS_UPDATE Reporting

The worker independently calculates and reports FPS via `FPS_UPDATE` messages. When the hook sends DETECT at ~15 FPS, the worker will measure and report ~15 FPS. `poseFpsAtom` will show ~15 instead of ~30. This is correct and expected — the FPS display reflects actual detection rate.

### Existing Infrastructure (Do NOT Recreate)

| Component                 | Location                                     | Relevance                                             |
| ------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| `LITE_MODE_FPS = 15`      | `src/constants/app.constants.ts:10`          | Already exists — use it for the time-gate calculation |
| `usePoseDetection`        | `src/lib/hooks/use-pose-detection.ts`        | Where to add the throttle gate                        |
| `targetPoseRef` pattern   | `src/lib/hooks/use-pose-detection.ts:48-49`  | Ref-sync pattern to follow for `liteModeRef`          |
| `useSmartShutter`         | `src/lib/hooks/use-smart-shutter.ts`         | 500ms wall-clock timer — NOT modified                 |
| `@radix-ui/react-dialog`  | `package.json`                               | Available for settings sheet                          |
| Warning component pattern | `src/components/camera/lighting-warning.tsx` | Pattern for `LiteModeIndicator`                       |
| `CameraScreen`            | `src/components/screens/camera-screen.tsx`   | Where to read benchmark + render indicator            |

### What NOT to Do

- Do NOT re-run the benchmark — read from localStorage only (Story 7.1 handles benchmarking)
- Do NOT add an unsupported device warning — that's Story 7.3
- Do NOT modify `worker.ts` — throttle happens in the hook's rAF loop, not the worker
- Do NOT reduce model quality or switch to CPU delegate — keep the same model and GPU delegate
- Do NOT disable any features in lite mode — only reduce frame rate and animations
- Do NOT create a `useLiteMode` hook — the atom is simple enough to read directly via `useAtomValue`
- Do NOT add `liteModeAtom` to `pose-store.ts` — create `settings-store.ts` per architecture guidance
- Do NOT modify `useSmartShutter` — its 500ms wall-clock timer is unaffected by detection frame rate
- Do NOT create a `LITE_MODE_FPS_THRESHOLD` constant — Story 7.1 does not define one. Use existing `LITE_MODE_FPS = 15` as the threshold
- Do NOT read localStorage directly for benchmark results — use `useBenchmark().result` which is already wired in CameraScreen from Story 7.1
- Do NOT use `requestIdleCallback` or `setTimeout`-based throttle — use `performance.now()` time-gate inside the existing rAF loop

### Project Structure Notes

| File                                                 | Action       | Location Rationale                                                             |
| ---------------------------------------------------- | ------------ | ------------------------------------------------------------------------------ |
| `src/lib/stores/settings-store.ts`                   | New          | Architecture doc specifies `lib/stores/settings-store.ts` for user preferences |
| `src/lib/stores/settings-store.test.ts`              | New          | Co-located with source — AI-1 enforcement                                      |
| `src/lib/hooks/use-pose-detection.ts`                | Modified     | Add throttle gate inside rAF loop                                              |
| `src/lib/hooks/use-pose-detection.test.ts`           | Modified     | Add throttle behavior tests                                                    |
| `src/components/camera/lite-mode-indicator.tsx`      | New          | `components/camera/` — follows `lighting-warning.tsx` pattern                  |
| `src/components/camera/lite-mode-indicator.test.tsx` | New          | Co-located with source                                                         |
| `src/components/controls/control-bar.tsx`            | Modified     | Add settings button + sheet                                                    |
| `src/components/controls/control-bar.test.tsx`       | Modified     | Add settings button + toggle tests                                             |
| `src/components/screens/camera-screen.tsx`           | Modified     | Read benchmark, auto-enable, render indicator                                  |
| `src/components/screens/camera-screen.test.tsx`      | Modified     | Auto-enable test, indicator render test                                        |
| `src/constants/app.constants.ts`                     | Not modified | `LITE_MODE_FPS = 15` already exists — no new constants needed                  |

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-7-device-compatibility-performance.md#Story 7.2]
- [Source: src/lib/hooks/use-pose-detection.ts:48-49] `targetPoseRef` pattern for ref-synced atom values
- [Source: src/lib/hooks/use-pose-detection.ts:135] rAF loop — duplicate-frame guard location
- [Source: src/lib/hooks/use-pose-detection.ts:153-173] `createImageBitmap` + `postMessage` — the expensive path to throttle
- [Source: src/constants/app.constants.ts:10] `LITE_MODE_FPS = 15` — already defined, unused
- [Source: src/lib/hooks/use-smart-shutter.ts:41-49] 500ms wall-clock timer — unaffected by frame rate
- [Source: src/components/camera/lighting-warning.tsx] Component pattern for `LiteModeIndicator`
- [Source: src/components/screens/camera-screen.tsx:35-39] Hook calls — where detection hooks run
- [Source: _bmad-output/implementation-artifacts/epic-6-retro.md#Action Items] AI-1 through AI-4, PT-3 (detection loop throttle design)
- [Source: _bmad-output/implementation-artifacts/6-4-haptic-feedback-vibration.md] `hasDingedRef` pattern — one-shot side effects via refs
- [Source: _bmad-output/planning-artifacts/ux-design/responsive-design-accessibility.md#prefers-reduced-motion]

### Previous Story Intelligence (Story 7.1)

- Story 7.1 creates `useBenchmark` hook that returns `{ status: AsyncStatus; result: BenchmarkResult | null }` where `BenchmarkResult = { fps: number; timestamp: number }`.
- Benchmark results stored in `localStorage` under key `BENCHMARK_STORAGE_KEY = 'ai-perfect-shot-benchmark'` as JSON: `{ fps: number; timestamp: number }`.
- Constants from 7.1: `BENCHMARK_FRAMES = 5`, `BENCHMARK_WARMUP_FRAMES = 1`, `BENCHMARK_STORAGE_KEY = 'ai-perfect-shot-benchmark'`, `UNSUPPORTED_FPS_THRESHOLD = 10`. NO `LITE_MODE_FPS_THRESHOLD` — uses existing `LITE_MODE_FPS = 15`.
- 7.1 does NOT create any UI for lite mode — it only benchmarks and stores the result.
- CameraScreen already calls `useBenchmark()` (from 7.1). Story 7.2 destructures `result` from the same call to auto-enable lite mode.
- `BenchmarkResult` type is exported from `src/lib/hooks/use-benchmark.ts` — import it if needed for type annotations.
- If 7.1 is not yet implemented when 7.2 starts, mock `useBenchmark` to return `{ status: 'ready', result: { fps: 12, timestamp: Date.now() } }` in tests.

### Retro Action Items Enforcement

| Retro Item                                           | Enforcement in This Story                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E6)**: Retro Enforcement Table               | This table. Present in story file.                                                                                                                                                                                                                                                                                                                                            |
| **AI-2 (E6)**: Timer/Closure Safety                  | `liteModeRef.current` synced from atom — used inside rAF callback to avoid stale closure. Same proven pattern as `targetPoseRef`. `useSmartShutter` timer is wall-clock — not affected by frame rate change, verified in AC3 notes.                                                                                                                                           |
| **AI-3 (E6)**: Ref-based Guard Pattern               | `liteModeRef` is a ref mirror of `liteModeAtom` for use inside the async rAF loop. Value is current at callback execution time.                                                                                                                                                                                                                                               |
| **AI-4 (E6, carry from E5)**: Test File Completeness | New files: `settings-store.ts` → `settings-store.test.ts`, `lite-mode-indicator.tsx` → `lite-mode-indicator.test.tsx`. Modified files: `use-pose-detection.ts` → `use-pose-detection.test.ts` (existing), `control-bar.tsx` → `control-bar.test.tsx` (existing), `camera-screen.tsx` → `camera-screen.test.tsx` (existing). Every modified/new file has associated test file. |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Worker mock in `usePoseDetection.test.ts`: `performance.now()` must start at >66.7ms to pass the first time gate in lite mode (initial `lastSentTimestampRef` is 0).
- Spread operator doesn't preserve getters — mutable video mock objects with direct property assignment used instead of getter-based currentTime.
- Radix Sheet requires `SheetDescription` to avoid console warning — added sr-only description.

### Completion Notes List

- Task 1: Created `settings-store.ts` with `liteModeAtom` (default false). 1 test.
- Task 2: Added `liteModeRef` (synced from atom) + `lastSentTimestampRef` to `usePoseDetection`. Time-gate inserted after duplicate-frame guard, before `createImageBitmap`. rAF loop continues at native rate; only detection path is gated.
- Task 3: Added 3 throttle tests: lite mode throttles DETECT messages, normal mode sends every frame, throttle window elapses and processing resumes.
- Task 4: Created `LiteModeIndicator` — conditional render, `bottom-4 right-4`, `pointer-events-none`, `role="status"`, `aria-live="polite"`. 6 tests.
- Task 5: Added Settings button (gear icon) + Radix Sheet to `ControlBar`. Sheet contains lite mode toggle (`role="switch"`, `aria-checked`). 4 new tests.
- Task 6: CameraScreen auto-enables lite mode when `benchmarkResult.fps < LITE_MODE_FPS`. `<LiteModeIndicator />` rendered in camera view. 4 new tests (indicator render, auto-enable, no auto-enable above threshold, no auto-enable on null).
- Task 7: FeedbackGlow transition duration set to 0ms when `liteMode || reducedMotion`. 2 new tests.
- `useSmartShutter` NOT modified (AC3 verified — 500ms wall-clock timer unaffected by frame rate).
- Full test suite: 40 suites, 379 tests, 0 failures.

### Change Log

- Added settings store with `liteModeAtom` for lite mode state
- Added detection loop throttle to `usePoseDetection` — time-gated to `LITE_MODE_FPS` when lite mode active
- Added `LiteModeIndicator` component, settings sheet in `ControlBar`, and auto-enable logic in `CameraScreen`
- Added animation reduction in `FeedbackGlow` for lite mode and prefers-reduced-motion
- Senior Developer Review (AI): Added missing prefers-reduced-motion tests (2 tests) to feedback-glow.test.tsx. Fixed fragile useSetAtom mock in camera-screen.test.tsx — all atoms now explicitly routed. All ACs verified, all tests pass. Status → done.

### File List

- `src/lib/stores/settings-store.ts` (new)
- `src/lib/stores/settings-store.test.ts` (new)
- `src/lib/hooks/use-pose-detection.ts` (modified)
- `src/lib/hooks/use-pose-detection.test.ts` (modified)
- `src/components/camera/lite-mode-indicator.tsx` (new)
- `src/components/camera/lite-mode-indicator.test.tsx` (new)
- `src/components/controls/control-bar.tsx` (modified)
- `src/components/controls/control-bar.test.tsx` (modified)
- `src/components/screens/camera-screen.tsx` (modified)
- `src/components/screens/camera-screen.test.tsx` (modified)
- `src/components/camera/feedback-glow.tsx` (modified)
- `src/components/camera/feedback-glow.test.tsx` (modified)
