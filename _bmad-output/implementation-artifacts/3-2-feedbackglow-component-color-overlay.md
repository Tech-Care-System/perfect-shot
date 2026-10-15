# Story 3.2: FeedbackGlow Component (Color Overlay)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see a color glow around the screen indicating how close my pose is to the target**,
so that **I instantly know if I need to adjust**.

## Acceptance Criteria

### AC1: Red Glow (Far State)

**Given** a target pose is loaded and the pose similarity score is < 0.70
**When** the score updates
**Then** the screen shows a subtle red inset glow effect
**And** the glow uses color `rgba(239, 68, 68, 0.4)` (per design tokens)

### AC2: Yellow Glow with Pulse (Close State)

**Given** a target pose is loaded and the pose similarity score is between 0.70 and 0.89
**When** the score updates
**Then** the screen shows a yellow inset glow effect using `rgba(245, 158, 11, 0.5)`
**And** the glow pulses continuously (per UX5)

### AC3: Green Glow + White Flash (Match State)

**Given** a target pose is loaded and the pose similarity score is >= 0.90
**When** the score updates
**Then** the screen shows a green inset glow effect using `rgba(16, 185, 129, 0.5)`
**And** a brief white flash overlay appears for 150ms when the score first crosses 0.90 (per UX6)
**And** the flash does NOT re-trigger while the score remains >= 0.90
**And** the flash CAN re-trigger if the score drops below 0.90 and crosses back up

### AC4: Color Transitions

**Given** the glow color is changing between states
**When** the score crosses a threshold
**Then** the color transition uses 300ms ease-in-out (per UX4)

### AC5: Z-Index Layering

**Given** the camera screen is active
**When** the FeedbackGlow is rendered
**Then** the glow layer is at z-index 20 (per UX3)
**And** the glow is above the wireframe (z-10) and below controls (z-100)
**And** the glow does not capture pointer events

### AC6: Accessibility

**Given** the user has enabled `prefers-reduced-motion` in their OS
**When** the FeedbackGlow is active
**Then** the yellow pulse animation is disabled (per UX7)
**And** color transitions still occur but without animation

### AC7: Inactive State

**Given** no target pose is loaded (`targetPoseAtom` is null)
**When** the camera screen is active
**Then** the FeedbackGlow renders nothing (no glow visible)

## Tasks / Subtasks

- [x] **Task 1: Add Constants** (AC: #1, #2, #3)
  - [x] 1.1 Add `POSE_CLOSE_THRESHOLD = 0.7` to `src/constants/app.constants.ts`
  - [x] 1.2 Add `MATCH_FLASH_DURATION_MS = 150` to `src/constants/app.constants.ts`
  - [x] 1.3 Add `FEEDBACK_TRANSITION_MS = 300` to `src/constants/app.constants.ts`

- [x] **Task 2: Create FeedbackGlow Component** (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 2.1 Create `src/components/camera/feedback-glow.tsx`
  - [x] 2.2 Subscribe to `poseScoreAtom` via `useAtomValue`
  - [x] 2.3 Subscribe to `targetPoseAtom` via `useAtomValue` — render nothing when null
  - [x] 2.4 Determine glow state: `'red'` (< 0.70), `'yellow'` (0.70–0.89), `'green'` (>= 0.90)
  - [x] 2.5 Render absolutely-positioned `div` with `pointer-events-none`, `inset-0`, `z-20`
  - [x] 2.6 Apply inset `box-shadow` for glow effect with 300ms ease-in-out `transition`
  - [x] 2.7 Add CSS `@keyframes` pulse animation for yellow state
  - [x] 2.8 Implement white flash: track previous score via `useRef`, trigger 150ms white overlay on transition to >= 0.90, auto-dismiss via `setTimeout`
  - [x] 2.9 Use `prefers-reduced-motion` media query to disable pulse animation and reduce transitions

- [x] **Task 3: Mount in Camera Screen** (AC: #5)
  - [x] 3.1 Add `<FeedbackGlow />` to `src/components/screens/camera-screen.tsx` inside the camera container `div`, after `WireframeCanvas`

- [x] **Task 4: Unit Tests** (AC: ALL)
  - [x] 4.1 Create `src/components/camera/feedback-glow.test.tsx`
  - [x] 4.2 Test: renders nothing when `targetPoseAtom` is null
  - [x] 4.3 Test: renders red glow when score < 0.70
  - [x] 4.4 Test: renders yellow glow when score 0.70–0.89
  - [x] 4.5 Test: renders green glow when score >= 0.90
  - [x] 4.6 Test: white flash appears on transition to >= 0.90 and auto-dismisses
  - [x] 4.7 Test: white flash does NOT re-trigger while score stays >= 0.90
  - [x] 4.8 Test: glow div has correct z-index and pointer-events-none

## Dev Notes

### Component Design

FeedbackGlow is a pure Jotai consumer. It subscribes to `poseScoreAtom` and `targetPoseAtom` and renders a CSS-only overlay. No canvas drawing needed — the glow is an inset box-shadow on a `div`.

```typescript
// src/components/camera/feedback-glow.tsx
export function FeedbackGlow() {
  const score = useAtomValue(poseScoreAtom);
  const target = useAtomValue(targetPoseAtom);

  if (!target) return null;

  // Determine state from score + render glow div
}
```

### Glow Effect Implementation

Use CSS `box-shadow: inset` to create a vignette-like border glow. This avoids canvas overhead and leverages GPU-accelerated CSS transitions.

```css
/* Red state */
box-shadow: inset 0 0 60px 15px rgba(239, 68, 68, 0.4);

/* Yellow state */
box-shadow: inset 0 0 60px 20px rgba(245, 158, 11, 0.5);

/* Green state */
box-shadow: inset 0 0 60px 20px rgba(16, 185, 129, 0.5);

/* Transition */
transition: box-shadow 300ms ease-in-out;
```

### Yellow Pulse Animation

```css
@keyframes feedback-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.pulse {
  animation: feedback-pulse 1.5s ease-in-out infinite;
}
```

Use Tailwind's `motion-reduce:` variant or a `@media (prefers-reduced-motion: reduce)` block to disable:

```css
@media (prefers-reduced-motion: reduce) {
  .pulse {
    animation: none;
  }
}
```

### White Flash (One-Shot)

Track the previous score with a `useRef`. When the score transitions from < 0.90 to >= 0.90:

1. Set `flashVisible` state to `true`
2. `setTimeout(() => setFlashVisible(false), 150)`
3. Don't re-trigger while `prevScoreRef.current >= 0.90`

The flash is a separate `div` with `bg-white` and `opacity` transition, layered on top of the glow.

### Score Thresholds

Use constants from `src/constants/app.constants.ts`:

- `POSE_CLOSE_THRESHOLD` (0.7) — below this is red, above is yellow
- `POSE_THRESHOLD` (0.9) — already exists, above this is green/match

### Z-Index Stack (UX3)

| Layer         | Z-Index | Component                           |
| ------------- | ------- | ----------------------------------- |
| Video         | z-0     | `CameraPreview`                     |
| Wireframe     | z-10    | `WireframeCanvas`                   |
| Glow/FPS      | z-20    | `FeedbackGlow`, `PoseStatusOverlay` |
| Start overlay | z-30    | Start Camera button                 |
| Controls      | z-100   | `ControlBar`                        |

### Mount Location

Add `<FeedbackGlow />` inside the camera container in `camera-screen.tsx`, after `WireframeCanvas`:

```tsx
<div className="relative h-full w-full">
  <CameraPreview />
  <WireframeCanvas />
  <FeedbackGlow />
</div>
```

### Existing Code to Reuse

- `poseScoreAtom` from `src/lib/stores/pose-store.ts` (created in Story 3.1)
- `targetPoseAtom` from `src/lib/stores/pose-store.ts` (created in Story 3.1)
- `POSE_THRESHOLD = 0.9` from `src/constants/app.constants.ts` (already exists)
- `cn()` utility from `src/lib/utils` for conditional classnames
- `useAtomValue` from `jotai` (already used throughout)

### Naming Conventions

- File: `feedback-glow.tsx` (kebab-case)
- Component: `FeedbackGlow` (PascalCase, no suffix)
- Test: `feedback-glow.test.tsx` (co-located)
- Constants: `POSE_CLOSE_THRESHOLD`, `MATCH_FLASH_DURATION_MS`, `FEEDBACK_TRANSITION_MS` (SCREAMING_SNAKE_CASE)

### Testing

- Co-locate: `src/components/camera/feedback-glow.test.tsx`
- Mock Jotai atoms using the provider wrapper pattern from existing tests (e.g., `camera-preview.test.tsx`)
- For the white flash timeout, use `jest.useFakeTimers()` and `jest.advanceTimersByTime(150)`
- No canvas mocking needed — this is a pure DOM/CSS component

### Previous Story Learnings (from Story 3.1)

- `poseScoreAtom` is a primitive atom updated at 30 FPS in the `usePoseDetection` onMessage handler
- `targetPoseAtom` is null until a target pose is loaded (Epic 4); FeedbackGlow should render nothing in this state
- Use `useAtomValue` for read-only subscriptions — only FeedbackGlow should re-render when score changes, not parent components

### What This Story Does NOT Include

- Audio feedback on match (Story 6.3)
- Haptic feedback on match (Story 6.4)
- Smart shutter auto-capture on match (Story 6.1)
- Target pose loading (Epic 4)

### Project Structure Notes

- `src/components/camera/feedback-glow.tsx` aligns with architecture's component placement
- No conflicts with existing camera components
- `WireframeCanvas` is currently rendered in both `CameraPreview` and `CameraScreen` — this story does not address that duplication

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-pose-matching-visual-feedback.md#Story 3.2]
- [Source: _bmad-output/planning-artifacts/ux-design/design-direction.md#Animation Specs]
- [Source: _bmad-output/planning-artifacts/ux-design/visual-design-foundation.md#Feedback Colors]
- [Source: _bmad-output/planning-artifacts/ux-design/responsive-design-accessibility.md#prefers-reduced-motion]
- [Source: _bmad-output/project-context.md#Jotai Atom Naming]
- [Source: _bmad-output/implementation-artifacts/3-1-pose-similarity-calculation.md#Completion Notes]
- [Source: src/lib/stores/pose-store.ts]
- [Source: src/constants/app.constants.ts#POSE_THRESHOLD]
- [Source: src/components/screens/camera-screen.tsx]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `npx jest src/components/camera/feedback-glow.test.tsx` -- 10/10 passed
- `npx jest` -- full suite: 10 suites, 1 pre-existing failure (`pose-detector.test.ts`), 0 regressions

### Completion Notes List

- Added `POSE_CLOSE_THRESHOLD`, `MATCH_FLASH_DURATION_MS`, `FEEDBACK_TRANSITION_MS` constants
- Created `FeedbackGlow` component with CSS-only inset box-shadow glow (red/yellow/green states)
- Yellow state uses Tailwind `animate-pulse` with `motion-reduce:animate-none` for accessibility
- White flash triggers on score transition from <0.90 to >=0.90, auto-dismisses after 150ms via setTimeout, does not re-trigger while score stays above threshold
- Mounted `<FeedbackGlow />` in `camera-screen.tsx` after `WireframeCanvas` at z-20
- Component renders nothing when `targetPoseAtom` is null (inactive until target pose loaded)
- 10 unit tests covering all ACs: glow states, flash lifecycle, z-index, pointer-events, accessibility

### File List

- src/constants/app.constants.ts (MODIFIED)
- src/components/camera/feedback-glow.tsx (NEW)
- src/components/camera/feedback-glow.test.tsx (NEW)
- src/components/screens/camera-screen.tsx (MODIFIED)

### Senior Developer Review (AI)

**Reviewer:** Code Review Workflow (Claude Opus 4.6)
**Outcome:** Approved with fixes applied

**Issues Found:** 1 High, 2 Medium, 2 Low
**Issues Fixed:** 3 (all HIGH and MEDIUM)

| #   | Severity | Issue                                                                                            | Fix Applied                                                                                                           |
| --- | -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| H1  | HIGH     | Stale timeout on rapid score oscillation — multiple `setTimeout` calls without clearing previous | Added `clearTimeout(flashTimeoutRef.current)` before setting new timeout                                              |
| M1  | MEDIUM   | AC6 incomplete — `prefers-reduced-motion` did not disable box-shadow transition                  | Added `usePrefersReducedMotion` hook via `useSyncExternalStore`; sets transition to 0ms when reduced motion preferred |
| M2  | MEDIUM   | Missing test for flash re-trigger after drop-below-and-re-cross (AC3)                            | Added test case: score 0.5→0.95→0.5→0.92 verifies flash re-triggers                                                   |
| L1  | LOW      | Tailwind `animate-pulse` timing (2s) differs from dev notes spec (1.5s)                          | Not fixed — AC does not specify exact timing                                                                          |
| L2  | LOW      | Flash effects run when target is null                                                            | Not fixed — no practical impact since score defaults to 0                                                             |

### Change Log

- Implemented Story 3.2 FeedbackGlow component with tests; status set to `review`.
- Code review: fixed stale timeout bug, added prefers-reduced-motion for transitions, added re-trigger test; status set to `done`.
