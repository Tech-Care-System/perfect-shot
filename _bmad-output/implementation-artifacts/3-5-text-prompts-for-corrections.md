# Story 3.5: Text Prompts for Corrections

Status: done

## Story

As a user,
I want to see one corrective suggestion at a time telling me how to adjust my pose,
so that I am not overwhelmed with too much feedback.

## Acceptance Criteria

1. **AC1: Single Correction Display** — Given my pose does not match the target (score < 0.90) and a target pose is loaded, when the system analyzes the pose difference, then a single text prompt appears (e.g., "Raise your arms" or "Straighten up"). Only one correction is shown at a time.

2. **AC2: Priority-Based Selection** — Given multiple body parts are misaligned, when corrections are generated, then the most impactful correction is shown first. Priority order: torso (shoulders + hips) > arms (elbows + wrists) > legs (knees + ankles).

3. **AC3: Reactive Updates** — Given the user is adjusting their pose, when the pose changes, then the correction text updates to reflect the next most impactful correction. The displayed text holds for at least 1 second before switching to prevent flickering.

4. **AC4: Hide on Match** — Given the pose similarity score reaches >= 0.90, when the score crosses the threshold, then the correction prompt disappears.

5. **AC5: Hide When Inactive** — Given no target pose is loaded (`targetPoseAtom` is null), then no correction prompt is rendered.

6. **AC6: Casual Tone** — Correction messages use friendly, casual language with relative body-part references (e.g., "Move your hands up" not "Increase wrist y-axis displacement").

7. **AC7: Accessibility** — The correction prompt has `aria-live="polite"` so screen readers announce changes without interrupting.

## Tasks / Subtasks

- [x] Task 1 (AC: #1, #2, #6)
  - [x] 1.1 Export `extractMatchingLandmarks` from `src/lib/utils/calculate-similarity.ts` (currently private)
  - [x] 1.2 Create `src/lib/utils/generate-correction.ts`
  - [x] 1.3 Implement `generateCorrection(detected: NormalizedLandmark[], target: TargetPose): string | null`
  - [x] 1.4 Inside: extract matching landmarks, center on hips, normalize by torso length (reuse exported functions from calculate-similarity.ts)
  - [x] 1.5 Compare each body part pair's normalized position; compute distance per body segment
  - [x] 1.6 Return the highest-priority correction message for the body segment with the largest deviation above threshold, or `null` if all segments are within tolerance
- [x] Task 2 (AC: #1, #4, #5)
  - [x] 2.1 Add `poseCorrectionAtom` to `src/lib/stores/pose-store.ts`: `atom<string | null>(null)`
  - [x] 2.2 In `src/lib/hooks/use-pose-detection.ts` onMessage handler, after `setPoseScore`, call `generateCorrection` and set `poseCorrectionAtom` when score < 0.90; set `null` when score >= 0.90 or no target/landmarks
- [x] Task 3 (AC: #1, #3, #4, #5, #7)
  - [x] 3.1 Create `src/components/camera/pose-correction-prompt.tsx`
  - [x] 3.2 Subscribe to `poseCorrectionAtom` and `targetPoseAtom` via `useAtomValue`
  - [x] 3.3 Return `null` when `targetPoseAtom` is null or `poseCorrectionAtom` is null
  - [x] 3.4 Implement 1-second hold: track displayed text and last-change timestamp via `useRef`; only update displayed text if correction changed AND >= 1s elapsed
  - [x] 3.5 Render centered text with semi-transparent background, `pointer-events-none`, `z-20`
  - [x] 3.6 Add `aria-live="polite"` and `role="status"`
- [x] Task 4 (AC: #3)
  - [x] 4.1 Mount `<PoseCorrectionPrompt />` in `src/components/screens/camera-screen.tsx` inside the camera container div, after `<FeedbackGlow />`
- [x] Task 5 (AC: #1, #2, #6)
  - [x] 5.1 Create `src/lib/utils/generate-correction.test.ts`
  - [x] 5.2 Test: returns `null` for identical poses (no correction needed)
  - [x] 5.3 Test: returns shoulder correction when shoulders are most misaligned
  - [x] 5.4 Test: returns arm correction when elbows/wrists are most misaligned
  - [x] 5.5 Test: returns `null` for null/empty inputs
  - [x] 5.6 Test: priority — shoulder correction takes precedence over arm correction when both are misaligned equally
  - [x] 5.7 Test: correction text uses casual language (no technical jargon)
- [x] Task 6 (AC: #1, #3, #4, #5, #7)
  - [x] 6.1 Create `src/components/camera/pose-correction-prompt.test.tsx`
  - [x] 6.2 Test: renders nothing when `targetPoseAtom` is null
  - [x] 6.3 Test: renders nothing when `poseCorrectionAtom` is null
  - [x] 6.4 Test: renders correction text when `poseCorrectionAtom` has a string
  - [x] 6.5 Test: has `aria-live="polite"` and `role="status"`

## Dev Notes

### Architecture Overview

This story has two halves:

1. **Correction generator** — Pure utility function that compares normalized poses and returns a single correction string
2. **Correction prompt** — Display component that reads the correction atom and renders it with a hold timer

### Correction Generator: `src/lib/utils/generate-correction.ts`

**Algorithm:**

1. Extract matching landmarks (reuse `extractMatchingLandmarks` — needs to be exported from `calculate-similarity.ts`)
2. Center on hips and normalize by torso length (reuse `centerOnHips`, `normalizeByTorsoLength` — already exported)
3. For each body segment, compute the average displacement between detected and target normalized positions
4. Find the segment with the largest displacement above a minimum threshold
5. Map the displacement direction to a user-friendly correction message
6. Return the message string, or `null` if all segments are close enough

**Body Segments and Subset Indices:**

After `extractMatchingLandmarks`, the subset array has 12 elements:

```
Index 0: left shoulder (landmark 11)    Index 1: right shoulder (landmark 12)
Index 2: left elbow (landmark 13)       Index 3: right elbow (landmark 14)
Index 4: left wrist (landmark 15)       Index 5: right wrist (landmark 16)
Index 6: left hip (landmark 23)         Index 7: right hip (landmark 24)
Index 8: left knee (landmark 25)        Index 9: right knee (landmark 26)
Index 10: left ankle (landmark 27)      Index 11: right ankle (landmark 28)
```

**Segment Groups (with priority):**

```typescript
const SEGMENTS = [
  { name: "shoulders", indices: [0, 1], priority: 1 },
  { name: "hips", indices: [6, 7], priority: 2 },
  { name: "elbows", indices: [2, 3], priority: 3 },
  { name: "wrists", indices: [4, 5], priority: 4 },
  { name: "knees", indices: [8, 9], priority: 5 },
  { name: "ankles", indices: [10, 11], priority: 6 },
];
```

**Displacement Threshold:** `0.15` in normalized space (after torso-length normalization). Below this, the segment is "close enough".

**Message Generation (casual tone per UX11):**

For each segment, determine the dominant direction of displacement (dx vs dy) and generate a message:

```
Shoulders:
  dy > 0 → "Relax your shoulders down"
  dy < 0 → "Raise your shoulders a bit"
  dx dominant → "Level your shoulders"

Hips:
  dy dominant → "Sit up straighter"
  dx > 0 → "Shift your weight to the right"
  dx < 0 → "Shift your weight to the left"

Elbows/Arms:
  dy > 0 → "Raise your arms higher"
  dy < 0 → "Lower your arms a bit"
  dx dominant → "Bring your arms in/out"

Wrists/Hands:
  dy > 0 → "Move your hands up"
  dy < 0 → "Move your hands down"
  dx > 0 → "Move your hands to the right"
  dx < 0 → "Move your hands to the left"

Knees:
  dy dominant → "Bend your knees more" / "Straighten your knees"

Ankles:
  dx dominant → "Adjust your stance"
```

Note: In normalized space after centering, positive y is downward (screen coords). Corrections should reference the user's perspective. Since the camera may be mirrored (front camera), left/right messages should use the user's body-relative directions, which means NOT flipping — the normalized landmarks from MediaPipe already represent the user's body parts (landmark 11 = user's left shoulder regardless of camera).

**Edge Cases:**

- Return `null` if either pose is null/empty or extraction fails
- Return `null` if no segment exceeds the threshold (pose is close enough)
- If score >= 0.90, the caller (usePoseDetection) sets the atom to `null` — the generator is not called

### Integration with Detection Loop

In `src/lib/hooks/use-pose-detection.ts`, modify the onMessage handler:

```typescript
// After existing similarity calculation:
const target = targetPoseRef.current;
if (target && response.payload.landmarks?.[0]) {
  const score = calculatePoseSimilarity(response.payload.landmarks[0], target);
  setPoseScore(score);

  // NEW: Generate correction when not matched
  if (score < POSE_THRESHOLD) {
    setPoseCorrection(
      generateCorrection(response.payload.landmarks[0], target),
    );
  } else {
    setPoseCorrection(null);
  }
} else {
  setPoseScore(0);
  setPoseCorrection(null); // NEW
}
```

Use a ref for `poseCorrectionAtom` setter to avoid adding it to the dependency array of the onMessage callback. Follow the same `targetPoseRef` pattern already in use.

### Modify `calculate-similarity.ts`

Only change: add `export` keyword to `extractMatchingLandmarks` (line 34). This function is currently used internally but the correction generator needs it. No logic changes.

```diff
- function extractMatchingLandmarks(landmarks: NormalizedLandmark[]): NormalizedLandmark[] {
+ export function extractMatchingLandmarks(landmarks: NormalizedLandmark[]): NormalizedLandmark[] {
```

### Display Component: `src/components/camera/pose-correction-prompt.tsx`

**Component pattern:** Same as `FeedbackGlow` — pure Jotai consumer, overlay on camera view.

**Hold timer:** Track `displayedText` and `lastChangeTime` via refs. On each render, if `poseCorrectionAtom` changed and >= 1000ms since last change, update `displayedText`. This prevents flickering at 30 FPS when corrections oscillate.

```typescript
export function PoseCorrectionPrompt() {
  const correction = useAtomValue(poseCorrectionAtom);
  const target = useAtomValue(targetPoseAtom);
  const [displayedText, setDisplayedText] = useState<string | null>(null);
  const lastChangeRef = useRef(0);

  useEffect(() => {
    if (!correction) {
      setDisplayedText(null);
      return;
    }
    const now = Date.now();
    if (now - lastChangeRef.current >= 1000) {
      setDisplayedText(correction);
      lastChangeRef.current = now;
    }
  }, [correction]);

  if (!target || !displayedText) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 z-20"
    >
      <p className="rounded-xl bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
        {displayedText}
      </p>
    </div>
  );
}
```

**Positioning:** `top-1/3 left-1/2 -translate-x-1/2` — centered horizontally, in the upper third of the camera view where the user's body is visible. Z-index 20 (same layer as glow, both are non-interactive overlays).

**Mount in `camera-screen.tsx`:**

```tsx
<div className="relative h-full w-full">
  <CameraPreview />
  <WireframeCanvas />
  <FeedbackGlow />
  <PoseCorrectionPrompt />
  <PoseHintCard /> {/* from 3.4 if merged */}
</div>
```

### Z-Index Stack Reference

| Layer             | Z-Index | Component                              |
| ----------------- | ------- | -------------------------------------- |
| Video             | z-0     | `CameraPreview`                        |
| Wireframe         | z-10    | `WireframeCanvas`                      |
| Glow / Correction | z-20    | `FeedbackGlow`, `PoseCorrectionPrompt` |
| Start overlay     | z-30    | Start Camera button                    |
| Hint Card         | z-50    | `PoseHintCard` (Story 3.4)             |
| Controls          | z-100   | `ControlBar`                           |

### DO NOT

- Do NOT modify `calculatePoseSimilarity` function logic — only export `extractMatchingLandmarks`
- Do NOT show multiple corrections simultaneously — always single text
- Do NOT include head/face corrections — landmarks 0-10 are excluded from MATCHING_LANDMARK_INDICES
- Do NOT use technical coordinate language in correction messages — casual tone only
- Do NOT create a separate hook for correction logic — keep it in the onMessage handler for performance
- Do NOT add `poseCorrectionAtom` to any useEffect dependency arrays in `usePoseDetection` — use the setter directly, it's stable

### Previous Story Learnings

- **Story 3.1**: `extractMatchingLandmarks` rejects landmarks with visibility < 0.1 and returns `[]` for invalid input. The correction generator must handle `[]` return (→ return `null`).
- **Story 3.1**: `centerOnHips` and `normalizeByTorsoLength` are already exported and work on the 12-element subset array. Reuse directly.
- **Story 3.1**: `useRef` pattern for `targetPoseAtom` in `usePoseDetection` prevents stale closures. Apply same pattern for any new atom setter.
- **Story 3.2**: Jotai test pattern uses `createStore()` + `store.set()` + `<Provider store={store}>` — follow for component tests.
- **Story 3.2**: `matchMedia` mock needed for `useSyncExternalStore` — not needed here (no media queries).
- **Story 3.3**: Tests verify drawing calls via mock functions — not applicable here (DOM-based component).

### Performance Note

`generateCorrection` runs on every POSE_RESULT message (~30 FPS). The function does: landmark extraction (~12 array lookups), centering (12 subtractions), normalization (12 divisions), 6 distance comparisons, and one string return. Total: < 0.1ms. No performance concern.

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-pose-matching-visual-feedback.md] Story 3.5 ACs and technical notes
- [Source: _bmad-output/planning-artifacts/ux-design/core-user-experience.md] "One Thing at a Time" principle, casual tone
- [Source: _bmad-output/planning-artifacts/ux-design/component-strategy.md] Z-index layering
- [Source: _bmad-output/planning-artifacts/archive/architecture.md] correctionsAtom in pose store, component locations
- [Source: src/lib/utils/calculate-similarity.ts] Normalization pipeline, exported helpers

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (via Ami)

### Debug Log References

None — clean implementation, no issues encountered.

### Completion Notes List

- Exported `extractMatchingLandmarks` from `calculate-similarity.ts` (was private)
- Created `generateCorrection` utility: extracts landmarks, centers on hips, normalizes by torso length, iterates segments by priority order (shoulders > hips > elbows > wrists > knees > ankles), returns first segment exceeding 0.15 displacement threshold with casual correction message
- Added `poseCorrectionAtom` to pose store
- Integrated correction generation into `usePoseDetection` onMessage handler: generates correction when score < POSE_THRESHOLD, clears when matched or no target
- Created `PoseCorrectionPrompt` component with 1-second hold timer to prevent flickering, aria-live="polite", z-20 overlay
- Mounted component in `camera-screen.tsx` after `FeedbackGlow`
- 6 unit tests for generateCorrection, 4 unit tests for PoseCorrectionPrompt
- Full regression suite: 16 suites, 114 tests, all pass

### Senior Developer Review (AI)

**Reviewer:** Code Review Workflow (Claude Opus 4.6)
**Outcome:** Approved with fixes applied

**Issues Found:** 1 High, 2 Medium, 2 Low
**Issues Fixed:** 3 (all HIGH and MEDIUM)

| #   | Severity | Issue                                                                                               | Fix Applied                                                                                                                        |
| --- | -------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| H1  | HIGH     | Hold timer bug — corrections permanently dropped when value changes within 1s window and stabilizes | Rewrote hold timer with `pendingRef` + `setTimeout` fallback: deferred corrections are shown after remaining hold duration expires |
| M1  | MEDIUM   | `poseCorrectionAtom` lacks JSDoc comment                                                            | Added JSDoc describing purpose and lifecycle                                                                                       |
| M2  | MEDIUM   | No tests for 1-second hold behavior (AC3)                                                           | Added 2 tests: hold prevents switching within 1s, deferred correction shows after hold period                                      |
| L1  | LOW      | No tests for leg (knee/ankle) corrections                                                           | Not fixed — existing segment tests sufficient                                                                                      |
| L2  | LOW      | Arm correction test regex overly broad                                                              | Not fixed — acceptable given casual naming                                                                                         |

### Change Log

- Implemented Story 3.5 — correction generator, correction atom, prompt component with tests
- Code review: fixed hold timer drop bug with setTimeout fallback, added JSDoc, added hold timer tests; status set to `done`.

### File List

- src/lib/utils/calculate-similarity.ts (modified — exported extractMatchingLandmarks)
- src/lib/utils/generate-correction.ts (new)
- src/lib/utils/generate-correction.test.ts (new)
- src/lib/stores/pose-store.ts (modified — added poseCorrectionAtom)
- src/lib/hooks/use-pose-detection.ts (modified — integrated correction generation)
- src/components/camera/pose-correction-prompt.tsx (new)
- src/components/camera/pose-correction-prompt.test.tsx (new)
- src/components/screens/camera-screen.tsx (modified — mounted PoseCorrectionPrompt)
