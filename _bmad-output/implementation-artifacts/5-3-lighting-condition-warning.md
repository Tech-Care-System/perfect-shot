# Story 5.3: Lighting Condition Warning

Status: done

## Story

As a user,
I want to be warned about poor lighting conditions,
so that I can adjust my position or the shot will still work.

## Acceptance Criteria

1. **AC1: Lighting Detection Utility** — A pure function `detectLighting(landmarks)` returns `'ok' | 'poor'` based on the average visibility score of 8 key body landmarks (shoulders, elbows, hips, knees). If the average visibility < `LIGHTING_VISIBILITY_THRESHOLD` (0.5), returns `'poor'`. Returns `'ok'` when fewer than 4 of the 8 landmarks have a defined visibility value (fail-open — can't assess). Returns `'ok'` for invalid/missing landmarks.

2. **AC2: Lighting State Atom** — A `lightingPoorAtom: atom<boolean>(false)` in `pose-store.ts` tracks whether lighting conditions are currently poor. Follows `subjectTooFarAtom` boolean pattern.

3. **AC3: Lighting Detection Hook** — A `useLightingDetection()` hook subscribes to `poseResultAtom` and writes to `lightingPoorAtom`. Samples every `LIGHTING_SAMPLE_INTERVAL_MS` (2000ms — lighting changes slowly). Requires `LIGHTING_POOR_DEBOUNCE` (3) consecutive "poor" readings to set the atom to `true`. Clears to `false` immediately on a single "ok" reading (asymmetric debounce).

4. **AC4: Warning Display** — A `LightingWarning` component reads `lightingPoorAtom`. When `true`, displays a subtle pill at the top of the screen with the message "Try more lighting". Positioned at `top-4 left-1/2 -translate-x-1/2` — separate from the distance/framing/correction warning area at `top-1/3`. Uses `text-amber-200` for a warm, gentle tone (not alarming white or red).

5. **AC5: Non-Blocking** — The lighting warning does NOT suppress `SubjectDistanceWarning`, `SubjectFramingWarning`, or `PoseCorrectionPrompt`. It is an independent, ambient indicator that coexists with all other UI. The user can still take photos and receive pose corrections while the lighting warning is visible.

6. **AC6: Warning Dismissal** — The warning disappears when landmark visibility improves (average >= threshold). The hook clears `lightingPoorAtom` immediately (no debounce for clearing).

7. **AC7: CameraScreen Integration** — `useLightingDetection()` is called in `CameraScreen` alongside the other detection hooks. `LightingWarning` is rendered in the camera view area.

## Tasks / Subtasks

- [x] Task 1 (AC: #1)
  - [x] 1.1 Create `src/lib/utils/detect-lighting.ts` with `detectLighting(landmarks): 'ok' | 'poor'`
  - [x] 1.2 Create `src/lib/utils/detect-lighting.test.ts` with visibility threshold tests
- [x] Task 2 (AC: #2)
  - [x] 2.1 Add `lightingPoorAtom` to `src/lib/stores/pose-store.ts`
- [x] Task 3 (AC: #3)
  - [x] 3.1 Add `LIGHTING_VISIBILITY_THRESHOLD`, `LIGHTING_SAMPLE_INTERVAL_MS`, `LIGHTING_POOR_DEBOUNCE` to `src/constants/app.constants.ts`
  - [x] 3.2 Create `src/lib/hooks/use-lighting-detection.ts`
  - [x] 3.3 Create `src/lib/hooks/use-lighting-detection.test.tsx`
- [x] Task 4 (AC: #4)
  - [x] 4.1 Create `src/components/camera/lighting-warning.tsx`
  - [x] 4.2 Create `src/components/camera/lighting-warning.test.tsx`
- [x] Task 5 (AC: #7)
  - [x] 5.1 Wire `useLightingDetection()` and `LightingWarning` in `CameraScreen`
  - [x] 5.2 Add mock and test for `LightingWarning` in `camera-screen.test.tsx`

## Dev Notes

### Detection Approach — Landmark Visibility as Proxy

This story uses average landmark visibility as a proxy for lighting quality. This is the "basic implementation" explicitly allowed by the AC ("nice to have for MVP — basic implementation acceptable"). The retro PT-1 identified three approaches: landmark visibility, pixel-level analysis, or skip. Landmark visibility was chosen because:

1. No new infrastructure — reuses existing `poseResultAtom` data
2. Follows the exact same detect → hook → component pattern as Stories 5.1/5.2
3. Testable with existing test fixture approach
4. MediaPipe visibility scores correlate with detection confidence, which degrades in poor lighting

**Limitations:** Visibility indicates occlusion likelihood, not lighting directly. Low visibility can also mean partial occlusion or unusual poses. For MVP this tradeoff is acceptable. A future enhancement could add canvas pixel brightness analysis.

### Detection Algorithm

Check the average visibility score of 8 key body landmarks. MediaPipe returns visibility as 0.0–1.0 (higher = more confident the landmark is visible in the image).

```
Landmarks checked:
  11: Left shoulder     12: Right shoulder
  13: Left elbow        14: Right elbow
  23: Left hip          24: Right hip
  25: Left knee         26: Right knee

Algorithm:
1. Extract all 8 landmarks
2. Collect visibility values (skip undefined — some MediaPipe versions omit visibility)
3. If fewer than 4 landmarks have defined visibility → return 'ok' (can't assess, fail-open)
4. Compute average visibility of those with defined values
5. If average < LIGHTING_VISIBILITY_THRESHOLD (0.5) → 'poor'
6. Otherwise → 'ok'
```

### Utility Structure — Follow `detect-distance.ts`

`detect-lighting.ts` follows the structure of `detect-distance.ts`:

```typescript
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { LIGHTING_VISIBILITY_THRESHOLD } from "@/constants/app.constants";

const KEY_LANDMARK_INDICES = [11, 12, 13, 14, 23, 24, 25, 26];

export function detectLighting(landmarks: NormalizedLandmark[]): "ok" | "poor" {
  if (!landmarks || landmarks.length < 33) return "ok";

  const visibilities: number[] = [];
  for (const idx of KEY_LANDMARK_INDICES) {
    const lm = landmarks[idx];
    if (lm && Number.isFinite(lm.visibility) && lm.visibility !== undefined) {
      visibilities.push(lm.visibility);
    }
  }

  if (visibilities.length < 4) return "ok";

  const avg = visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
  return avg < LIGHTING_VISIBILITY_THRESHOLD ? "poor" : "ok";
}
```

Key difference from `detect-distance.ts` and `detect-framing.ts`: this utility does NOT use `isValidLandmark` or `getLandmark` helpers. It reads raw visibility values instead of validating position coordinates. Do NOT copy the `MIN_VISIBILITY = 0.1` filtering — that would exclude exactly the landmarks we need to measure.

### Hook Structure — Follow `use-distance-detection.ts`

`use-lighting-detection.ts` follows the same throttle + debounce pattern as `use-distance-detection.ts`:

```typescript
export function useLightingDetection(): void {
  const poseResult = useAtomValue(poseResultAtom);
  const setLightingPoor = useSetAtom(lightingPoorAtom);

  const lastSampleTimeRef = useRef(0);
  const poorCountRef = useRef(0);

  useEffect(() => {
    // Guard: valid landmarks
    // Guard: throttle (2000ms)
    // detectLighting(landmarks) → result
    // If 'ok' → reset counter, clear atom immediately
    // If 'poor' → increment counter, set atom if >= LIGHTING_POOR_DEBOUNCE (3)
  }, [poseResult, setLightingPoor]);
}
```

### Component — Subtle Indicator at Top of Screen

`lighting-warning.tsx` is positioned at the TOP of the screen (`top-4`), separate from the distance/framing/correction warning area (`top-1/3`). This ensures it never overlaps with other warnings and is clearly an ambient, non-blocking indicator.

```typescript
export function LightingWarning() {
  const lightingPoor = useAtomValue(lightingPoorAtom);

  if (!lightingPoor) return null;

  return (
    <div
      data-testid="lighting-warning"
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-20"
    >
      <p className="rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-amber-200 backdrop-blur-sm">
        Try more lighting
      </p>
    </div>
  );
}
```

Visual differences from `SubjectDistanceWarning` / `SubjectFramingWarning`:

- Position: `top-4` (top of screen) vs `top-1/3` (center area)
- Text size: `text-xs` vs `text-sm` (subtler)
- Padding: `px-3 py-1.5` vs `px-4 py-2` (smaller pill)
- Color: `text-amber-200` vs `text-white` (warm, gentle tone — AC requires "not alarming red error")

### Warning Independence — No Priority Chain Changes

Unlike Stories 5.1 and 5.2 which established a priority chain (distance suppresses framing, framing suppresses corrections), the lighting warning is fully independent:

| Component                | Reads lightingPoorAtom? | Suppressed by lightingPoor?      |
| ------------------------ | ----------------------- | -------------------------------- |
| `SubjectDistanceWarning` | No                      | No                               |
| `SubjectFramingWarning`  | No                      | No                               |
| `PoseCorrectionPrompt`   | No                      | No                               |
| `LightingWarning`        | Yes                     | N/A (it IS the lighting display) |

This means `LightingWarning` renders at `top-4` while distance/framing/correction warnings render at `top-1/3` simultaneously if both conditions are met.

Do NOT modify `PoseCorrectionPrompt`, `SubjectDistanceWarning`, or `SubjectFramingWarning`.

### Constants — `app.constants.ts`

Add three constants, grouped after the framing detection section:

```typescript
// Lighting detection
export const LIGHTING_VISIBILITY_THRESHOLD = 0.5;
export const LIGHTING_SAMPLE_INTERVAL_MS = 2000;
export const LIGHTING_POOR_DEBOUNCE = 3;
```

Rationale for values:

- `0.5` threshold: MediaPipe landmark visibility > 0.7 in good lighting, < 0.5 in poor conditions. Empirical — may need tuning.
- `2000ms` sample interval: Lighting changes slowly (room lights, position changes). Same as `SCENE_SAMPLE_INTERVAL_MS`.
- `3` debounce: Prevents flicker. Same as `SCENE_DEBOUNCE_COUNT`. 3 readings at 2000ms = 6 seconds before warning appears.

### CameraScreen Wiring

In `src/components/screens/camera-screen.tsx`:

```typescript
import { useLightingDetection } from '@/lib/hooks/use-lighting-detection';
import { LightingWarning } from '@/components/camera/lighting-warning';

// Inside CameraScreen, alongside existing hooks:
useLightingDetection();

// In JSX, inside the camera view area (order doesn't matter — they don't overlap):
<LightingWarning />
```

### Test Fixtures — Retro AI-1: Realistic Visibility Values

Test fixtures MUST use plausible visibility values validated against the threshold (0.5).

**"Poor lighting" fixture** — average visibility < 0.5:

```typescript
// 8 landmarks with visibility averaging ~0.35
// Shoulders: 0.3, 0.4  Elbows: 0.35, 0.3  Hips: 0.4, 0.35  Knees: 0.3, 0.4
```

**"Good lighting" fixture** — average visibility >= 0.5:

```typescript
// 8 landmarks with visibility averaging ~0.85
// Shoulders: 0.9, 0.85  Elbows: 0.8, 0.9  Hips: 0.85, 0.8  Knees: 0.9, 0.85
```

**Boundary test** — average visibility exactly at 0.5:

```typescript
// Average = 0.5 → 'ok' (threshold is exclusive: avg < 0.5 → poor)
```

**Insufficient visibility data** — fewer than 4 defined:

```typescript
// Only 3 of 8 landmarks have defined visibility → return 'ok' (fail-open)
```

**Undefined visibility** — all visibility undefined:

```typescript
// All 8 landmarks have visibility = undefined → 0 defined → return 'ok'
```

### Project Structure Notes

| File                              | Action   | Location Rationale                                            |
| --------------------------------- | -------- | ------------------------------------------------------------- |
| `detect-lighting.ts`              | New      | `lib/utils/` — pure utility, follows `detect-distance.ts`     |
| `detect-lighting.test.ts`         | New      | Co-located with source                                        |
| `use-lighting-detection.ts`       | New      | `lib/hooks/` — follows `use-distance-detection.ts`            |
| `use-lighting-detection.test.tsx` | New      | Co-located with source                                        |
| `lighting-warning.tsx`            | New      | `components/camera/` — follows `subject-distance-warning.tsx` |
| `lighting-warning.test.tsx`       | New      | Co-located with source                                        |
| `pose-store.ts`                   | Modified | Add 1 atom                                                    |
| `app.constants.ts`                | Modified | Add 3 constants                                               |
| `camera-screen.tsx`               | Modified | Wire hook + component                                         |
| `camera-screen.test.tsx`          | Modified | Add mock + test                                               |

### Epic 4 Retro Enforcement

| Retro Item                        | Enforcement in This Story                                                                                                                                                                              |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **AI-1**: Realistic Test Fixtures | Visibility test values must be plausible (0.0–1.0 range). Validate fixture averages against 0.5 threshold. Don't use extreme values (all 0.0 or all 1.0) except for boundary tests.                    |
| **AI-2**: Hook Composition Rule   | `useLightingDetection` reads `poseResultAtom` directly via `useAtomValue`. Writes `lightingPoorAtom` via `useSetAtom`. Does NOT call `useDistanceDetection`, `useFramingDetection`, or any other hook. |
| **AI-3**: API Consistency         | `lightingPoorAtom` follows `subjectTooFarAtom` boolean pattern. Name follows `[feature][Field]Atom`.                                                                                                   |
| **AI-4**: Test Assertion Depth    | Tests must verify exact threshold boundary behavior (avg 0.49 → poor, avg 0.50 → ok), debounce count behavior, fail-open when insufficient visibility data, and atom state values.                     |

### Story 5.1/5.2 Learnings Applied

- **Zero debug issues** in Stories 5.1 and 5.2. The detect → hook → component pattern is proven.
- **Asymmetric debounce** pattern (slow to warn, fast to clear) carried forward.
- **CameraScreen wiring** is additive — just add one hook call and one component.
- **Key difference**: Lighting is independent and non-blocking. Unlike distance (which suppresses framing/corrections), lighting coexists with everything.
- **Key difference**: Utility reads raw visibility values instead of validated positions. Do NOT use `isValidLandmark`/`getLandmark` helpers from other detect utilities.

### DO NOT

- Do NOT import from `detect-distance.ts` or `detect-framing.ts` — keep utilities independent
- Do NOT use `isValidLandmark` or `getLandmark` helpers — this utility reads raw visibility, not validated positions
- Do NOT filter out landmarks with `visibility < MIN_VISIBILITY` (0.1) — those are exactly what we need to measure
- Do NOT modify `PoseCorrectionPrompt` — lighting is non-blocking, no suppression needed
- Do NOT modify `SubjectDistanceWarning` or `SubjectFramingWarning` — lighting is independent
- Do NOT modify `usePoseDetection` — lighting detection is a separate concern at CameraScreen level
- Do NOT use error styling (red, alert icons) — AC requires "gentle icon, not alarming red error"
- Do NOT use `text-white` for the warning text — use `text-amber-200` to differentiate from distance/framing warnings
- Do NOT position at `top-1/3` — use `top-4` to avoid overlapping with distance/framing/correction warnings
- Do NOT add pixel-level brightness analysis — landmark visibility proxy is the MVP approach

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-5-subject-detection-edge-case-handling.md] Story 5.3 ACs
- [Source: _bmad-output/implementation-artifacts/5-1-subject-distance-detection.md] Previous story — detect-distance pattern, hook pattern, component pattern
- [Source: _bmad-output/implementation-artifacts/5-2-subject-framing-detection.md] Previous story — detect-framing pattern, warning priority chain, camera mirror logic
- [Source: _bmad-output/implementation-artifacts/epic-4-retro.md] Retro action items AI-1 through AI-4, PT-1 lighting research task
- [Source: src/lib/utils/detect-distance.ts] Utility structure — landmark validation, fail-open, threshold comparison
- [Source: src/lib/utils/detect-scene.ts] Landmark indices reference, visibility handling pattern
- [Source: src/lib/hooks/use-distance-detection.ts] Hook structure — throttle + debounce, atom reads/writes
- [Source: src/components/camera/subject-distance-warning.tsx] Component structure — conditional render, a11y, styling
- [Source: src/lib/stores/pose-store.ts] Atom conventions — subjectTooFarAtom boolean pattern
- [Source: src/components/camera/pose-correction-prompt.tsx:63] Current suppression logic — subjectTooFar + subjectFraming checks. Do NOT modify.
- [Source: src/components/screens/camera-screen.tsx:28-30] Hook wiring pattern — useSceneDetection(), useDistanceDetection(), useFramingDetection()
- [Source: src/components/screens/camera-screen.test.tsx:43-65] Mock pattern for hooks and components
- [Source: src/constants/app.constants.ts:24-27] Framing detection constants — naming pattern
- [Source: _bmad-output/project-context.md] File naming, atom naming, hook naming, test placement conventions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (anthropic/claude-opus-4.6)

### Debug Log References

No debug issues encountered. Clean implementation following proven detect → hook → component pattern from Stories 5.1/5.2.

### Completion Notes List

- Task 1: Created `detectLighting()` utility with 11 tests covering good/poor/boundary/fail-open/mixed visibility scenarios. Uses raw visibility values (not `isValidLandmark`). Threshold at 0.5, requires 4+ defined visibility values.
- Task 2: Added `lightingPoorAtom: atom<boolean>(false)` to pose-store following `subjectTooFarAtom` pattern.
- Task 3: Added 3 constants (`LIGHTING_VISIBILITY_THRESHOLD=0.5`, `LIGHTING_SAMPLE_INTERVAL_MS=2000`, `LIGHTING_POOR_DEBOUNCE=3`). Created `useLightingDetection()` hook with 7 tests covering debounce (3 consecutive), immediate clear, throttle, and edge cases.
- Task 4: Created `LightingWarning` component at `top-4` position with `text-amber-200` styling, 5 tests covering render/hide/a11y/reactivity.
- Task 5: Wired hook and component into CameraScreen. Added mock and render test. All 244 tests pass across 30 suites with zero regressions.

### Senior Developer Review (AI)

**Reviewer:** Ami
**Outcome:** Approved — 3 Medium, 3 Low issues found and resolved.

- [FIXED][MEDIUM] `detect-lighting.ts:12` — Removed dead code: `lm.visibility !== undefined` was unreachable after `Number.isFinite(lm.visibility)`. Also removed unnecessary non-null assertion `lm.visibility!`.
- [FIXED][MEDIUM] `use-lighting-detection.test.tsx` — Added test: "keeps lightingPoorAtom true when landmarks are lost after being set" to document the intentional no-clear-on-lost-landmarks behavior.
- [FIXED][MEDIUM] `app.constants.ts:31` — Changed `LIGHTING_SAMPLE_INTERVAL_MS = 2000` to `2_000` for consistency with `SCENE_SAMPLE_INTERVAL_MS = 2_000`.
- [FIXED][LOW] `detect-lighting.ts:13` — Replaced `lm.visibility!` with `lm.visibility as number` (cleaner after guard fix).
- [FIXED][LOW] `pose-store.ts` — Moved `import { WorkerErrorDetail }` from mid-file to top-of-file imports.
- [NOTE][LOW] All 3 detection hooks (5-1, 5-2, 5-3) intentionally do not clear atoms when landmarks are lost. Should be discussed in Epic 5 retrospective.

All ACs verified as implemented. 33 tests pass (1 new test added).

### Change Log

- Code review passed — 3 Medium issues fixed, 1 test added. Story status set to done.
- Implemented lighting condition warning (Story 5.3) — detect utility, atom, hook, component, CameraScreen integration. 23 new tests added.

### File List

- `src/lib/utils/detect-lighting.ts` (new)
- `src/lib/utils/detect-lighting.test.ts` (new)
- `src/lib/hooks/use-lighting-detection.ts` (new)
- `src/lib/hooks/use-lighting-detection.test.tsx` (new)
- `src/components/camera/lighting-warning.tsx` (new)
- `src/components/camera/lighting-warning.test.tsx` (new)
- `src/lib/stores/pose-store.ts` (modified)
- `src/constants/app.constants.ts` (modified)
- `src/components/screens/camera-screen.tsx` (modified)
- `src/components/screens/camera-screen.test.tsx` (modified)
