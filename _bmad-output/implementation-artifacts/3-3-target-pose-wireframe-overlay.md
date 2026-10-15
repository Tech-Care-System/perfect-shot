# Story 3.3: Target Pose Wireframe Overlay

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see a target pose wireframe showing where I should position my body**,
so that **I have a clear guide to follow**.

## Acceptance Criteria

### AC1: Target Wireframe Rendering

**Given** a target pose is loaded into `targetPoseAtom`
**When** the camera screen is active
**Then** the target pose wireframe is drawn on the canvas using `drawConnectors` and `drawLandmarks`
**And** the wireframe uses all body connections from `POSE_CONNECTIONS`

### AC2: Visual Distinction

**Given** the target wireframe and the user's tracking wireframe are both visible
**When** they are drawn on the same canvas
**Then** the target wireframe uses a semi-transparent white color (`rgba(255, 255, 255, 0.35)`)
**And** the target wireframe uses thinner lines (lineWidth: 1) and smaller dots (radius: 2)
**And** the user's tracking wireframe remains cyan (`#00FFFF`) with its current styling
**And** the target wireframe is drawn BEFORE the user wireframe (appears behind)

### AC3: Scaling & Positioning

**Given** a target pose with normalized [0, 1] landmarks
**When** the wireframe is drawn
**Then** the target landmarks scale to the canvas dimensions using the same coordinate mapping as the user wireframe
**And** the target wireframe respects the current `fitMode` (cover/contain)

### AC4: Mirroring

**Given** the front-facing camera is active (facingMode = 'user')
**When** the canvas is mirrored via CSS `scale-x-[-1]`
**Then** the target wireframe is also mirrored (since it shares the same canvas)

### AC5: Inactive State

**Given** no target pose is loaded (`targetPoseAtom` is null)
**When** the camera screen is active
**Then** no target wireframe is drawn
**And** the user's tracking wireframe continues to render normally

## Tasks / Subtasks

- [x] **Task 1: Add Target Wireframe Style** (AC: #2)
  - [x] 1.1 Define `TARGET_WIREFRAME_STYLE` constant in `wireframe-canvas.tsx` with `color: 'rgba(255, 255, 255, 0.35)'`, `lineWidth: 1`, `radius: 2`

- [x] **Task 2: Integrate Target Pose Drawing** (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 In `WireframeCanvas`, subscribe to `targetPoseAtom` via `useAtomValue`
  - [x] 2.2 In the drawing `useEffect`, after `clearRect`, draw the target pose FIRST (if available) using `TARGET_WIREFRAME_STYLE`
  - [x] 2.3 Then draw the user's detected pose on top using existing `WIREFRAME_STYLE`
  - [x] 2.4 Apply the same `getObjectFitMappingStyle` mapping to the target wireframe style
  - [x] 2.5 Skip target drawing when `targetPoseAtom` is null

- [x] **Task 3: Update useEffect Dependencies** (AC: #1)
  - [x] 3.1 Add target pose to the drawing `useEffect` dependency array so the canvas redraws when target changes

- [x] **Task 4: Unit Tests** (AC: ALL)
  - [x] 4.1 Update `src/components/camera/wireframe-canvas.test.tsx`
  - [x] 4.2 Test: target wireframe draws when `targetPoseAtom` has data (verify `drawConnectors`/`drawLandmarks` called with target style)
  - [x] 4.3 Test: no target wireframe drawn when `targetPoseAtom` is null
  - [x] 4.4 Test: both wireframes drawn when both target and user poses exist (target first, user on top)

## Dev Notes

### Integration Approach

This story modifies the existing `WireframeCanvas` component rather than creating a new component. Both wireframes share one canvas, so coordinate mapping and mirroring are automatically consistent.

Drawing order:

1. `ctx.clearRect()` — clear previous frame
2. Draw target pose (semi-transparent white, behind) — if `targetPoseAtom` is not null
3. Draw user pose (cyan, on top) — if `poseResultAtom` has landmarks

### Target Wireframe Style

```typescript
const TARGET_WIREFRAME_STYLE = {
  color: "rgba(255, 255, 255, 0.35)",
  lineWidth: 1,
  radius: 2,
  shadowColor: "transparent",
  shadowBlur: 0,
};
```

This creates a "ghost guide" effect — visible enough to follow but clearly distinct from the bright cyan user tracking wireframe.

### Coordinate Mapping

The target pose uses the same `NormalizedLandmark` format (x, y in [0, 1]) as detected pose output. The existing `toCanvasPoint` function in `drawing.ts` handles the mapping, and the same `getObjectFitMappingStyle` function provides cover/contain corrections. No new coordinate logic needed.

### Existing Code to Reuse

- `drawConnectors` / `drawLandmarks` from `src/lib/utils/drawing.ts` (already imported in WireframeCanvas)
- `POSE_CONNECTIONS` from `src/lib/utils/pose-connections.ts` (same skeleton for target)
- `getObjectFitMappingStyle` in `wireframe-canvas.tsx` (same video-to-canvas mapping)
- `targetPoseAtom` from `src/lib/stores/pose-store.ts` (created in Story 3.1)
- `DrawingStyle` interface from `src/lib/utils/drawing.ts` (already supports all needed properties)

### File Locations (STRICT)

| File                                              | Purpose                                          |
| ------------------------------------------------- | ------------------------------------------------ |
| `src/components/camera/wireframe-canvas.tsx`      | MODIFY: add target pose subscription and drawing |
| `src/components/camera/wireframe-canvas.test.tsx` | MODIFY: add tests for target wireframe           |

### What This Story Does NOT Create

- No new files — this is a modification to `WireframeCanvas`
- No new atoms — `targetPoseAtom` already exists from Story 3.1
- No new drawing utilities — existing `drawConnectors`/`drawLandmarks` are reused with different style

### Previous Story Learnings (from Story 3.1 code review & 3.2)

- `targetPoseAtom` is null until a target pose is loaded (Epic 4). This story adds the rendering path; it will be visually testable once pose presets are loaded.
- The `DrawingStyle` interface already supports all needed properties (`color`, `lineWidth`, `radius`, `shadowColor`, `shadowBlur`, plus `objectFit`/`sourceWidth`/`sourceHeight` for coordinate mapping).
- `WireframeCanvas` uses `useAtomValue` for reactive subscriptions — adding `targetPoseAtom` follows the same pattern.
- The canvas is already mirrored via CSS `scale-x-[-1]` for front camera, so both wireframes mirror consistently.
- **Visibility guard** (Story 3.1 review): `calculate-similarity.ts` now rejects landmarks with `visibility < 0.1`. The drawing utilities in `drawing.ts` do NOT filter by visibility — they draw all valid (finite) landmarks. This is intentional: the wireframe should draw whatever is detected, while similarity scoring is stricter.
- **Score reset** (Story 3.1 review): `poseScoreAtom` resets to 0 when no target or no landmarks. FeedbackGlow handles this correctly (renders nothing when `targetPoseAtom` is null).
- **Logging** (Story 3.1 review): `workerLogger` now has a `log` method; all `console.log` replaced with `workerLogger` in worker code. Use `workerLogger` for any new worker-side logging.

### Project Structure Notes

- No new files created; modification to existing `wireframe-canvas.tsx` only
- Test co-location maintained in existing `wireframe-canvas.test.tsx`
- No conflicts with existing components

### References

- [Source: _bmad-output/planning-artifacts/epics/epic-3-pose-matching-visual-feedback.md#Story 3.3]
- [Source: _bmad-output/implementation-artifacts/2-4-wireframe-canvas-overlay.md#Dev Notes]
- [Source: _bmad-output/implementation-artifacts/3-1-pose-similarity-calculation.md#Completion Notes]
- [Source: src/components/camera/wireframe-canvas.tsx]
- [Source: src/lib/utils/drawing.ts]
- [Source: src/lib/utils/pose-connections.ts]
- [Source: src/lib/stores/pose-store.ts#targetPoseAtom]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `npx jest src/components/camera/wireframe-canvas.test.tsx` -- 7/7 passed
- `npx jest` -- full suite: 13 suites, 99 tests, 0 failures, 0 regressions

### Completion Notes List

- Added `TARGET_WIREFRAME_STYLE` constant with semi-transparent white (`rgba(255, 255, 255, 0.35)`), thin lines (1px), small dots (2px radius)
- Modified `WireframeCanvas` to subscribe to `targetPoseAtom` and draw target wireframe before user wireframe (target behind, user on top)
- Both wireframes share the same `getObjectFitMappingStyle` mapping and canvas, so coordinate alignment and mirroring are automatically consistent
- Added `targetPose` to drawing `useEffect` dependency array
- 3 new tests added (target-only, null target, both wireframes); all 7 wireframe tests pass

### File List

- src/components/camera/wireframe-canvas.tsx (MODIFIED)
- src/components/camera/wireframe-canvas.test.tsx (MODIFIED)

### Senior Developer Review (AI)

**Reviewer:** Code Review Workflow (Claude Opus 4.6)
**Outcome:** Approved with fixes applied

**Issues Found:** 0 High, 3 Medium, 1 Low
**Issues Fixed:** 3 (all MEDIUM)

| #   | Severity | Issue                                                                            | Fix Applied                                                                                                    |
| --- | -------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| M1  | MEDIUM   | Test didn't verify target wireframe style properties (color, lineWidth)          | Added assertions for `strokeStyle`, `fillStyle`, `lineWidth` in target-only test                               |
| M2  | MEDIUM   | "both wireframes" test didn't verify drawing order (AC2)                         | Added `strokeStyle` setter spy to track style assignment order; asserts target style applied before user style |
| M3  | MEDIUM   | `isMirrored` in drawing useEffect deps caused unnecessary redraws (pre-existing) | Removed `isMirrored` from dependency array — mirroring is CSS-only                                             |
| L1  | LOW      | `targetPose.length > 0` redundant check                                          | Not fixed — defensive, no harm                                                                                 |

### Change Log

- Implemented Story 3.3 target pose wireframe overlay; status set to `review`.
- Code review: improved test assertions for style and draw order, removed unnecessary useEffect dep; status set to `done`.
