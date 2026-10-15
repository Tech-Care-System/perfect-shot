# Story 7.3: Unsupported Device Warning

Status: done

## Story

As a user on a very old device,
I want to be informed if my device cannot run the app properly,
so that I understand why the experience may be degraded.

## Acceptance Criteria

1. **AC1: Unsupported Threshold** — If benchmark FPS < `UNSUPPORTED_FPS_THRESHOLD` (10), the warning is shown. The threshold constant already exists in `src/constants/app.constants.ts:48`. Strictly less-than: FPS of exactly 10 does NOT trigger the warning. The benchmark result is read via `useBenchmark().result` (already wired in CameraScreen from Story 7.1). Do NOT read localStorage directly — use the existing hook result.

2. **AC2: Atom-Driven State** — CameraScreen sets `deviceUnsupportedAtom` to `true` in a `useEffect` when `benchmarkResult.fps < UNSUPPORTED_FPS_THRESHOLD`. This mirrors the lite mode auto-enable pattern at `camera-screen.tsx:69-73`. If `benchmarkResult` is null (benchmark hasn't run or errored), the atom stays `false` (fail-open).

3. **AC3: Warning Component** — An `UnsupportedDeviceWarning` component renders as an absolute overlay with `pointer-events-none absolute z-20`, `role="status"`, `aria-live="polite"`. Follows the `LightingWarning` component pattern. Uses `'use client'` directive.

4. **AC4: Warning Text** — The warning displays: "Your device may have slower feedback. For best results, use the manual shutter button." This exact text is rendered.

5. **AC5: Dismissable** — The warning includes a dismiss button ("x"). When tapped, the warning disappears for the rest of the session. Dismiss state tracked via `deviceWarningDismissedAtom` in `settings-store.ts`. The dismiss button has `pointer-events-auto` to be tappable within the `pointer-events-none` container.

6. **AC6: Non-Blocking** — The app continues to function fully when the warning is shown. Detection, pose matching, auto-capture, manual shutter — all features remain available.

7. **AC7: Once Per Session** — The warning shown at most once per session. "Session" = page load. Dismissed state is NOT persisted to localStorage — session-only via Jotai atom (resets on reload).

8. **AC8: CameraScreen Integration** — `UnsupportedDeviceWarning` is rendered in `CameraScreen` alongside the other warning components.

## Tasks / Subtasks

- [x] Task 1: Add atoms to settings store (AC: #2, #5)
  - [x] 1.1 Add `deviceUnsupportedAtom` and `deviceWarningDismissedAtom` to existing `src/lib/stores/settings-store.ts`
  - [x] 1.2 Add atom default value tests to existing `src/lib/stores/settings-store.test.ts`
- [x] Task 2: Warning component (AC: #3, #4, #5, #6, #7)
  - [x] 2.1 Create `src/components/camera/unsupported-device-warning.tsx`
  - [x] 2.2 Create `src/components/camera/unsupported-device-warning.test.tsx`
- [x] Task 3: CameraScreen integration (AC: #1, #2, #8)
  - [x] 3.1 Add `useEffect` to set `deviceUnsupportedAtom` from `benchmarkResult` in `CameraScreen`
  - [x] 3.2 Add `<UnsupportedDeviceWarning />` render in CameraScreen JSX
  - [x] 3.3 Update `src/components/screens/camera-screen.test.tsx` with mock + tests

## Dev Notes

### Architecture — Benchmark Result Flow

This story does NOT create benchmark logic — that's Story 7.1. This story reads the result from `useBenchmark().result` (already wired in CameraScreen at line 37) and conditionally shows a warning.

```
useBenchmark().result → useEffect → deviceUnsupportedAtom → UnsupportedDeviceWarning
```

Story 7.2 (lite mode) auto-enables for devices < `LITE_MODE_FPS` (15). This story handles the more severe case: devices < 10 FPS, where lite mode is insufficient.

Threshold hierarchy:

- 15+ FPS: Full mode
- 10–14 FPS: Lite mode (Story 7.2), no warning
- < 10 FPS: Lite mode + unsupported device warning

### Store — Modify `src/lib/stores/settings-store.ts`

The file already exists from Story 7.2 with `liteModeAtom`. Add two atoms:

```typescript
import { atom } from "jotai";

export const liteModeAtom = atom<boolean>(false);

export const deviceUnsupportedAtom = atom<boolean>(false);

export const deviceWarningDismissedAtom = atom<boolean>(false);
```

### Component — `src/components/camera/unsupported-device-warning.tsx`

Follows the `LightingWarning` pattern: `'use client'`, read atom, conditional render, absolute overlay.

```typescript
'use client';

import { deviceUnsupportedAtom, deviceWarningDismissedAtom } from '@/lib/stores/settings-store';
import { useAtomValue, useSetAtom } from 'jotai';

export function UnsupportedDeviceWarning() {
  const deviceUnsupported = useAtomValue(deviceUnsupportedAtom);
  const dismissed = useAtomValue(deviceWarningDismissedAtom);
  const setDismissed = useSetAtom(deviceWarningDismissedAtom);

  if (!deviceUnsupported || dismissed) return null;

  return (
    <div
      data-testid="unsupported-device-warning"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20"
    >
      <div className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-amber-200 backdrop-blur-sm flex items-center gap-2">
        <p>Your device may have slower feedback. For best results, use the manual shutter button.</p>
        <button
          data-testid="unsupported-device-dismiss"
          onClick={() => setDismissed(true)}
          className="pointer-events-auto ml-1 text-amber-200/70 hover:text-amber-200"
          aria-label="Dismiss warning"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
```

**Position: `top-4`** — Same as `LightingWarning`. These two warnings are mutually exclusive in practice (lighting warning requires active detection, unsupported device warning appears when detection is barely functional). If both somehow show, z-index stacking is identical and visual overlap is acceptable.

**Color: `text-amber-200`** — Matches `LightingWarning` styling at `lighting-warning.tsx:18`.

**`pointer-events-auto` on dismiss button:** Outer container is `pointer-events-none` (consistent with all warning components). Dismiss button needs `pointer-events-auto` to be tappable.

### CameraScreen Wiring

In `src/components/screens/camera-screen.tsx`, follow the exact same pattern as the lite mode auto-enable at lines 69-73:

```typescript
import { UNSUPPORTED_FPS_THRESHOLD } from '@/constants/app.constants';
import { deviceUnsupportedAtom } from '@/lib/stores/settings-store';
import { UnsupportedDeviceWarning } from '@/components/camera/unsupported-device-warning';

// Alongside existing setLiteMode:
const setDeviceUnsupported = useSetAtom(deviceUnsupportedAtom);

// New useEffect, after the lite mode useEffect:
useEffect(() => {
  if (benchmarkResult && benchmarkResult.fps < UNSUPPORTED_FPS_THRESHOLD) {
    setDeviceUnsupported(true);
  }
}, [benchmarkResult, setDeviceUnsupported]);

// In JSX, alongside other warning components:
<UnsupportedDeviceWarning />
```

**Why no separate `useUnsupportedDevice()` hook?** Story 7.2 sets `liteModeAtom` via a `useEffect` directly in CameraScreen using `benchmarkResult` from `useBenchmark()`. This story follows the identical pattern. A separate hook that reads localStorage directly would: (1) duplicate `useBenchmark()`'s parsing/validation, (2) use the wrong key format (localStorage stores JSON `{ fps, timestamp }` under `BENCHMARK_STORAGE_KEY`), and (3) diverge from the established pattern.

### Testing Strategy

#### Store Tests — `settings-store.test.ts` (modify existing)

Add to the existing test file:

```typescript
import {
  deviceUnsupportedAtom,
  deviceWarningDismissedAtom,
} from "./settings-store";

it("deviceUnsupportedAtom defaults to false", () => {
  const store = createStore();
  expect(store.get(deviceUnsupportedAtom)).toBe(false);
});

it("deviceWarningDismissedAtom defaults to false", () => {
  const store = createStore();
  expect(store.get(deviceWarningDismissedAtom)).toBe(false);
});
```

#### Component Tests — `unsupported-device-warning.test.tsx`

Use Jotai Provider with pre-set atom values:

```typescript
// Test cases:
// - deviceUnsupportedAtom=true, dismissed=false → renders warning with correct text
// - deviceUnsupportedAtom=false → returns null
// - deviceUnsupportedAtom=true, dismissed=true → returns null
// - Dismiss button click → sets deviceWarningDismissedAtom to true
// - Warning text matches exact copy: "Your device may have slower feedback..."
// - Accessibility: role="status", aria-live="polite" present
// - Dismiss button has aria-label="Dismiss warning"
```

#### CameraScreen Tests — `camera-screen.test.tsx` (modify existing)

Follow the existing mock pattern. Add mock for `UnsupportedDeviceWarning`:

```typescript
jest.mock('@/components/camera/unsupported-device-warning', () => ({
  UnsupportedDeviceWarning: () => <div data-testid="unsupported-device-warning" />,
}));
```

Add `deviceUnsupportedAtom` to the `useSetAtom` mock routing:

```typescript
import { deviceUnsupportedAtom } from "@/lib/stores/settings-store";

let mockSetDeviceUnsupported: jest.Mock;

// In beforeEach:
mockSetDeviceUnsupported = jest.fn();

// In useSetAtom mock:
if (atom === deviceUnsupportedAtom) return mockSetDeviceUnsupported;
```

Test cases:

- Renders `UnsupportedDeviceWarning` component
- Sets `deviceUnsupportedAtom` to `true` when benchmark FPS < 10
- Does NOT set atom when benchmark FPS = 10 (strictly less-than)
- Does NOT set atom when benchmark FPS > 10
- Does NOT set atom when benchmark result is null

### Existing Infrastructure (Do NOT Recreate)

| Component                        | Location                                                | Relevance                                                               |
| -------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `LightingWarning`                | `src/components/camera/lighting-warning.tsx`            | Component pattern to follow — same position, same styling               |
| `SubjectDistanceWarning`         | `src/components/camera/subject-distance-warning.tsx`    | Warning component pattern reference                                     |
| `UNSUPPORTED_FPS_THRESHOLD = 10` | `src/constants/app.constants.ts:48`                     | Already exists — do NOT add again                                       |
| `LITE_MODE_FPS = 15`             | `src/constants/app.constants.ts:10`                     | Lite mode threshold — for context only                                  |
| `useBenchmark()`                 | `src/lib/hooks/use-benchmark.ts`                        | Returns `{ status, result }` — already wired in CameraScreen at line 37 |
| `benchmarkResult`                | `src/components/screens/camera-screen.tsx:37`           | Already destructured — use it directly                                  |
| `liteModeAtom`                   | `src/lib/stores/settings-store.ts`                      | Existing atom in settings store                                         |
| Lite mode auto-enable            | `src/components/screens/camera-screen.tsx:69-73`        | Pattern to follow for deviceUnsupportedAtom                             |
| CameraScreen test mocks          | `src/components/screens/camera-screen.test.tsx:132-138` | useSetAtom routing pattern for atom mocks                               |

### What NOT to Do

- Do NOT add `UNSUPPORTED_FPS_THRESHOLD` to constants — it already exists at `app.constants.ts:48`
- Do NOT create `settings-store.ts` — it already exists from Story 7.2. Modify it to add atoms.
- Do NOT create a `useUnsupportedDevice()` hook that reads localStorage directly — use `benchmarkResult` from the existing `useBenchmark()` call in CameraScreen
- Do NOT read localStorage with key `benchmark-fps` — the actual key is `BENCHMARK_STORAGE_KEY = 'ai-perfect-shot-benchmark'` storing JSON
- Do NOT block app usage — the warning is informational only
- Do NOT disable auto-capture or modify the detection loop
- Do NOT persist dismissed state to localStorage — session-only via atom
- Do NOT show the warning if benchmark hasn't run — fail-open (benchmarkResult is null)
- Do NOT use red/error styling — use `text-amber-200` (warm, matches LightingWarning)
- Do NOT modify any other warning components

### Project Structure Notes

| File                                                        | Action   | Location Rationale                                                                          |
| ----------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `src/lib/stores/settings-store.ts`                          | Modified | Add `deviceUnsupportedAtom`, `deviceWarningDismissedAtom` alongside existing `liteModeAtom` |
| `src/lib/stores/settings-store.test.ts`                     | Modified | Add atom default value tests                                                                |
| `src/components/camera/unsupported-device-warning.tsx`      | New      | `components/camera/` — follows warning component pattern                                    |
| `src/components/camera/unsupported-device-warning.test.tsx` | New      | Co-located with source                                                                      |
| `src/components/screens/camera-screen.tsx`                  | Modified | Add useEffect + render component                                                            |
| `src/components/screens/camera-screen.test.tsx`             | Modified | Add mock + integration tests                                                                |

### References

- [Source: src/components/camera/lighting-warning.tsx] Warning component pattern — conditional render, a11y, styling, `top-4` position
- [Source: src/components/camera/subject-distance-warning.tsx] Warning component pattern — `pointer-events-none`, `role="status"`
- [Source: src/constants/app.constants.ts:48] `UNSUPPORTED_FPS_THRESHOLD = 10` — already defined by Story 7.1
- [Source: src/constants/app.constants.ts:10] `LITE_MODE_FPS = 15` — lite mode threshold for context
- [Source: src/lib/stores/settings-store.ts] Existing store with `liteModeAtom` from Story 7.2
- [Source: src/lib/hooks/use-benchmark.ts:15-18] `BenchmarkResult = { fps: number; timestamp: number }` type
- [Source: src/lib/hooks/use-benchmark.ts:31-40] `getStoredResult()` reads `BENCHMARK_STORAGE_KEY` from localStorage as JSON
- [Source: src/components/screens/camera-screen.tsx:37] `const { status: benchmarkStatus, result: benchmarkResult } = useBenchmark()`
- [Source: src/components/screens/camera-screen.tsx:69-73] Lite mode auto-enable useEffect — pattern to follow
- [Source: src/components/screens/camera-screen.test.tsx:132-138] `useSetAtom` mock routing pattern
- [Source: _bmad-output/implementation-artifacts/epic-6-retro.md] Retro action items AI-1 through AI-4

### Retro Action Items Enforcement

| Retro Item                                  | Enforcement in This Story                                                                                                                                                                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AI-1 (E6)**: Retro Enforcement Table      | This table. Present in story.                                                                                                                                                                                                                                                 |
| **AI-2 (E6)**: Timer/Closure Safety         | No timers in this story. `useEffect` runs once when `benchmarkResult` changes — no stale closure risk. Dismiss handler writes atom synchronously via `setDismissed(true)`.                                                                                                    |
| **AI-3 (E6)**: Ref-based Guard Pattern      | No async click handlers reading atom state. Dismiss handler writes atom synchronously.                                                                                                                                                                                        |
| **AI-4 (E5 carry)**: Test File Completeness | Modified `settings-store.ts` → `settings-store.test.ts` (existing, updated). New `unsupported-device-warning.tsx` → `unsupported-device-warning.test.tsx` (new). Modified `camera-screen.tsx` → `camera-screen.test.tsx` (existing, updated). Every file has associated test. |

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (anthropic/claude-opus-4.6)

### Debug Log References

No issues encountered. All tasks completed in a single pass with no regressions.

### Completion Notes List

- Task 1: Added `deviceUnsupportedAtom` and `deviceWarningDismissedAtom` to `settings-store.ts`. Both default to `false`. Added 2 default-value tests.
- Task 2: Created `UnsupportedDeviceWarning` component following `LightingWarning` pattern — `'use client'`, conditional render on atom state, dismissable via button, `pointer-events-none` container with `pointer-events-auto` dismiss button, `role="status"`, `aria-live="polite"`. Created 7 component tests covering render/hide/dismiss/accessibility.
- Task 3: Wired `deviceUnsupportedAtom` in CameraScreen via `useEffect` mirroring lite mode pattern. Renders `<UnsupportedDeviceWarning />` alongside other warnings. Added mock + 5 integration tests covering threshold boundaries (< 10, = 10, > 10, null).
- Full suite: tests pass, 0 regressions.

### Change Log

- Added `deviceUnsupportedAtom` and `deviceWarningDismissedAtom` to settings store for session-only unsupported device state
- Created `UnsupportedDeviceWarning` dismissable overlay component with accessibility attributes
- Integrated unsupported device detection into CameraScreen via benchmark FPS threshold check
- Senior Developer Review (AI): Fixed position collision with LightingWarning (top-4 → top-14). Replaced Unicode ✕ dismiss with lucide-react X icon for consistency. Added pointer-events-none class test and FPS=9 boundary test. All ACs verified, all tests pass. Status → done.

### File List

- `src/lib/stores/settings-store.ts` (modified)
- `src/lib/stores/settings-store.test.ts` (modified)
- `src/components/camera/unsupported-device-warning.tsx` (new)
- `src/components/camera/unsupported-device-warning.test.tsx` (new)
- `src/components/screens/camera-screen.tsx` (modified)
- `src/components/screens/camera-screen.test.tsx` (modified)
